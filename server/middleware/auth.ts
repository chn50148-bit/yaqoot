import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  findUserById,
  updateUser,
  type UserRecord,
  type UserRole,
} from '../db/repository.ts';

const FALLBACK_JWT_SECRET = crypto.randomBytes(32).toString('hex');

function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || FALLBACK_JWT_SECRET;
}

export interface AuthenticatedRequest extends Request {
  authUser?: UserRecord;
}

export function signAuthToken(user: UserRecord): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export async function syncTrialLockState(user: UserRecord): Promise<UserRecord> {
  // Teachers and administrators never receive student trial restrictions
  if (user.role !== 'student' || user.accessStatus === 'active' || !user.trialEndsAt) {
    return user;
  }
  const trialExpired = Date.now() > new Date(user.trialEndsAt).getTime();
  if (trialExpired && user.accessStatus !== 'locked') {
    const updated = await updateUser(user.id, { accessStatus: 'locked' });
    return updated ?? { ...user, accessStatus: 'locked' };
  }
  return user;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub?: string };
    if (!payload.sub || typeof payload.sub !== 'string') {
      res.status(401).json({ error: 'Invalid session token.' });
      return;
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'Account not found.' });
      return;
    }

    req.authUser = await syncTrialLockState(user);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'Access denied. You do not have permission for this resource.',
      });
      return;
    }
    next();
  };
}

export function requireUnlockedStudentAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (user.role === 'student' && user.accessStatus === 'locked') {
    res.status(403).json({
      code: 'DASHBOARD_LOCKED',
      error:
        'Your 3-day free trial has expired. Please submit an enrollment payment to continue learning.',
    });
    return;
  }
  next();
}
