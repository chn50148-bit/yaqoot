import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  COURSE_PLANS,
  COURSES_SEED,
  TEACHERS_SEED,
  type CoursePlan,
} from '../catalog.ts';
import {
  ClassSessionModel,
  ContactMessageModel,
  CourseModel,
  PaymentModel,
  PlanModel,
  TeacherModel,
  UserModel,
} from '../models/schemas.ts';

export type AccessStatus = 'trial' | 'locked' | 'active';
export type UserRole = 'student' | 'teacher' | 'admin';
export type PaymentMethod = 'paypal' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type ClassStatus = 'scheduled' | 'completed' | 'cancelled';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  trialStartDate: string | null;
  trialEndsAt: string | null;
  accessStatus: AccessStatus;
  enrolledPlanId: string | null;
  enrolledPlanName: string | null;
  preferredCourse: string;
  assignedTeacherId: string;
}

export interface TeacherRecord {
  id: string;
  userId: string | null;
  slug: string;
  name: string;
  email: string;
  title: string;
  photoUrl: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  specialty: string;
  bio: string;
  availability: string;
  isActive: boolean;
}

export interface CourseRecord {
  id: string;
  slug: string;
  number: string;
  title: string;
  description: string;
  isAvailable: boolean;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  planId: string;
  planName: string;
  amountUsd: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  accountLabel: string;
  requiresManualVerification: boolean;
  status: PaymentStatus;
  adminNote: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ClassSessionRecord {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseTitle: string;
  classDate: string;
  classTime: string;
  durationMinutes: number;
  meetingUrl: string;
  sessionType: 'trial' | 'enrolled';
  status: ClassStatus;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

function assertMongoConnected(): void {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected.');
  }
}

function mapMongoUser(doc: Record<string, unknown>): UserRecord {
  return {
    id: String(doc._id),
    name: String(doc.name),
    email: String(doc.email),
    passwordHash: String(doc.passwordHash),
    role: (doc.role as UserRole) || 'student',
    trialStartDate: doc.trialStartDate
      ? new Date(doc.trialStartDate as string | Date).toISOString()
      : null,
    trialEndsAt: doc.trialEndsAt
      ? new Date(doc.trialEndsAt as string | Date).toISOString()
      : null,
    accessStatus: (doc.accessStatus as AccessStatus) || 'trial',
    enrolledPlanId: doc.enrolledPlanId ? String(doc.enrolledPlanId) : null,
    enrolledPlanName: doc.enrolledPlanName ? String(doc.enrolledPlanName) : null,
    preferredCourse: String(doc.preferredCourse || 'Noorani Qaida'),
    assignedTeacherId: String(doc.assignedTeacherId || ''),
  };
}

function mapMongoTeacher(doc: Record<string, unknown>): TeacherRecord {
  return {
    id: String(doc._id),
    userId: doc.userId ? String(doc.userId) : null,
    slug: String(doc.slug),
    name: String(doc.name),
    email: String(doc.email),
    title: String(doc.title),
    photoUrl: String(doc.photoUrl),
    qualifications: String(doc.qualifications),
    experienceYears: Number(doc.experienceYears),
    languages: Array.isArray(doc.languages) ? doc.languages.map(String) : [],
    specialty: String(doc.specialty),
    bio: String(doc.bio),
    availability: String(doc.availability),
    isActive: doc.isActive !== false,
  };
}

function mapMongoCourse(doc: Record<string, unknown>): CourseRecord {
  return {
    id: String(doc._id),
    slug: String(doc.slug),
    number: String(doc.number),
    title: String(doc.title),
    description: String(doc.description),
    isAvailable: doc.isAvailable !== false,
  };
}

function mapMongoPayment(doc: Record<string, unknown>): PaymentRecord {
  return {
    id: String(doc._id),
    studentId: String(doc.studentId),
    studentName: String(doc.studentName || 'Student'),
    studentEmail: String(doc.studentEmail || ''),
    planId: String(doc.planId),
    planName: String(doc.planName),
    amountUsd: Number(doc.amountUsd),
    paymentMethod: doc.paymentMethod as PaymentMethod,
    transactionRef: String(doc.transactionRef),
    accountLabel: String(doc.accountLabel),
    requiresManualVerification: doc.requiresManualVerification !== false,
    status: (doc.status as PaymentStatus) || 'pending',
    adminNote: String(doc.adminNote || ''),
    submittedAt: new Date(
      (doc.submittedAt || doc.paidAt || Date.now()) as string | Date
    ).toISOString(),
    reviewedAt: doc.reviewedAt
      ? new Date(doc.reviewedAt as string | Date).toISOString()
      : null,
  };
}

function mapMongoClass(doc: Record<string, unknown>): ClassSessionRecord {
  return {
    id: String(doc._id),
    studentId: String(doc.studentId),
    studentName: String(doc.studentName || 'Student'),
    teacherId: String(doc.teacherId),
    teacherName: String(doc.teacherName),
    courseId: String(doc.courseId || ''),
    courseTitle: String(doc.courseTitle),
    classDate: String(doc.classDate),
    classTime: String(doc.classTime),
    durationMinutes: Number(doc.durationMinutes),
    meetingUrl: String(doc.meetingUrl),
    sessionType: (doc.sessionType as 'trial' | 'enrolled') || 'trial',
    status: (doc.status as ClassStatus) || 'scheduled',
  };
}

async function seedEnvAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim() || 'Academy Administrator';

  if (!adminEmail || !adminPassword) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const existing = await findUserByEmail(adminEmail);

  if (!existing) {
    await createUser({
      name: adminName,
      email: adminEmail,
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
  } else {
    await updateUser(existing.id, {
      name: adminName,
      passwordHash,
      role: 'admin',
      accessStatus: 'active',
    });
  }
}

export function normalizeMongoUri(rawUri?: string): string {
  let value = (rawUri ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  // Strip accidental key prefix if pasted as "MONGODB_URI=mongodb+srv://..."
  value = value.replace(/^(MONGODB_URI|MONGO_URI)\s*=\s*/i, '').trim();
  // Strip surrounding straight/smart quotes or backticks
  while (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('`') && value.endsWith('`')) ||
      (value.startsWith('“') && value.endsWith('”')) ||
      (value.startsWith('‘') && value.endsWith('’')))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value.replace(/^(MONGODB_URI|MONGO_URI)\s*=\s*/i, '').trim();
}

export function isValidMongoScheme(uri: string): boolean {
  return /^mongodb(\+srv)?:\/\//i.test(uri);
}

export async function initDatabase(mongoUriOverride?: string): Promise<boolean> {
  const rawUri =
    mongoUriOverride ?? process.env.MONGODB_URI ?? process.env.MONGO_URI;
  const mongoUri = normalizeMongoUri(rawUri);
  if (!mongoUri) {
    console.warn(
      '[Yaqoot Wal Marjan] MONGODB_URI is not configured. Add MONGODB_URI to connect to MongoDB.'
    );
    return false;
  }

  if (!isValidMongoScheme(mongoUri)) {
    console.warn(
      '[Yaqoot Wal Marjan] Invalid MONGODB_URI format. Connection string must start with "mongodb://" or "mongodb+srv://".'
    );
    return false;
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    }

    if ((await TeacherModel.countDocuments()) === 0) {
      await TeacherModel.insertMany(TEACHERS_SEED);
    }
    if ((await CourseModel.countDocuments()) === 0) {
      await CourseModel.insertMany(COURSES_SEED);
    }
    if ((await PlanModel.countDocuments()) === 0) {
      await PlanModel.insertMany(
        COURSE_PLANS.map((p) => ({
          planId: p.id,
          name: p.name,
          priceUsd: p.priceUsd,
          billingCycle: p.billingCycle,
          sessionsPerWeek: p.sessionsPerWeek,
          durationMinutes: p.durationMinutes,
          features: p.features,
          isAvailable: p.isAvailable,
        }))
      );
    }

    await seedEnvAdmin();
    console.log('[Yaqoot Wal Marjan] Connected exclusively to MongoDB via Mongoose');
    return true;
  } catch (err) {
    console.error(
      '[Yaqoot Wal Marjan] MongoDB connection error:',
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

export function isUsingMongo(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function hasAnyAdminUser(): Promise<boolean> {
  assertMongoConnected();
  const count = await UserModel.countDocuments({ role: 'admin' });
  return count > 0;
}

// ---------- USERS ----------
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  assertMongoConnected();
  const cleanEmail = email.trim().toLowerCase();
  const doc = await UserModel.findOne({ email: cleanEmail }).lean();
  return doc ? mapMongoUser(doc as Record<string, unknown>) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  assertMongoConnected();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await UserModel.findById(id).lean();
  return doc ? mapMongoUser(doc as Record<string, unknown>) : null;
}

export async function listUsersByRole(role?: UserRole): Promise<UserRecord[]> {
  assertMongoConnected();
  const query = role ? { role } : {};
  const docs = await UserModel.find(query).sort({ createdAt: -1 }).lean();
  return docs.map((d) => mapMongoUser(d as Record<string, unknown>));
}

export async function createUser(
  input: Omit<UserRecord, 'id'>
): Promise<UserRecord> {
  assertMongoConnected();
  const created = await UserModel.create({
    ...input,
    trialStartDate: input.trialStartDate ? new Date(input.trialStartDate) : null,
    trialEndsAt: input.trialEndsAt ? new Date(input.trialEndsAt) : null,
  });
  return mapMongoUser(created.toObject() as unknown as Record<string, unknown>);
}

export async function updateUser(
  userId: string,
  patch: Partial<Omit<UserRecord, 'id'>>
): Promise<UserRecord | null> {
  assertMongoConnected();
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const mongoPatch: Record<string, unknown> = { ...patch };
  if (patch.trialEndsAt) {
    mongoPatch.trialEndsAt = new Date(patch.trialEndsAt);
  }
  if (patch.trialStartDate) {
    mongoPatch.trialStartDate = new Date(patch.trialStartDate);
  }
  const updated = await UserModel.findByIdAndUpdate(
    userId,
    { $set: mongoPatch },
    { new: true }
  ).lean();
  return updated ? mapMongoUser(updated as Record<string, unknown>) : null;
}

// ---------- TEACHERS ----------
export async function listTeachers(includeInactive = false): Promise<TeacherRecord[]> {
  assertMongoConnected();
  const query = includeInactive ? {} : { isActive: { $ne: false } };
  const docs = await TeacherModel.find(query).lean();
  return docs.map((d) => mapMongoTeacher(d as Record<string, unknown>));
}

export async function findTeacherById(id: string): Promise<TeacherRecord | null> {
  assertMongoConnected();
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    const doc = await TeacherModel.findById(id).lean();
    if (doc) return mapMongoTeacher(doc as Record<string, unknown>);
  }
  const bySlug = await TeacherModel.findOne({ slug: id }).lean();
  return bySlug ? mapMongoTeacher(bySlug as Record<string, unknown>) : null;
}

export async function findTeacherByUserId(
  userId: string
): Promise<TeacherRecord | null> {
  assertMongoConnected();
  const doc = await TeacherModel.findOne({ userId }).lean();
  return doc ? mapMongoTeacher(doc as Record<string, unknown>) : null;
}

export async function findTeacherByEmail(
  email: string
): Promise<TeacherRecord | null> {
  assertMongoConnected();
  const clean = email.trim().toLowerCase();
  const doc = await TeacherModel.findOne({ email: clean }).lean();
  return doc ? mapMongoTeacher(doc as Record<string, unknown>) : null;
}

export async function createTeacher(
  input: Omit<TeacherRecord, 'id'>
): Promise<TeacherRecord> {
  assertMongoConnected();
  const created = await TeacherModel.create(input);
  return mapMongoTeacher(created.toObject() as unknown as Record<string, unknown>);
}

export async function updateTeacher(
  teacherId: string,
  patch: Partial<Omit<TeacherRecord, 'id'>>
): Promise<TeacherRecord | null> {
  assertMongoConnected();
  if (!mongoose.Types.ObjectId.isValid(teacherId)) return null;
  const updated = await TeacherModel.findByIdAndUpdate(
    teacherId,
    { $set: patch },
    { new: true }
  ).lean();
  return updated ? mapMongoTeacher(updated as Record<string, unknown>) : null;
}

// ---------- COURSES & PLANS ----------
export async function listCourses(includeUnavailable = false): Promise<CourseRecord[]> {
  assertMongoConnected();
  const query = includeUnavailable ? {} : { isAvailable: { $ne: false } };
  const docs = await CourseModel.find(query).sort({ number: 1 }).lean();
  return docs.map((d) => mapMongoCourse(d as Record<string, unknown>));
}

export async function createCourse(
  input: Omit<CourseRecord, 'id'>
): Promise<CourseRecord> {
  assertMongoConnected();
  const created = await CourseModel.create(input);
  return mapMongoCourse(created.toObject() as unknown as Record<string, unknown>);
}

export async function updateCourse(
  courseId: string,
  patch: Partial<Omit<CourseRecord, 'id'>>
): Promise<CourseRecord | null> {
  assertMongoConnected();
  if (!mongoose.Types.ObjectId.isValid(courseId)) return null;
  const updated = await CourseModel.findByIdAndUpdate(
    courseId,
    { $set: patch },
    { new: true }
  ).lean();
  return updated ? mapMongoCourse(updated as Record<string, unknown>) : null;
}

export async function deleteCourseSafe(
  courseId: string
): Promise<{ deleted: boolean; reason?: string }> {
  assertMongoConnected();
  const allClasses = await listAllClasses();
  const activeReference = allClasses.some(
    (c) => c.courseId === courseId && c.status === 'scheduled'
  );
  if (activeReference) {
    return {
      deleted: false,
      reason: 'Cannot delete a course that has active scheduled classes.',
    };
  }
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return { deleted: false, reason: 'Course not found.' };
  }
  const result = await CourseModel.findByIdAndDelete(courseId);
  return result
    ? { deleted: true }
    : { deleted: false, reason: 'Course not found.' };
}

export async function listPlans(): Promise<CoursePlan[]> {
  assertMongoConnected();
  const docs = await PlanModel.find({ isAvailable: { $ne: false } }).lean();
  return docs.map((d) => ({
    id: String(d.planId),
    name: String(d.name),
    priceUsd: Number(d.priceUsd),
    billingCycle: String(d.billingCycle),
    sessionsPerWeek: Number(d.sessionsPerWeek),
    durationMinutes: Number(d.durationMinutes),
    features: Array.isArray(d.features) ? d.features.map(String) : [],
    isAvailable: d.isAvailable !== false,
  }));
}

// ---------- PAYMENTS ----------
export async function listPaymentsByStudent(
  studentId: string
): Promise<PaymentRecord[]> {
  assertMongoConnected();
  const docs = await PaymentModel.find({ studentId })
    .sort({ submittedAt: -1 })
    .lean();
  return docs.map((d) => mapMongoPayment(d as Record<string, unknown>));
}

export async function listAllPayments(): Promise<PaymentRecord[]> {
  assertMongoConnected();
  const docs = await PaymentModel.find().sort({ submittedAt: -1 }).lean();
  return docs.map((d) => mapMongoPayment(d as Record<string, unknown>));
}

export async function findPaymentById(
  paymentId: string
): Promise<PaymentRecord | null> {
  assertMongoConnected();
  if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) return null;
  const doc = await PaymentModel.findById(paymentId).lean();
  return doc ? mapMongoPayment(doc as Record<string, unknown>) : null;
}

export async function findNonRejectedPaymentByRef(
  paymentMethod: PaymentMethod,
  transactionRef: string
): Promise<PaymentRecord | null> {
  assertMongoConnected();
  const normalizedRef = transactionRef.trim();
  if (!normalizedRef) return null;
  const doc = await PaymentModel.findOne({
    paymentMethod,
    status: { $ne: 'rejected' },
    transactionRef: normalizedRef,
  })
    .collation({ locale: 'en', strength: 2 })
    .lean();
  return doc ? mapMongoPayment(doc as Record<string, unknown>) : null;
}

export async function createPayment(
  input: Omit<PaymentRecord, 'id'>
): Promise<PaymentRecord> {
  assertMongoConnected();
  const created = await PaymentModel.create({
    ...input,
    submittedAt: new Date(input.submittedAt),
    reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : null,
  });
  return mapMongoPayment(created.toObject() as unknown as Record<string, unknown>);
}

export async function updatePaymentReview(
  paymentId: string,
  status: PaymentStatus,
  adminNote: string
): Promise<PaymentRecord | null> {
  assertMongoConnected();
  if (!mongoose.Types.ObjectId.isValid(paymentId)) return null;
  const reviewedAt = new Date();
  const updated = await PaymentModel.findByIdAndUpdate(
    paymentId,
    { $set: { status, adminNote, reviewedAt } },
    { new: true }
  ).lean();
  return updated ? mapMongoPayment(updated as Record<string, unknown>) : null;
}

// ---------- CLASSES ----------
export async function listAllClasses(): Promise<ClassSessionRecord[]> {
  assertMongoConnected();
  const docs = await ClassSessionModel.find()
    .sort({ classDate: 1, classTime: 1 })
    .lean();
  return docs.map((d) => mapMongoClass(d as Record<string, unknown>));
}

export async function listClassesByStudent(
  studentId: string
): Promise<ClassSessionRecord[]> {
  assertMongoConnected();
  const docs = await ClassSessionModel.find({
    studentId,
    status: { $ne: 'cancelled' },
  })
    .sort({ classDate: 1, classTime: 1 })
    .lean();
  return docs.map((d) => mapMongoClass(d as Record<string, unknown>));
}

export async function listClassesByTeacher(
  teacherId: string
): Promise<ClassSessionRecord[]> {
  assertMongoConnected();
  const docs = await ClassSessionModel.find({ teacherId })
    .sort({ classDate: 1, classTime: 1 })
    .lean();
  return docs.map((d) => mapMongoClass(d as Record<string, unknown>));
}

export async function createClassSession(
  input: Omit<ClassSessionRecord, 'id'>
): Promise<ClassSessionRecord> {
  assertMongoConnected();
  const created = await ClassSessionModel.create(input);
  return mapMongoClass(created.toObject() as unknown as Record<string, unknown>);
}

export async function updateClassSession(
  classId: string,
  patch: Partial<Omit<ClassSessionRecord, 'id'>>
): Promise<ClassSessionRecord | null> {
  assertMongoConnected();
  if (!mongoose.Types.ObjectId.isValid(classId)) return null;
  const updated = await ClassSessionModel.findByIdAndUpdate(
    classId,
    { $set: patch },
    { new: true }
  ).lean();
  return updated ? mapMongoClass(updated as Record<string, unknown>) : null;
}

// ---------- CONTACT MESSAGES ----------
export async function createContactMessage(
  input: Omit<ContactMessageRecord, 'id' | 'createdAt'>
): Promise<ContactMessageRecord> {
  assertMongoConnected();
  const created = await ContactMessageModel.create(input);
  const obj = created.toObject();
  return {
    id: String(obj._id),
    name: String(obj.name),
    email: String(obj.email),
    phone: String(obj.phone || ''),
    message: String(obj.message),
    createdAt: new Date(obj.createdAt as Date).toISOString(),
  };
}

export async function listContactMessages(): Promise<ContactMessageRecord[]> {
  assertMongoConnected();
  const docs = await ContactMessageModel.find().sort({ createdAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: String(d.name),
    email: String(d.email),
    phone: String(d.phone || ''),
    message: String(d.message),
    createdAt: new Date(d.createdAt as Date).toISOString(),
  }));
}
