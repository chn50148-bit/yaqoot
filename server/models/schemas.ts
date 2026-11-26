import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    trialStartDate: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    accessStatus: {
      type: String,
      enum: ['trial', 'locked', 'active'],
      default: 'trial',
    },
    enrolledPlanId: { type: String, default: null },
    enrolledPlanName: { type: String, default: null },
    preferredCourse: { type: String, default: 'Noorani Qaida' },
    assignedTeacherId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const teacherSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null, index: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    photoUrl: { type: String, required: true },
    qualifications: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    languages: [{ type: String }],
    specialty: { type: String, required: true },
    bio: { type: String, required: true },
    availability: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const planSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    billingCycle: { type: String, required: true },
    sessionsPerWeek: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    features: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const paymentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amountUsd: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['paypal', 'jazzcash', 'easypaisa', 'bank_transfer'],
      required: true,
    },
    transactionRef: { type: String, required: true },
    accountLabel: { type: String, required: true },
    requiresManualVerification: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    submittedAt: { type: Date, required: true, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const classSessionSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    teacherId: { type: String, required: true, index: true },
    teacherName: { type: String, required: true },
    courseId: { type: String, default: '' },
    courseTitle: { type: String, required: true },
    classDate: { type: String, required: true },
    classTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    meetingUrl: { type: String, required: true },
    sessionType: { type: String, enum: ['trial', 'enrolled'], default: 'trial' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

export const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const TeacherModel =
  mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
export const CourseModel =
  mongoose.models.Course || mongoose.model('Course', courseSchema);
export const PlanModel = mongoose.models.Plan || mongoose.model('Plan', planSchema);
export const PaymentModel =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const ClassSessionModel =
  mongoose.models.ClassSession || mongoose.model('ClassSession', classSessionSchema);
export const ContactMessageModel =
  mongoose.models.ContactMessage ||
  mongoose.model('ContactMessage', contactMessageSchema);
