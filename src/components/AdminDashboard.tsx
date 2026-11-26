import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type {
  AccessStatus,
  AdminOverviewStats,
  AdminStudentRecord,
  ClassSession,
  ContactMessageRecord,
  Course,
  CoursePlan,
  PaymentRecord,
  Teacher,
} from '../types';

interface AdminDashboardProps {
  token: string;
  plans: CoursePlan[];
  onCatalogChanged: () => void;
  onLogout: () => void;
  onBackToAcademy: () => void;
}

type AdminTab =
  | 'overview'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'classes'
  | 'payments'
  | 'messages';

export function AdminDashboard({
  token,
  plans,
  onCatalogChanged,
  onLogout,
  onBackToAcademy,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [students, setStudents] = useState<AdminStudentRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);

  // Student search & edit
  const [studentQuery, setStudentQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<AdminStudentRecord | null>(null);

  // New teacher form
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tTitle, setTTitle] = useState('');
  const [tQual, setTQual] = useState('');
  const [tExp, setTExp] = useState('5');
  const [tLangs, setTLangs] = useState('English, Arabic, Urdu');
  const [tSpec, setTSpec] = useState('');
  const [tAvail, setTAvail] = useState('Mon – Sat · Flexible Slots');
  const [tBio, setTBio] = useState('');

  // Edit teacher
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Course form
  const [cTitle, setCTitle] = useState('');
  const [cNumber, setCNumber] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Schedule class form (manual Google Meet link required)
  const [clsStudentId, setClsStudentId] = useState('');
  const [clsTeacherId, setClsTeacherId] = useState('');
  const [clsCourseTitle, setClsCourseTitle] = useState('');
  const [clsDate, setClsDate] = useState('');
  const [clsTime, setClsTime] = useState('18:00');
  const [clsDuration, setClsDuration] = useState('30');
  const [clsMeetUrl, setClsMeetUrl] = useState('');
  const [clsType, setClsType] = useState<'trial' | 'enrolled'>('trial');

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, st, te, co, cl, pa, ms] = await Promise.all([
        fetch('/api/admin/overview', { headers: authHeaders() }),
        fetch('/api/admin/students', { headers: authHeaders() }),
        fetch('/api/admin/teachers', { headers: authHeaders() }),
        fetch('/api/admin/courses', { headers: authHeaders() }),
        fetch('/api/admin/classes', { headers: authHeaders() }),
        fetch('/api/admin/payments', { headers: authHeaders() }),
        fetch('/api/admin/messages', { headers: authHeaders() }),
      ]);

      if (ov.status === 401 || ov.status === 403) {
        onLogout();
        return;
      }

      const [ovD, stD, teD, coD, clD, paD, msD] = await Promise.all([
        ov.json(),
        st.json(),
        te.json(),
        co.json(),
        cl.json(),
        pa.json(),
        ms.json(),
      ]);

      setStats(ovD.stats);
      setStudents(stD.students || []);
      setTeachers(teD.teachers || []);
      setCourses(coD.courses || []);
      setClasses(clD.classes || []);
      setPayments(paD.payments || []);
      setMessages(msD.messages || []);

      setClsStudentId((prev) =>
        prev || ((stD.students || []).length > 0 ? stD.students[0].id : '')
      );
      setClsTeacherId((prev) =>
        prev || ((teD.teachers || []).length > 0 ? teD.teachers[0].id : '')
      );
      setClsCourseTitle((prev) =>
        prev || ((coD.courses || []).length > 0 ? coD.courses[0].title : '')
      );
    } catch {
      setErrorMsg('Unable to load administration data from server.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, onLogout]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const notify = (msg: string) => {
    setErrorMsg(null);
    setFeedback(msg);
  };

  const fail = (msg: string) => {
    setFeedback(null);
    setErrorMsg(msg);
  };

  // --- STUDENT HANDLERS ---
  const handleSaveStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: editingStudent.name,
        preferredCourse: editingStudent.preferredCourse,
        assignedTeacherId: editingStudent.assignedTeacherId,
        accessStatus: editingStudent.accessStatus,
        enrolledPlanId: editingStudent.enrolledPlanId || '',
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Failed to update student.');
    setEditingStudent(null);
    notify('Student record updated.');
    await loadAll();
  };

  // --- TEACHER HANDLERS ---
  const handleCreateTeacher = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/teachers', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: tName,
        email: tEmail,
        password: tPassword,
        title: tTitle,
        qualifications: tQual,
        experienceYears: Number(tExp) || 5,
        languages: tLangs,
        specialty: tSpec,
        availability: tAvail,
        bio: tBio,
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Unable to create teacher.');
    setTName('');
    setTEmail('');
    setTPassword('');
    setTTitle('');
    setTQual('');
    setTSpec('');
    setTBio('');
    notify('Teacher profile and login credentials created.');
    onCatalogChanged();
    await loadAll();
  };

  const handleUpdateTeacher = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const res = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        name: editingTeacher.name,
        title: editingTeacher.title,
        qualifications: editingTeacher.qualifications,
        experienceYears: Number(editingTeacher.experienceYears),
        languages: editingTeacher.languages,
        specialty: editingTeacher.specialty,
        availability: editingTeacher.availability,
        bio: editingTeacher.bio,
        isActive: editingTeacher.isActive !== false,
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Failed to update teacher.');
    setEditingTeacher(null);
    notify('Teacher profile updated.');
    onCatalogChanged();
    await loadAll();
  };

  // --- COURSE HANDLERS ---
  const handleCreateCourse = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        number: cNumber,
        title: cTitle,
        description: cDesc,
        isAvailable: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Unable to add course.');
    setCNumber('');
    setCTitle('');
    setCDesc('');
    notify('Course added to catalog.');
    onCatalogChanged();
    await loadAll();
  };

  const handleSaveCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        number: editingCourse.number,
        title: editingCourse.title,
        description: editingCourse.description,
        isAvailable: editingCourse.isAvailable,
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Failed to update course.');
    setEditingCourse(null);
    notify('Course updated.');
    onCatalogChanged();
    await loadAll();
  };

  const handleDeleteCourse = async (courseId: string) => {
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Cannot delete course.');
    notify('Course deleted.');
    onCatalogChanged();
    await loadAll();
  };

  // --- CLASS SCHEDULING ---
  const handleScheduleClass = async (e: FormEvent) => {
    e.preventDefault();
    const matchedCourse = courses.find((c) => c.title === clsCourseTitle);
    const res = await fetch('/api/admin/classes', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        studentId: clsStudentId,
        teacherId: clsTeacherId,
        courseId: matchedCourse?.id || '',
        courseTitle: clsCourseTitle,
        classDate: clsDate,
        classTime: clsTime,
        durationMinutes: Number(clsDuration) || 30,
        meetingUrl: clsMeetUrl,
        sessionType: clsType,
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Unable to schedule class.');
    setClsMeetUrl('');
    notify('Class scheduled with Google Meet link.');
    await loadAll();
  };

  const handleClassStatus = async (
    classId: string,
    status: 'scheduled' | 'completed' | 'cancelled'
  ) => {
    const res = await fetch(`/api/admin/classes/${classId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Unable to update class.');
    notify(`Class marked ${status}.`);
    await loadAll();
  };

  // --- PAYMENT APPROVAL ---
  const handleReviewPayment = async (
    paymentId: string,
    status: 'approved' | 'rejected'
  ) => {
    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        status,
        adminNote:
          status === 'approved'
            ? 'Verified by Academy Administrator'
            : 'Transaction reference could not be verified',
      }),
    });
    const data = await res.json();
    if (!res.ok) return fail(data.error || 'Unable to review payment.');
    notify(
      status === 'approved'
        ? 'Payment approved and student account unlocked.'
        : 'Payment marked rejected.'
    );
    await loadAll();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentQuery.toLowerCase())
  );

  const navItems: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'students', label: 'Students', icon: Users },
    { key: 'teachers', label: 'Teachers', icon: GraduationCap },
    { key: 'courses', label: 'Courses', icon: BookOpen },
    { key: 'classes', label: 'Classes & Meet', icon: Calendar },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'messages', label: 'Inquiries', icon: MessageSquare },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="rounded-xl border border-[#C8BEA8] bg-white p-5">
            <div className="border-b border-[#D4CBB8] pb-4">
              <p className="text-xs font-semibold text-[#093628]">
                Yaqoot Wal Marjan
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#111815]">
                Admin Console
              </h2>
            </div>

            <nav aria-label="Admin sections" className="mt-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setTab(item.key);
                      setFeedback(null);
                      setErrorMsg(null);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#093628] text-white'
                        : 'text-[#111815] hover:bg-[#EAE2D3]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 space-y-2 border-t border-[#D4CBB8] pt-4">
              <button
                type="button"
                onClick={onBackToAcademy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#3C4641] hover:bg-[#EAE2D3]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Public Website</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Admin Content */}
        <section className="space-y-6 lg:col-span-9">
          {feedback && (
            <div
              role="status"
              className="rounded-xl border border-[#093628]/30 bg-[#093628]/10 px-5 py-3.5 text-sm font-semibold text-[#093628]"
            >
              {feedback}
            </div>
          )}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-800"
            >
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-[#EAE2D3]" />
          ) : (
            <>
              {/* 1. OVERVIEW */}
              {tab === 'overview' && stats && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#C8BEA8] bg-white p-6">
                    <h1 className="font-display text-3xl font-bold text-[#111815]">
                      Academy Overview
                    </h1>
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Total Students</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#111815] tabular-nums">
                          {stats.totalStudents}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Total Teachers</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#111815] tabular-nums">
                          {stats.totalTeachers}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Total Classes</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#111815] tabular-nums">
                          {stats.totalClasses}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Active Paid Students</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#093628] tabular-nums">
                          {stats.activeStudents}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">On Free Trial</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#8A611C] tabular-nums">
                          {stats.trialStudents}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Expired Trials</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">
                          {stats.expiredTrials}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Pending Payments</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#8A611C] tabular-nums">
                          {stats.pendingPayments}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4">
                        <p className="text-xs text-[#525B56]">Verified Tuition</p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[#093628] tabular-nums">
                          ${stats.approvedRevenueUsd}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. STUDENT MANAGEMENT */}
              {tab === 'students' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#C8BEA8] bg-white p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h1 className="font-display text-3xl font-bold text-[#111815]">
                        Student Management
                      </h1>
                      <div className="relative w-full sm:w-72">
                        <Search
                          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#525B56]"
                          aria-hidden="true"
                        />
                        <input
                          type="search"
                          value={studentQuery}
                          onChange={(e) => setStudentQuery(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] py-2 pl-9 pr-3 text-sm focus:border-[#093628] focus:outline-none"
                        />
                      </div>
                    </div>

                    {editingStudent && (
                      <form
                        onSubmit={handleSaveStudent}
                        className="mt-6 rounded-xl border border-[#093628] bg-[#F3EDE2] p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h2 className="font-display text-2xl font-bold text-[#111815]">
                            Edit Student: {editingStudent.name}
                          </h2>
                          <button
                            type="button"
                            onClick={() => setEditingStudent(null)}
                            className="text-xs font-semibold text-[#525B56] hover:text-[#111815]"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label className="block text-xs font-semibold">Name</label>
                            <input
                              type="text"
                              value={editingStudent.name}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  name: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold">
                              Assigned Teacher
                            </label>
                            <select
                              value={editingStudent.assignedTeacherId}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  assignedTeacherId: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                            >
                              <option value="">Unassigned</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold">Course</label>
                            <select
                              value={editingStudent.preferredCourse}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  preferredCourse: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                            >
                              {courses.map((c) => (
                                <option key={c.id} value={c.title}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold">
                              Account Status
                            </label>
                            <select
                              value={editingStudent.accessStatus}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  accessStatus: e.target.value as AccessStatus,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                            >
                              <option value="trial">Free Trial</option>
                              <option value="locked">Trial Expired (Locked)</option>
                              <option value="active">Active Enrolled</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-end justify-between gap-4">
                          <div className="w-full sm:w-64">
                            <label className="block text-xs font-semibold">
                              Enrolled Plan
                            </label>
                            <select
                              value={editingStudent.enrolledPlanId || ''}
                              onChange={(e) =>
                                setEditingStudent({
                                  ...editingStudent,
                                  enrolledPlanId: e.target.value || null,
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                            >
                              <option value="">None (Trial)</option>
                              {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.priceUsd}/mo)
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="rounded-lg bg-[#093628] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#06261C]"
                          >
                            Save Student Changes
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-[#D4CBB8] bg-[#F3EDE2] text-xs font-semibold text-[#3C4641]">
                          <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Course &amp; Plan</th>
                            <th className="px-4 py-3">Assigned Teacher</th>
                            <th className="px-4 py-3">Trial / Status</th>
                            <th className="px-4 py-3">Payments</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4CBB8]">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-sm text-[#525B56]"
                              >
                                No students found.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((s) => {
                              const teacher = teachers.find(
                                (t) => t.id === s.assignedTeacherId
                              );
                              return (
                                <tr key={s.id} className="hover:bg-[#FAF8F4]">
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-[#111815]">
                                      {s.name}
                                    </p>
                                    <p className="text-xs text-[#525B56]">{s.email}</p>
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    <p className="font-semibold text-[#111815]">
                                      {s.preferredCourse}
                                    </p>
                                    <p className="text-[#525B56]">
                                      {s.enrolledPlanName || 'Trial'}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-[#111815]">
                                    {teacher ? teacher.name : 'Unassigned'}
                                  </td>
                                  <td className="px-4 py-3 text-xs font-semibold">
                                    {s.accessStatus === 'active'
                                      ? 'Active Paid'
                                      : s.accessStatus === 'trial'
                                      ? 'Free Trial'
                                      : 'Expired / Locked'}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs tabular-nums">
                                    {s.payments.length} record(s)
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setEditingStudent(s)}
                                      className="rounded-md border border-[#C8BEA8] px-3 py-1.5 text-xs font-semibold text-[#093628] hover:bg-[#EAE2D3]"
                                    >
                                      Manage
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. TEACHER MANAGEMENT */}
              {tab === 'teachers' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#C8BEA8] bg-white p-6">
                    <h1 className="font-display text-3xl font-bold text-[#111815]">
                      Create Teacher Profile &amp; Login Account
                    </h1>
                    <p className="mt-1 text-xs text-[#525B56]">
                      Teachers cannot sign up publicly. Only the Admin provisions
                      teacher credentials.
                    </p>

                    <form
                      onSubmit={handleCreateTeacher}
                      className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      <input
                        type="text"
                        required
                        value={tName}
                        onChange={(e) => setTName(e.target.value)}
                        placeholder="Full Name *"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="email"
                        required
                        value={tEmail}
                        onChange={(e) => setTEmail(e.target.value)}
                        placeholder="Staff Login Email *"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        placeholder="Login Password (min 6 chars) *"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={tTitle}
                        onChange={(e) => setTTitle(e.target.value)}
                        placeholder="Title (e.g. Senior Qari)"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={tQual}
                        onChange={(e) => setTQual(e.target.value)}
                        placeholder="Qualifications / Ijazah *"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={tExp}
                        onChange={(e) => setTExp(e.target.value)}
                        placeholder="Years Experience"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={tLangs}
                        onChange={(e) => setTLangs(e.target.value)}
                        placeholder="Languages (comma separated)"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={tSpec}
                        onChange={(e) => setTSpec(e.target.value)}
                        placeholder="Specialty (e.g. Tajweed & Hifz)"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={tAvail}
                        onChange={(e) => setTAvail(e.target.value)}
                        placeholder="Availability"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        value={tBio}
                        onChange={(e) => setTBio(e.target.value)}
                        placeholder="Short biography..."
                        className="sm:col-span-2 lg:col-span-3 rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <div className="lg:col-span-3">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#093628] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#06261C]"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Create Teacher Account
                        </button>
                      </div>
                    </form>
                  </div>

                  {editingTeacher && (
                    <form
                      onSubmit={handleUpdateTeacher}
                      className="rounded-xl border border-[#093628] bg-[#F3EDE2] p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-2xl font-bold">
                          Edit Teacher: {editingTeacher.name}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setEditingTeacher(null)}
                          className="text-xs font-semibold text-[#525B56]"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          value={editingTeacher.name}
                          onChange={(e) =>
                            setEditingTeacher({ ...editingTeacher, name: e.target.value })
                          }
                          className="rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={editingTeacher.availability}
                          onChange={(e) =>
                            setEditingTeacher({
                              ...editingTeacher,
                              availability: e.target.value,
                            })
                          }
                          className="rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={editingTeacher.qualifications}
                          onChange={(e) =>
                            setEditingTeacher({
                              ...editingTeacher,
                              qualifications: e.target.value,
                            })
                          }
                          className="rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={editingTeacher.specialty}
                          onChange={(e) =>
                            setEditingTeacher({
                              ...editingTeacher,
                              specialty: e.target.value,
                            })
                          }
                          className="rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg bg-[#093628] px-5 py-2 text-xs font-semibold text-white"
                      >
                        Save Teacher Changes
                      </button>
                    </form>
                  )}

                  <div className="rounded-xl border border-[#C8BEA8] bg-white overflow-hidden">
                    <div className="border-b border-[#D4CBB8] px-6 py-4">
                      <h2 className="font-display text-2xl font-bold text-[#111815]">
                        Academy Faculty ({teachers.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-[#D4CBB8]">
                      {teachers.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-[#111815]">
                              {t.name} ({t.email})
                            </p>
                            <p className="text-xs text-[#525B56]">
                              {t.qualifications} · {t.availability} ·{' '}
                              <span className="font-mono tabular-nums">
                                {t.assignedStudentCount ?? 0} students /{' '}
                                {t.scheduledClassCount ?? 0} classes
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingTeacher(t)}
                            className="self-start rounded-md border border-[#C8BEA8] px-3 py-1.5 text-xs font-semibold text-[#093628] hover:bg-[#EAE2D3]"
                          >
                            Edit Profile
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. COURSE MANAGEMENT */}
              {tab === 'courses' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#C8BEA8] bg-white p-6">
                    <h1 className="font-display text-3xl font-bold text-[#111815]">
                      Course Management
                    </h1>
                    <form
                      onSubmit={handleCreateCourse}
                      className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3"
                    >
                      <input
                        type="text"
                        value={cNumber}
                        onChange={(e) => setCNumber(e.target.value)}
                        placeholder="Index (e.g. 05.)"
                        className="rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={cTitle}
                        onChange={(e) => setCTitle(e.target.value)}
                        placeholder="Course Title *"
                        className="sm:col-span-2 rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        required
                        value={cDesc}
                        onChange={(e) => setCDesc(e.target.value)}
                        placeholder="Course Description *"
                        className="sm:col-span-3 rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2 text-sm"
                      />
                      <div>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#093628] px-5 py-2.5 text-xs font-semibold text-white"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Add Course
                        </button>
                      </div>
                    </form>
                  </div>

                  {editingCourse && (
                    <form
                      onSubmit={handleSaveCourse}
                      className="rounded-xl border border-[#093628] bg-[#F3EDE2] p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-2xl font-bold">
                          Edit Course: {editingCourse.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setEditingCourse(null)}
                          className="text-xs font-semibold text-[#525B56]"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          value={editingCourse.title}
                          onChange={(e) =>
                            setEditingCourse({ ...editingCourse, title: e.target.value })
                          }
                          className="rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                        />
                        <label className="flex items-center gap-2 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={editingCourse.isAvailable}
                            onChange={(e) =>
                              setEditingCourse({
                                ...editingCourse,
                                isAvailable: e.target.checked,
                              })
                            }
                          />
                          Available on Public Website
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={editingCourse.description}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[#C8BEA8] bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-[#093628] px-5 py-2 text-xs font-semibold text-white"
                      >
                        Save Course
                      </button>
                    </form>
                  )}

                  <div className="rounded-xl border border-[#C8BEA8] bg-white divide-y divide-[#D4CBB8]">
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[#111815]">
                            {c.number} {c.title}{' '}
                            <span className="text-xs font-normal text-[#525B56]">
                              ({c.isAvailable ? 'Visible' : 'Hidden'})
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-[#525B56]">{c.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCourse(c)}
                            className="rounded-md border border-[#C8BEA8] px-3 py-1.5 text-xs font-semibold text-[#093628]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            aria-label={`Delete ${c.title}`}
                            className="rounded-md border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. CLASS SCHEDULING (MANUAL GOOGLE MEET URL) */}
              {tab === 'classes' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#C8BEA8] bg-white p-6">
                    <h1 className="font-display text-3xl font-bold text-[#111815]">
                      Schedule Class &amp; Google Meet Link
                    </h1>
                    <p className="mt-1 text-xs text-[#525B56]">
                      Select student, teacher, course, date, time, and paste your real
                      Google Meet URL.
                    </p>

                    <form
                      onSubmit={handleScheduleClass}
                      className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold">Student *</label>
                        <select
                          required
                          value={clsStudentId}
                          onChange={(e) => setClsStudentId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        >
                          <option value="">Select student...</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">Teacher *</label>
                        <select
                          required
                          value={clsTeacherId}
                          onChange={(e) => setClsTeacherId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        >
                          <option value="">Select teacher...</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">Course *</label>
                        <select
                          required
                          value={clsCourseTitle}
                          onChange={(e) => setClsCourseTitle(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.title}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">Session Type</label>
                        <select
                          value={clsType}
                          onChange={(e) =>
                            setClsType(e.target.value as 'trial' | 'enrolled')
                          }
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        >
                          <option value="trial">Trial Class</option>
                          <option value="enrolled">Enrolled Class</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">Date *</label>
                        <input
                          type="date"
                          required
                          value={clsDate}
                          onChange={(e) => setClsDate(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">Time *</label>
                        <input
                          type="time"
                          required
                          value={clsTime}
                          onChange={(e) => setClsTime(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          min={15}
                          max={120}
                          value={clsDuration}
                          onChange={(e) => setClsDuration(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold">
                          Google Meet Link (https://) *
                        </label>
                        <input
                          type="url"
                          required
                          value={clsMeetUrl}
                          onChange={(e) => setClsMeetUrl(e.target.value)}
                          placeholder="https://meet.google.com/abc-defg-hij"
                          className="mt-1 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="lg:col-span-4">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#093628] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#06261C]"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Schedule Class
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-xl border border-[#C8BEA8] bg-white divide-y divide-[#D4CBB8]">
                    {classes.length === 0 ? (
                      <p className="p-8 text-center text-sm text-[#525B56]">
                        No classes scheduled yet.
                      </p>
                    ) : (
                      classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#111815]">
                              {cls.courseTitle} — {cls.studentName} with {cls.teacherName}
                            </p>
                            <p className="mt-0.5 text-xs text-[#525B56]">
                              <span className="font-mono tabular-nums">
                                {cls.classDate} {cls.classTime}
                              </span>{' '}
                              · {cls.durationMinutes} min · {cls.status} ·{' '}
                              <span className="font-mono">{cls.meetingUrl}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {cls.status === 'scheduled' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleClassStatus(cls.id, 'completed')}
                                  className="rounded-md border border-[#093628] px-3 py-1.5 text-xs font-semibold text-[#093628]"
                                >
                                  Complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClassStatus(cls.id, 'cancelled')}
                                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 6. PAYMENT MANAGEMENT */}
              {tab === 'payments' && (
                <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
                  <div className="border-b border-[#D4CBB8] px-6 py-4">
                    <h1 className="font-display text-3xl font-bold text-[#111815]">
                      Payment Verification &amp; History
                    </h1>
                    <p className="mt-1 text-xs text-[#525B56]">
                      Student payments stay Pending until manually approved below.
                    </p>
                  </div>

                  {payments.length === 0 ? (
                    <p className="p-8 text-center text-sm text-[#525B56]">
                      No payment submissions yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-[#D4CBB8] bg-[#F3EDE2] text-xs font-semibold text-[#3C4641]">
                          <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Plan &amp; Amount</th>
                            <th className="px-4 py-3">Method &amp; Reference</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Review</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D4CBB8]">
                          {payments.map((p) => (
                            <tr key={p.id}>
                              <td className="px-4 py-3.5">
                                <p className="font-semibold text-[#111815]">
                                  {p.studentName}
                                </p>
                                <p className="text-xs text-[#525B56]">
                                  {p.studentEmail}
                                </p>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="font-semibold text-[#111815]">
                                  {p.planName}
                                </p>
                                <p className="font-mono text-xs text-[#093628] tabular-nums">
                                  ${p.amountUsd} USD
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-xs">
                                <p className="font-semibold text-[#111815]">
                                  {p.paymentMethod === 'bank_transfer'
                                    ? 'Bank Transfer'
                                    : p.paymentMethod === 'easypaisa'
                                    ? 'EasyPaisa'
                                    : p.paymentMethod === 'jazzcash'
                                    ? 'JazzCash'
                                    : 'PayPal'}{' '}
                                  · {p.accountLabel}
                                </p>
                                <p className="font-mono text-[#525B56] tabular-nums">
                                  TID: {p.transactionRef}
                                </p>
                              </td>
                              <td className="px-4 py-3.5 text-xs font-semibold">
                                {p.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 text-[#093628]">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                                  </span>
                                )}
                                {p.status === 'pending' && (
                                  <span className="text-[#8A611C]">Pending</span>
                                )}
                                {p.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 text-red-700">
                                    <XCircle className="h-3.5 w-3.5" /> Rejected
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {p.status === 'pending' ? (
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleReviewPayment(p.id, 'approved')
                                      }
                                      className="rounded-md bg-[#093628] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#06261C]"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleReviewPayment(p.id, 'rejected')
                                      }
                                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#525B56]">
                                    Reviewed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 7. CONTACT INQUIRIES */}
              {tab === 'messages' && (
                <div className="rounded-xl border border-[#C8BEA8] bg-white overflow-hidden">
                  <div className="border-b border-[#D4CBB8] px-6 py-4">
                    <h1 className="font-display text-3xl font-bold text-[#111815]">
                      Admissions Inquiries ({messages.length})
                    </h1>
                  </div>
                  {messages.length === 0 ? (
                    <p className="p-8 text-center text-sm text-[#525B56]">
                      No contact inquiries yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#D4CBB8]">
                      {messages.map((m) => (
                        <div key={m.id} className="px-6 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-[#111815]">
                              {m.name} ({m.email}) {m.phone && `· ${m.phone}`}
                            </p>
                            <span className="font-mono text-xs text-[#525B56] tabular-nums">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#3C4641]">{m.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
