import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  LogOut,
  Users,
  Video,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { TeacherDashboardPayload } from '../types';

interface TeacherDashboardProps {
  token: string;
  onLogout: () => void;
  onBackToAcademy: () => void;
}

export function TeacherDashboard({
  token,
  onLogout,
  onBackToAcademy,
}: TeacherDashboardProps) {
  const [data, setData] = useState<TeacherDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeacherData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/teacher/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || 'Unable to load teacher portal.');
        return;
      }
      setData(payload as TeacherDashboardPayload);
    } catch {
      setError('Network error while loading teacher dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    loadTeacherData();
  }, [loadTeacherData]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-[#D4CBB8]" />
          <div className="h-44 w-full animate-pulse rounded-xl bg-[#EAE2D3]" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-red-700">
            {error || 'Unable to load teacher profile.'}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 rounded-lg bg-[#093628] px-4 py-2 text-xs font-semibold text-white"
          >
            Return to Sign In
          </button>
        </div>
      </main>
    );
  }

  const { teacher, students, classes } = data;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="flex flex-col gap-4 rounded-xl border border-[#C8BEA8] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={teacher.photoUrl}
            alt={teacher.name}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-xl border border-[#C8BEA8] object-cover object-top"
          />
          <div>
            <p className="text-xs font-semibold text-[#093628]">
              Faculty &amp; Staff Portal
            </p>
            <h1 className="font-display text-3xl font-bold text-[#111815]">
              {teacher.name}
            </h1>
            <p className="text-xs text-[#525B56]">
              {teacher.title} · {teacher.availability}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToAcademy}
            className="inline-flex items-center gap-2 rounded-lg border border-[#C8BEA8] px-3.5 py-2 text-xs font-semibold text-[#111815] hover:bg-[#EAE2D3]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Homepage
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-[#093628] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#06261C]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Assigned Students */}
        <section className="lg:col-span-5">
          <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D4CBB8] px-6 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#093628]" aria-hidden="true" />
                <h2 className="font-display text-2xl font-bold text-[#111815]">
                  Assigned Students ({students.length})
                </h2>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#525B56]">
                No students are assigned to you yet. Admin assigns students to your
                roster.
              </div>
            ) : (
              <div className="divide-y divide-[#D4CBB8]">
                {students.map((student) => (
                  <div key={student.id} className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#111815]">
                      {student.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#525B56]">
                      {student.preferredCourse} ·{' '}
                      {student.enrolledPlanName ||
                        (student.accessStatus === 'trial'
                          ? 'Free Trial'
                          : 'Trial Expired')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Scheduled Classes */}
        <section className="lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
            <div className="flex items-center gap-2 border-b border-[#D4CBB8] px-6 py-4">
              <Calendar className="h-4 w-4 text-[#093628]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold text-[#111815]">
                Your Scheduled Classes ({classes.length})
              </h2>
            </div>

            {classes.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#525B56]">
                No classes scheduled yet. Scheduled Google Meet sessions created by Admin
                appear here.
              </div>
            ) : (
              <div className="divide-y divide-[#D4CBB8]">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111815]">
                        {cls.courseTitle} — {cls.studentName}
                      </p>
                      <p className="mt-0.5 text-xs text-[#525B56]">
                        <span className="font-mono tabular-nums">
                          {cls.classDate} at {cls.classTime}
                        </span>{' '}
                        · {cls.durationMinutes} min · Status: {cls.status}
                      </p>
                    </div>
                    {cls.status !== 'cancelled' && (
                      <a
                        href={cls.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-4 py-2 text-xs font-semibold text-white hover:bg-[#06261C] whitespace-nowrap shrink-0"
                      >
                        <Video className="h-3.5 w-3.5" aria-hidden="true" />
                        Open Google Meet
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
