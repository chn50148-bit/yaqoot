import { ArrowLeft, Lock, Shield, UserCheck, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Course, StudentUser } from '../types';
import type { PortalEntryMode } from './Navbar';

interface AuthPortalProps {
  mode: PortalEntryMode;
  intent: 'trial' | 'enroll';
  courses: Course[];
  onSwitchMode: (mode: PortalEntryMode) => void;
  onAuthenticated: (token: string, user: StudentUser) => void;
  onBackToAcademy: () => void;
}

export function AuthPortal({
  mode,
  intent,
  courses,
  onSwitchMode,
  onAuthenticated,
  onBackToAcademy,
}: AuthPortalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredCourse, setPreferredCourse] = useState(
    courses[0]?.title || 'Noorani Qaida'
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [needsAdminClaim, setNeedsAdminClaim] = useState(false);

  useEffect(() => {
    setError(null);
    if (mode === 'admin-login') {
      fetch('/api/admin/bootstrap-status')
        .then((r) => r.json())
        .then((d) => setNeedsAdminClaim(Boolean(d.needsClaim)))
        .catch(() => setNeedsAdminClaim(false));
    }
  }, [mode]);

  useEffect(() => {
    if (courses.length > 0 && !courses.some((c) => c.title === preferredCourse)) {
      setPreferredCourse(courses[0].title);
    }
  }, [courses, preferredCourse]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let endpoint = '/api/auth/login';
      let body: Record<string, string> = { email, password };

      if (mode === 'student-register') {
        endpoint = '/api/auth/register';
        body = { name, email, password, preferredCourse };
      } else if (mode === 'student-login') {
        body = { email, password, expectedRole: 'student' };
      } else if (mode === 'teacher-login') {
        body = { email, password, expectedRole: 'teacher' };
      } else if (mode === 'admin-login') {
        if (needsAdminClaim) {
          endpoint = '/api/admin/bootstrap';
          body = { name, email, password };
        } else {
          body = { email, password, expectedRole: 'admin' };
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      onAuthenticated(data.token, data.user);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'student-register';
  const isTeacher = mode === 'teacher-login';
  const isAdmin = mode === 'admin-login';

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
      <button
        type="button"
        onClick={onBackToAcademy}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#3C4641] hover:text-[#093628]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Yaqoot Wal Marjan
      </button>

      {/* Portal Role Switcher */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-[#C8BEA8] bg-white p-1.5 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onSwitchMode('student-register')}
          className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
            mode === 'student-register'
              ? 'bg-[#093628] text-white'
              : 'text-[#3C4641] hover:bg-[#EAE2D3]'
          }`}
        >
          {intent === 'enroll' ? 'Student Enroll' : 'Start Free Trial'}
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('student-login')}
          className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
            mode === 'student-login'
              ? 'bg-[#093628] text-white'
              : 'text-[#3C4641] hover:bg-[#EAE2D3]'
          }`}
        >
          Student Login
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('teacher-login')}
          className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
            mode === 'teacher-login'
              ? 'bg-[#093628] text-white'
              : 'text-[#3C4641] hover:bg-[#EAE2D3]'
          }`}
        >
          Staff Login
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('admin-login')}
          className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
            mode === 'admin-login'
              ? 'bg-[#093628] text-white'
              : 'text-[#3C4641] hover:bg-[#EAE2D3]'
          }`}
        >
          Admin Login
        </button>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#C8BEA8] bg-white lg:grid-cols-12">
        <div className="flex flex-col justify-between bg-[#093628] p-8 text-white lg:col-span-5 lg:p-10">
          <div>
            <p className="text-xs font-semibold text-[#D6B87C]">
              Yaqoot Wal Marjan Portal
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white">
              {isRegister &&
                (intent === 'enroll'
                  ? 'Register & Enroll in a Paid Plan'
                  : 'Start Your 3-Day Free Trial')}
              {mode === 'student-login' && 'Student Portal Sign In'}
              {isTeacher && 'Faculty & Staff Sign In'}
              {isAdmin &&
                (needsAdminClaim
                  ? 'Initialize Administrator Account'
                  : 'Administrator Console Sign In')}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/85">
              {isRegister &&
                'Create your student account to begin your 3-day free trial, view your scheduled Google Meet classes, and submit enrollment tuition.'}
              {mode === 'student-login' &&
                'Access your live trial countdown, assigned scholar, upcoming Google Meet classes, and tuition payment status.'}
              {isTeacher &&
                'Teachers sign in with credentials issued by the Academy Administrator to view assigned students and scheduled classes.'}
              {isAdmin &&
                (needsAdminClaim
                  ? 'No administrator account exists yet and environment admin credentials are not configured. Set the initial administrator account below.'
                  : 'Authorized academy administrators manage students, faculty accounts, courses, class schedules, and payment approvals.')}
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-white/15 pt-6 text-xs text-white/85">
            {isTeacher ? (
              <>
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                  <span>Staff accounts are provisioned solely by Admin</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                  <span>Scoped access to your assigned students and classes</span>
                </div>
              </>
            ) : isAdmin ? (
              <>
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                  <span>Role-protected administration endpoints</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <UserCheck
                    className="h-4 w-4 text-[#D6B87C] shrink-0"
                    aria-hidden="true"
                  />
                  <span>Manual payment verification &amp; class scheduling</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <UserCheck
                    className="h-4 w-4 text-[#D6B87C] shrink-0"
                    aria-hidden="true"
                  />
                  <span>3-day free trial starts immediately on registration</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-[#D6B87C] shrink-0" aria-hidden="true" />
                  <span>Admin verifies payments before unlocking paid plans</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-8 lg:col-span-7 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(isRegister || (isAdmin && needsAdminClaim)) && (
              <div>
                <label
                  htmlFor="portal-name"
                  className="block text-xs font-semibold text-[#111815]"
                >
                  Full Name
                </label>
                <input
                  id="portal-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAdmin ? 'e.g. Academy Principal' : 'e.g. Ayesha Khan'}
                  className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="portal-email"
                className="block text-xs font-semibold text-[#111815]"
              >
                Email Address
              </label>
              <input
                id="portal-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="portal-password"
                className="block text-xs font-semibold text-[#111815]"
              >
                Password
              </label>
              <input
                id="portal-password"
                type="password"
                required
                minLength={isAdmin && needsAdminClaim ? 8 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isAdmin && needsAdminClaim
                    ? 'At least 8 characters'
                    : 'Enter your password'
                }
                className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
              />
            </div>

            {isRegister && (
              <div>
                <label
                  htmlFor="portal-course"
                  className="block text-xs font-semibold text-[#111815]"
                >
                  Select Course
                </label>
                <select
                  id="portal-course"
                  value={preferredCourse}
                  onChange={(e) => setPreferredCourse(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.number} {c.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[#525B56]">
                  Your scholar and Google Meet schedule are assigned by Admin.
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#093628] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : isRegister
                ? intent === 'enroll'
                  ? 'Continue to Enrollment & Payment'
                  : 'Activate 3-Day Free Trial'
                : isAdmin && needsAdminClaim
                ? 'Claim Administrator Account'
                : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
