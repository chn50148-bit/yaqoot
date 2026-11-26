import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import { THREE_DAYS_MS } from './server/catalog.ts';
import {
  createClassSession,
  createContactMessage,
  createCourse,
  createTeacher,
  createUser,
  deleteCourseSafe,
  findTeacherByEmail,
  findTeacherById,
  findTeacherByUserId,
  findUserByEmail,
  findUserById,
  hasAnyAdminUser,
  initDatabase,
  isUsingMongo,
  isValidMongoScheme,
  listAllClasses,
  listAllPayments,
  listClassesByStudent,
  listClassesByTeacher,
  listContactMessages,
  listCourses,
  listPaymentsByStudent,
  listPlans,
  listTeachers,
  listUsersByRole,
  normalizeMongoUri,
  updateClassSession,
  updateCourse,
  updateTeacher,
  updateUser,
  type AccessStatus,
  type ClassStatus,
  type UserRecord,
} from './server/db/repository.ts';
import {
  requireAuth,
  requireRole,
  requireUnlockedStudentAccess,
  signAuthToken,
  syncTrialLockState,
  type AuthenticatedRequest,
} from './server/middleware/auth.ts';
import {
  ClassSessionModel,
  PaymentModel,
  TeacherModel,
  UserModel,
  classSessionSchema,
  paymentSchema,
  teacherSchema,
  userSchema,
} from './server/models/schemas.ts';
import {
  PaymentGateway,
  PaymentGatewayError,
} from './server/services/paymentGateway.ts';

const DOTENV_PATH = path.resolve(process.cwd(), '.env');
const dotenvLoadedKeys = new Set<string>();

function syncEnvFromDotenv(): void {
  if (!fs.existsSync(DOTENV_PATH)) {
    return;
  }
  try {
    const parsed = dotenv.parse(fs.readFileSync(DOTENV_PATH, 'utf8'));
    for (const [key, rawValue] of Object.entries(parsed)) {
      const value = rawValue.trim();
      const current = process.env[key]?.trim();
      if (value && (!current || dotenvLoadedKeys.has(key))) {
        process.env[key] = value;
        dotenvLoadedKeys.add(key);
      }
    }
  } catch (err) {
    console.warn(
      '[Yaqoot Wal Marjan] Unable to read .env file:',
      err instanceof Error ? err.message : String(err)
    );
  }
}

syncEnvFromDotenv();

let activeMongoUri = '';
let lastFailedUri = '';
let lastFailedAt = 0;
let pendingConnectPromise: Promise<boolean> | null = null;
let lastInvalidWarningUri = '';
const RECONNECT_COOLDOWN_MS = 3000;

function getMongoStatusError(): string {
  const normalized = normalizeMongoUri(
    process.env.MONGODB_URI ?? process.env.MONGO_URI
  );
  if (!normalized) {
    return 'MongoDB is not connected. Add MONGODB_URI to your .env file or Settings -> Secrets to connect automatically.';
  }
  if (!isValidMongoScheme(normalized)) {
    return 'Invalid MONGODB_URI format. Expected your MongoDB Atlas connection string to start with "mongodb://" or "mongodb+srv://" (for example, mongodb+srv://username:password@cluster.mongodb.net/dbname).';
  }
  return 'MongoDB is currently unreachable. Verify your MONGODB_URI credentials and MongoDB Atlas Network Access rules.';
}

async function ensureMongoConnected(): Promise<boolean> {
  syncEnvFromDotenv();
  const mongoUri = normalizeMongoUri(
    process.env.MONGODB_URI ?? process.env.MONGO_URI
  );
  if (!mongoUri) {
    return false;
  }
  if (!isValidMongoScheme(mongoUri)) {
    if (lastInvalidWarningUri !== mongoUri) {
      lastInvalidWarningUri = mongoUri;
      console.warn(
        '[Yaqoot Wal Marjan] Invalid MONGODB_URI format. Connection string must start with "mongodb://" or "mongodb+srv://".'
      );
    }
    return false;
  }
  lastInvalidWarningUri = '';

  if (isUsingMongo() && activeMongoUri === mongoUri) {
    return true;
  }

  if (
    lastFailedUri === mongoUri &&
    Date.now() - lastFailedAt < RECONNECT_COOLDOWN_MS
  ) {
    return false;
  }

  if (pendingConnectPromise) {
    return pendingConnectPromise;
  }

  pendingConnectPromise = (async () => {
    try {
      if (
        mongoose.connection.readyState !== 0 &&
        activeMongoUri &&
        activeMongoUri !== mongoUri
      ) {
        await mongoose.connection.close();
      }
      const connected = await initDatabase(mongoUri);
      if (connected) {
        activeMongoUri = mongoUri;
        lastFailedUri = '';
        lastFailedAt = 0;
      } else {
        lastFailedUri = mongoUri;
        lastFailedAt = Date.now();
      }
      return connected;
    } catch {
      lastFailedUri = mongoUri;
      lastFailedAt = Date.now();
      return false;
    } finally {
      pendingConnectPromise = null;
    }
  })();

  return pendingConnectPromise;
}

export {
  userSchema,
  teacherSchema,
  classSessionSchema,
  classSessionSchema as classSchema,
  paymentSchema,
  UserModel,
  UserModel as User,
  TeacherModel,
  TeacherModel as Teacher,
  ClassSessionModel,
  ClassSessionModel as Class,
  PaymentModel,
  PaymentModel as Payment,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidHttpsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeUser(user: UserRecord) {
  const now = Date.now();
  const trialEndsMs = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() : 0;
  const trialRemainingMs =
    user.role === 'student' && user.accessStatus !== 'active' && trialEndsMs > 0
      ? Math.max(0, trialEndsMs - now)
      : 0;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    trialStartDate: user.trialStartDate,
    trialEndsAt: user.trialEndsAt,
    trialRemainingMs,
    accessStatus: user.accessStatus,
    enrolledPlanId: user.enrolledPlanId,
    enrolledPlanName: user.enrolledPlanName,
    preferredCourse: user.preferredCourse,
    assignedTeacherId: user.assignedTeacherId,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // Ignore malformed APP_URL
    }
  }
  const extraOrigins = process.env.CORS_ORIGIN?.trim();
  if (extraOrigins) {
    for (const entry of extraOrigins.split(',')) {
      const trimmed = entry.trim();
      if (trimmed && trimmed !== '*') {
        try {
          origins.add(new URL(trimmed).origin);
        } catch {
          // Ignore invalid origin
        }
      }
    }
  }
  return origins;
}

async function startServer() {
  await ensureMongoConnected();

  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin) {
      let originAllowed = allowedOrigins.has(requestOrigin);
      if (!originAllowed) {
        const forwardedHost =
          (typeof req.headers['x-forwarded-host'] === 'string'
            ? req.headers['x-forwarded-host'].split(',')[0].trim()
            : '') ||
          req.headers.host ||
          '';
        try {
          const parsedOrigin = new URL(requestOrigin);
          if (forwardedHost && parsedOrigin.host === forwardedHost) {
            originAllowed = true;
          }
        } catch {
          originAllowed = false;
        }
      }
      if (originAllowed) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Vary', 'Origin');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization'
        );
      }
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  const requireMongoConnected: express.RequestHandler = async (_req, res, next) => {
    const connected = await ensureMongoConnected();
    if (!connected) {
      res.status(503).json({
        error: getMongoStatusError(),
      });
      return;
    }
    next();
  };

  // ---------- PUBLIC CATALOG & CONTACT ----------
  app.get('/api/health', async (_req, res) => {
    const connected = await ensureMongoConnected();
    res.status(connected ? 200 : 503).json({
      ok: connected,
      database: 'mongodb',
      mongoConnected: connected,
      ...(connected ? {} : { message: getMongoStatusError() }),
    });
  });

  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/payments/methods') {
      next();
      return;
    }
    requireMongoConnected(req, res, next);
  });

  app.get('/api/teachers', async (_req, res) => {
    try {
      const teachers = await listTeachers(false);
      res.json({ teachers });
    } catch {
      res.status(500).json({ error: 'Unable to load teachers.' });
    }
  });

  app.get('/api/courses', async (_req, res) => {
    try {
      const courses = await listCourses(false);
      res.json({ courses });
    } catch {
      res.status(500).json({ error: 'Unable to load courses.' });
    }
  });

  app.get('/api/plans', async (_req, res) => {
    try {
      const plans = await listPlans();
      res.json({ plans });
    } catch {
      res.status(500).json({ error: 'Unable to load plans.' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, phone, message } = req.body ?? {};
      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof message !== 'string'
      ) {
        res.status(400).json({ error: 'Name, email, and message are required.' });
        return;
      }
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanMessage = message.trim();
      const cleanPhone = typeof phone === 'string' ? phone.trim().slice(0, 30) : '';

      if (cleanName.length < 2 || !EMAIL_REGEX.test(cleanEmail) || cleanMessage.length < 5) {
        res.status(400).json({ error: 'Please provide valid contact details and message.' });
        return;
      }

      const saved = await createContactMessage({
        name: cleanName.slice(0, 80),
        email: cleanEmail,
        phone: cleanPhone,
        message: cleanMessage.slice(0, 1200),
      });
      res.status(201).json({
        message: 'Thank you. Our academy admissions team has received your inquiry.',
        inquiry: saved,
      });
    } catch {
      res.status(500).json({ error: 'Unable to submit contact inquiry.' });
    }
  });

  // ---------- ADMIN FIRST-RUN BOOTSTRAP (LOCKED ONCE ADMIN EXISTS OR .ENV SET) ----------
  app.get('/api/admin/bootstrap-status', async (_req, res) => {
    try {
      const envConfigured = Boolean(
        process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()
      );
      if (envConfigured) {
        res.json({ needsClaim: false });
        return;
      }
      const adminExists = await hasAnyAdminUser();
      res.json({ needsClaim: !adminExists });
    } catch {
      res.status(500).json({ error: 'Unable to verify admin setup status.' });
    }
  });

  app.post('/api/admin/bootstrap', async (req, res) => {
    try {
      const envConfigured = Boolean(
        process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()
      );
      if (envConfigured || (await hasAnyAdminUser())) {
        res.status(403).json({
          error: 'Administrator account is already configured. Please sign in.',
        });
        return;
      }

      const { name, email, password } = req.body ?? {};
      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
      ) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      if (cleanName.length < 2 || !EMAIL_REGEX.test(cleanEmail) || password.length < 8) {
        res.status(400).json({
          error: 'Provide a valid name, email, and password (at least 8 characters).',
        });
        return;
      }

      const existing = await findUserByEmail(cleanEmail);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const adminUser = await createUser({
        name: cleanName.slice(0, 80),
        email: cleanEmail,
        passwordHash,
        role: 'admin',
        trialStartDate: null,
        trialEndsAt: null,
        accessStatus: 'active',
        enrolledPlanId: null,
        enrolledPlanName: null,
        preferredCourse: 'Administration',
        assignedTeacherId: '',
      });

      const token = signAuthToken(adminUser);
      res.status(201).json({ token, user: sanitizeUser(adminUser) });
    } catch {
      res.status(500).json({ error: 'Unable to claim administrator account.' });
    }
  });

  // ---------- STUDENT REGISTRATION & ROLE-VERIFIED LOGIN ----------
  const handleRegister: express.RequestHandler = async (req, res) => {
    try {
      const { name, email, password, preferredCourse } = req.body ?? {};

      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
      ) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (cleanName.length < 2 || cleanName.length > 80) {
        res.status(400).json({ error: 'Please enter a valid full name.' });
        return;
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (password.length < 6) {
        res
          .status(400)
          .json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const existing = await findUserByEmail(cleanEmail);
      if (existing) {
        res.status(409).json({
          error: 'An account with this email already exists. Please sign in.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const now = Date.now();
      const trialStartDate = new Date(now).toISOString();
      const trialEndsAt = new Date(now + THREE_DAYS_MS).toISOString();
      const courseName =
        typeof preferredCourse === 'string' && preferredCourse.trim()
          ? preferredCourse.trim().slice(0, 60)
          : 'Noorani Qaida';

      // Always force role: 'student' on public registration
      const newUser = await createUser({
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: 'student',
        trialStartDate,
        trialEndsAt,
        accessStatus: 'trial',
        enrolledPlanId: null,
        enrolledPlanName: null,
        preferredCourse: courseName,
        assignedTeacherId: '',
      });

      const token = signAuthToken(newUser);
      res.status(201).json({ token, user: sanitizeUser(newUser) });
    } catch {
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  };

  const handleLogin: express.RequestHandler = async (req, res) => {
    try {
      const { email, password, expectedRole } = req.body ?? {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      const user = await findUserByEmail(cleanEmail);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      if (
        typeof expectedRole === 'string' &&
        ['student', 'teacher', 'admin'].includes(expectedRole) &&
        user.role !== expectedRole
      ) {
        res.status(403).json({
          error: `This account does not have ${expectedRole} access. Please use the correct login portal.`,
        });
        return;
      }

      const syncedUser = await syncTrialLockState(user);
      const token = signAuthToken(syncedUser);
      res.json({ token, user: sanitizeUser(syncedUser) });
    } catch {
      res.status(500).json({ error: 'Sign in failed. Please try again.' });
    }
  };

  app.post('/api/auth/register', handleRegister);
  app.post('/register', requireMongoConnected, handleRegister);

  app.post('/api/auth/login', handleLogin);
  app.post('/login', requireMongoConnected, handleLogin);

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  // ---------- STUDENT PORTAL & UNIFIED DASHBOARD ROUTES ----------
  const handleStudentDashboard: express.RequestHandler = async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const user = req.authUser!;
      const [teacher, payments, classes, plans] = await Promise.all([
        user.assignedTeacherId
          ? findTeacherById(user.assignedTeacherId)
          : Promise.resolve(null),
        listPaymentsByStudent(user.id),
        user.accessStatus === 'locked'
          ? Promise.resolve([])
          : listClassesByStudent(user.id),
        listPlans(),
      ]);

      res.json({
        user: sanitizeUser(user),
        assignedTeacher: teacher,
        payments,
        classes,
        plans,
      });
    } catch {
      res.status(500).json({ error: 'Unable to load student dashboard.' });
    }
  };

  const handleUnifiedDashboard: express.RequestHandler = async (
    req: AuthenticatedRequest,
    res,
    next
  ) => {
    const user = req.authUser!;
    if (user.role === 'student') {
      return handleStudentDashboard(req, res, next);
    }
    res.json({ user: sanitizeUser(user) });
  };

  app.get(
    '/api/student/dashboard',
    requireAuth,
    requireRole('student'),
    handleStudentDashboard
  );
  app.get('/api/dashboard', requireAuth, handleUnifiedDashboard);
  app.get(
    '/dashboard',
    (req, res, next) => {
      const wantsHtml =
        typeof req.headers.accept === 'string' &&
        req.headers.accept.includes('text/html') &&
        !req.headers.authorization;
      if (wantsHtml) {
        next('route');
        return;
      }
      next();
    },
    requireMongoConnected,
    requireAuth,
    handleUnifiedDashboard
  );

  app.get(
    '/api/classes',
    requireAuth,
    requireRole('student'),
    requireUnlockedStudentAccess,
    async (req: AuthenticatedRequest, res) => {
      try {
        const classes = await listClassesByStudent(req.authUser!.id);
        res.json({ classes });
      } catch {
        res.status(500).json({ error: 'Unable to load classes.' });
      }
    }
  );

  app.post(
    '/api/student/simulate-expiry',
    requireAuth,
    requireRole('student'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.authUser!;
        if (user.accessStatus === 'active') {
          res.status(400).json({
            error: 'Active paid accounts cannot be locked by trial expiry.',
          });
          return;
        }
        const expiredDate = new Date(Date.now() - 60_000).toISOString();
        const updated = await updateUser(user.id, {
          trialEndsAt: expiredDate,
          accessStatus: 'locked',
        });
        res.json({ user: sanitizeUser(updated ?? user) });
      } catch {
        res.status(500).json({ error: 'Unable to update trial status.' });
      }
    }
  );

  app.get('/api/payments/methods', (_req, res) => {
    res.json({ methods: PaymentGateway.getSupportedChannels() });
  });

  // Payment submission ALWAYS creates a 'pending' record until verified by Admin
  app.post(
    '/api/payments/checkout',
    requireAuth,
    requireRole('student'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.authUser!;
        const { planId, paymentMethod, accountLabel, transactionRef } = req.body ?? {};

        const { payment, channel } = await PaymentGateway.processManualPayment({
          student: user,
          planId,
          paymentMethod,
          accountLabel,
          transactionRef,
        });

        res.status(201).json({
          message: `${channel.displayName} payment submitted and marked Pending Verification. Your dashboard will unlock as soon as the Admin verifies your payment.`,
          payment,
        });
      } catch (err) {
        if (err instanceof PaymentGatewayError) {
          res.status(err.statusCode).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: 'Unable to submit payment details.' });
      }
    }
  );

  // ---------- TEACHER DASHBOARD ROUTE (ISOLATED TO ASSIGNED DATA ONLY) ----------
  app.get(
    '/api/teacher/dashboard',
    requireAuth,
    requireRole('teacher'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.authUser!;
        const teacherProfile =
          (await findTeacherByUserId(user.id)) ||
          (await findTeacherByEmail(user.email));

        if (!teacherProfile) {
          res.status(404).json({
            error: 'Teacher profile not linked. Contact the Academy Administrator.',
          });
          return;
        }

        const [allStudents, classes] = await Promise.all([
          listUsersByRole('student'),
          listClassesByTeacher(teacherProfile.id),
        ]);

        const assignedStudents = allStudents
          .filter((s) => s.assignedTeacherId === teacherProfile.id)
          .map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            preferredCourse: s.preferredCourse,
            accessStatus: s.accessStatus,
            enrolledPlanName: s.enrolledPlanName,
          }));

        res.json({
          user: sanitizeUser(user),
          teacher: teacherProfile,
          students: assignedStudents,
          classes,
        });
      } catch {
        res.status(500).json({ error: 'Unable to load teacher dashboard.' });
      }
    }
  );

  // ---------- ADMIN ROUTES (ROLE === 'admin' ONLY) ----------
  app.get(
    '/api/admin/overview',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const [studentsRaw, teachers, classes, payments, courses, messages] =
          await Promise.all([
            listUsersByRole('student'),
            listTeachers(true),
            listAllClasses(),
            listAllPayments(),
            listCourses(true),
            listContactMessages(),
          ]);

        const students = await Promise.all(studentsRaw.map(syncTrialLockState));
        const activeStudents = students.filter((s) => s.accessStatus === 'active').length;
        const trialStudents = students.filter((s) => s.accessStatus === 'trial').length;
        const expiredTrials = students.filter((s) => s.accessStatus === 'locked').length;
        const pendingPayments = payments.filter((p) => p.status === 'pending').length;
        const approvedRevenueUsd = payments
          .filter((p) => p.status === 'approved')
          .reduce((sum, p) => sum + p.amountUsd, 0);

        res.json({
          stats: {
            totalStudents: students.length,
            totalTeachers: teachers.length,
            totalClasses: classes.length,
            activeStudents,
            trialStudents,
            expiredTrials,
            totalCourses: courses.length,
            pendingPayments,
            approvedRevenueUsd,
            unreadMessages: messages.length,
          },
        });
      } catch {
        res.status(500).json({ error: 'Unable to load admin overview.' });
      }
    }
  );

  app.get(
    '/api/admin/students',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const [studentsRaw, payments] = await Promise.all([
          listUsersByRole('student'),
          listAllPayments(),
        ]);
        const students = await Promise.all(studentsRaw.map(syncTrialLockState));
        res.json({
          students: students.map((s) => ({
            ...sanitizeUser(s),
            payments: payments.filter((p) => p.studentId === s.id),
          })),
        });
      } catch {
        res.status(500).json({ error: 'Unable to load students.' });
      }
    }
  );

  app.patch(
    '/api/admin/students/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const studentId = req.params.id;
        const target = await findUserById(studentId);
        if (!target || target.role !== 'student') {
          res.status(404).json({ error: 'Student not found.' });
          return;
        }

        const { name, preferredCourse, assignedTeacherId, accessStatus, enrolledPlanId } =
          req.body ?? {};
        const patch: Partial<Omit<UserRecord, 'id'>> = {};

        if (typeof name === 'string' && name.trim().length >= 2) {
          patch.name = name.trim().slice(0, 80);
        }
        if (typeof preferredCourse === 'string' && preferredCourse.trim()) {
          patch.preferredCourse = preferredCourse.trim().slice(0, 80);
        }
        if (typeof assignedTeacherId === 'string') {
          patch.assignedTeacherId = assignedTeacherId.trim();
        }
        if (
          typeof accessStatus === 'string' &&
          ['trial', 'locked', 'active'].includes(accessStatus)
        ) {
          patch.accessStatus = accessStatus as AccessStatus;
        }
        if (typeof enrolledPlanId === 'string') {
          const plans = await listPlans();
          const plan = plans.find((p) => p.id === enrolledPlanId);
          if (plan) {
            patch.enrolledPlanId = plan.id;
            patch.enrolledPlanName = plan.name;
          } else if (enrolledPlanId === '') {
            patch.enrolledPlanId = null;
            patch.enrolledPlanName = null;
          }
        }

        const updated = await updateUser(studentId, patch);
        res.json({ student: sanitizeUser(updated ?? target) });
      } catch {
        res.status(500).json({ error: 'Unable to update student.' });
      }
    }
  );

  app.get(
    '/api/admin/teachers',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const [teachers, students, classes] = await Promise.all([
          listTeachers(true),
          listUsersByRole('student'),
          listAllClasses(),
        ]);
        res.json({
          teachers: teachers.map((t) => ({
            ...t,
            assignedStudentCount: students.filter((s) => s.assignedTeacherId === t.id)
              .length,
            scheduledClassCount: classes.filter((c) => c.teacherId === t.id).length,
          })),
        });
      } catch {
        res.status(500).json({ error: 'Unable to load teachers.' });
      }
    }
  );

  app.post(
    '/api/admin/teachers',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const {
          name,
          email,
          password,
          title,
          qualifications,
          experienceYears,
          languages,
          specialty,
          bio,
          availability,
          photoUrl,
        } = req.body ?? {};

        if (
          typeof name !== 'string' ||
          typeof email !== 'string' ||
          typeof password !== 'string' ||
          typeof qualifications !== 'string'
        ) {
          res.status(400).json({
            error: 'Name, email, password, and qualifications are required.',
          });
          return;
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        if (cleanName.length < 2 || !EMAIL_REGEX.test(cleanEmail) || password.length < 6) {
          res.status(400).json({
            error: 'Provide a valid teacher name, email, and password (min 6 chars).',
          });
          return;
        }

        if (await findUserByEmail(cleanEmail)) {
          res.status(409).json({ error: 'An account with this email already exists.' });
          return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const teacherUser = await createUser({
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          role: 'teacher',
          trialStartDate: null,
          trialEndsAt: null,
          accessStatus: 'active',
          enrolledPlanId: null,
          enrolledPlanName: null,
          preferredCourse: 'Faculty',
          assignedTeacherId: '',
        });

        const cleanLanguages = Array.isArray(languages)
          ? languages.map((l) => String(l).trim()).filter(Boolean)
          : typeof languages === 'string'
          ? languages
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean)
          : ['English', 'Arabic'];

        const safePhoto =
          typeof photoUrl === 'string' &&
          (photoUrl.startsWith('/src/assets/') || isValidHttpsUrl(photoUrl))
            ? photoUrl.trim()
            : '/src/assets/images/teacher_tariq_1795605516935.jpg';

        const teacher = await createTeacher({
          userId: teacherUser.id,
          slug: `${slugify(cleanName)}-${Date.now().toString(36)}`,
          name: cleanName,
          email: cleanEmail,
          title:
            typeof title === 'string' && title.trim()
              ? title.trim()
              : 'Certified Quran Instructor',
          photoUrl: safePhoto,
          qualifications: qualifications.trim(),
          experienceYears: Number(experienceYears) > 0 ? Number(experienceYears) : 5,
          languages: cleanLanguages.length > 0 ? cleanLanguages : ['English'],
          specialty:
            typeof specialty === 'string' && specialty.trim()
              ? specialty.trim()
              : 'Quran & Tajweed',
          bio:
            typeof bio === 'string' && bio.trim()
              ? bio.trim()
              : 'Certified Quran scholar dedicated to structured 1-on-1 instruction.',
          availability:
            typeof availability === 'string' && availability.trim()
              ? availability.trim()
              : 'Mon – Fri · Flexible Slots',
          isActive: true,
        });

        res.status(201).json({ teacher });
      } catch {
        res.status(500).json({ error: 'Unable to create teacher account.' });
      }
    }
  );

  app.patch(
    '/api/admin/teachers/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const teacherId = req.params.id;
        const existing = await findTeacherById(teacherId);
        if (!existing) {
          res.status(404).json({ error: 'Teacher not found.' });
          return;
        }

        const {
          name,
          title,
          qualifications,
          experienceYears,
          languages,
          specialty,
          bio,
          availability,
          isActive,
        } = req.body ?? {};

        const patch: Record<string, unknown> = {};
        if (typeof name === 'string' && name.trim()) patch.name = name.trim();
        if (typeof title === 'string' && title.trim()) patch.title = title.trim();
        if (typeof qualifications === 'string' && qualifications.trim())
          patch.qualifications = qualifications.trim();
        if (typeof experienceYears === 'number' && experienceYears >= 0)
          patch.experienceYears = experienceYears;
        if (Array.isArray(languages))
          patch.languages = languages.map((l) => String(l).trim()).filter(Boolean);
        else if (typeof languages === 'string')
          patch.languages = languages
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean);
        if (typeof specialty === 'string' && specialty.trim())
          patch.specialty = specialty.trim();
        if (typeof bio === 'string' && bio.trim()) patch.bio = bio.trim();
        if (typeof availability === 'string' && availability.trim())
          patch.availability = availability.trim();
        if (typeof isActive === 'boolean') patch.isActive = isActive;

        const updated = await updateTeacher(teacherId, patch);
        res.json({ teacher: updated });
      } catch {
        res.status(500).json({ error: 'Unable to update teacher.' });
      }
    }
  );

  // Admin Course Management
  app.get(
    '/api/admin/courses',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const courses = await listCourses(true);
        res.json({ courses });
      } catch {
        res.status(500).json({ error: 'Unable to load courses.' });
      }
    }
  );

  app.post(
    '/api/admin/courses',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const { number, title, description, isAvailable } = req.body ?? {};
        if (typeof title !== 'string' || typeof description !== 'string') {
          res.status(400).json({ error: 'Course title and description are required.' });
          return;
        }
        const cleanTitle = title.trim();
        const existingCourses = await listCourses(true);
        const nextNum =
          typeof number === 'string' && number.trim()
            ? number.trim()
            : `${String(existingCourses.length + 1).padStart(2, '0')}.`;

        const course = await createCourse({
          slug: `${slugify(cleanTitle)}-${Date.now().toString(36)}`,
          number: nextNum,
          title: cleanTitle,
          description: description.trim(),
          isAvailable: isAvailable !== false,
        });
        res.status(201).json({ course });
      } catch {
        res.status(500).json({ error: 'Unable to create course.' });
      }
    }
  );

  app.patch(
    '/api/admin/courses/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const { number, title, description, isAvailable } = req.body ?? {};
        const patch: Record<string, unknown> = {};
        if (typeof number === 'string' && number.trim()) patch.number = number.trim();
        if (typeof title === 'string' && title.trim()) patch.title = title.trim();
        if (typeof description === 'string' && description.trim())
          patch.description = description.trim();
        if (typeof isAvailable === 'boolean') patch.isAvailable = isAvailable;

        const updated = await updateCourse(req.params.id, patch);
        if (!updated) {
          res.status(404).json({ error: 'Course not found.' });
          return;
        }
        res.json({ course: updated });
      } catch {
        res.status(500).json({ error: 'Unable to update course.' });
      }
    }
  );

  app.delete(
    '/api/admin/courses/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const result = await deleteCourseSafe(req.params.id);
        if (!result.deleted) {
          res.status(409).json({ error: result.reason || 'Unable to delete course.' });
          return;
        }
        res.json({ deleted: true });
      } catch {
        res.status(500).json({ error: 'Unable to delete course.' });
      }
    }
  );

  // Admin Class Scheduling (Manual Google Meet URL strictly validated)
  app.get(
    '/api/admin/classes',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const classes = await listAllClasses();
        res.json({ classes });
      } catch {
        res.status(500).json({ error: 'Unable to load classes.' });
      }
    }
  );

  app.post(
    '/api/admin/classes',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const {
          studentId,
          teacherId,
          courseId,
          courseTitle,
          classDate,
          classTime,
          durationMinutes,
          meetingUrl,
          sessionType,
        } = req.body ?? {};

        if (
          typeof studentId !== 'string' ||
          typeof teacherId !== 'string' ||
          typeof courseTitle !== 'string' ||
          typeof classDate !== 'string' ||
          typeof classTime !== 'string' ||
          typeof meetingUrl !== 'string'
        ) {
          res.status(400).json({
            error:
              'Student, teacher, course, date, time, and Google Meet link are required.',
          });
          return;
        }

        const cleanMeetingUrl = meetingUrl.trim();
        if (!isValidHttpsUrl(cleanMeetingUrl)) {
          res.status(400).json({
            error:
              'Please provide a valid https:// Google Meet link (e.g. https://meet.google.com/abc-defg-hij).',
          });
          return;
        }

        const [student, teacher] = await Promise.all([
          findUserById(studentId),
          findTeacherById(teacherId),
        ]);

        if (!student || student.role !== 'student') {
          res.status(404).json({ error: 'Selected student not found.' });
          return;
        }
        if (!teacher) {
          res.status(404).json({ error: 'Selected teacher not found.' });
          return;
        }

        const created = await createClassSession({
          studentId: student.id,
          studentName: student.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          courseId: typeof courseId === 'string' ? courseId : '',
          courseTitle: courseTitle.trim(),
          classDate: classDate.trim(),
          classTime: classTime.trim(),
          durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 30,
          meetingUrl: cleanMeetingUrl,
          sessionType: sessionType === 'enrolled' ? 'enrolled' : 'trial',
          status: 'scheduled',
        });

        // Also assign teacher to student if not yet assigned
        if (!student.assignedTeacherId) {
          await updateUser(student.id, { assignedTeacherId: teacher.id });
        }

        res.status(201).json({ classSession: created });
      } catch {
        res.status(500).json({ error: 'Unable to schedule class.' });
      }
    }
  );

  app.patch(
    '/api/admin/classes/:id',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
      try {
        const { classDate, classTime, durationMinutes, meetingUrl, status } =
          req.body ?? {};
        const patch: Record<string, unknown> = {};

        if (typeof classDate === 'string' && classDate.trim())
          patch.classDate = classDate.trim();
        if (typeof classTime === 'string' && classTime.trim())
          patch.classTime = classTime.trim();
        if (typeof durationMinutes === 'number' && durationMinutes > 0)
          patch.durationMinutes = durationMinutes;
        if (typeof meetingUrl === 'string' && meetingUrl.trim()) {
          if (!isValidHttpsUrl(meetingUrl.trim())) {
            res.status(400).json({
              error: 'Meeting URL must start with https://',
            });
            return;
          }
          patch.meetingUrl = meetingUrl.trim();
        }
        if (
          typeof status === 'string' &&
          ['scheduled', 'completed', 'cancelled'].includes(status)
        ) {
          patch.status = status as ClassStatus;
        }

        const updated = await updateClassSession(req.params.id, patch);
        if (!updated) {
          res.status(404).json({ error: 'Class not found.' });
          return;
        }
        res.json({ classSession: updated });
      } catch {
        res.status(500).json({ error: 'Unable to update class.' });
      }
    }
  );

  // Admin Payment Verification (Approve / Reject)
  app.get(
    '/api/admin/payments',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const payments = await listAllPayments();
        res.json({ payments });
      } catch {
        res.status(500).json({ error: 'Unable to load payments.' });
      }
    }
  );

  app.patch(
    '/api/admin/payments/:id',
    requireAuth,
    requireRole('admin'),
    async (req: AuthenticatedRequest, res) => {
      try {
        const { status, adminNote } = req.body ?? {};
        const { payment } = await PaymentGateway.verifyManualPayment({
          paymentId: req.params.id,
          adminUser: req.authUser!,
          decision: status,
          adminNote,
        });

        res.json({ payment });
      } catch (err) {
        if (err instanceof PaymentGatewayError) {
          res.status(err.statusCode).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: 'Unable to update payment review.' });
      }
    }
  );

  app.get(
    '/api/admin/messages',
    requireAuth,
    requireRole('admin'),
    async (_req, res) => {
      try {
        const messages = await listContactMessages();
        res.json({ messages });
      } catch {
        res.status(500).json({ error: 'Unable to load messages.' });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Yaqoot Wal Marjan] Server listening on port ${PORT}`);
  });

  let envWatcher: fs.FSWatcher | null = null;
  let envWatchTimer: ReturnType<typeof setTimeout> | null = null;
  try {
    envWatcher = fs.watch(process.cwd(), (_eventType, filename) => {
      if (filename && filename.toString() === '.env') {
        if (envWatchTimer) {
          clearTimeout(envWatchTimer);
        }
        envWatchTimer = setTimeout(() => {
          void ensureMongoConnected();
        }, 250);
      }
    });
  } catch {
    // Ignore watcher errors on read-only filesystems
  }

  const shutdown = async () => {
    if (envWatchTimer) {
      clearTimeout(envWatchTimer);
    }
    envWatcher?.close();
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
