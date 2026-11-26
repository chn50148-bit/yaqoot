export type AccessStatus = 'trial' | 'locked' | 'active';
export type UserRole = 'student' | 'teacher' | 'admin';
export type PaymentMethod = 'paypal' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type ClassStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Teacher {
  id: string;
  userId?: string | null;
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
  isActive?: boolean;
  assignedStudentCount?: number;
  scheduledClassCount?: number;
}

export interface Course {
  id: string;
  slug: string;
  number: string;
  title: string;
  description: string;
  isAvailable: boolean;
}

export interface CoursePlan {
  id: string;
  name: string;
  priceUsd: number;
  billingCycle: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  features: string[];
  isAvailable?: boolean;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trialStartDate: string | null;
  trialEndsAt: string | null;
  trialRemainingMs: number;
  accessStatus: AccessStatus;
  enrolledPlanId: string | null;
  enrolledPlanName: string | null;
  preferredCourse: string;
  assignedTeacherId: string;
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
  requiresManualVerification?: boolean;
  status: PaymentStatus;
  adminNote: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ClassSession {
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

export interface StudentDashboardPayload {
  user: StudentUser;
  assignedTeacher: Teacher | null;
  payments: PaymentRecord[];
  classes: ClassSession[];
  plans: CoursePlan[];
}

export interface TeacherDashboardPayload {
  user: StudentUser;
  teacher: Teacher;
  students: Array<{
    id: string;
    name: string;
    email: string;
    preferredCourse: string;
    accessStatus: AccessStatus;
    enrolledPlanName: string | null;
  }>;
  classes: ClassSession[];
}

export interface AdminOverviewStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeStudents: number;
  trialStudents: number;
  expiredTrials: number;
  totalCourses: number;
  pendingPayments: number;
  approvedRevenueUsd: number;
  unreadMessages: number;
}

export interface AdminStudentRecord extends StudentUser {
  payments: PaymentRecord[];
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}
