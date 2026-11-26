import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Lock,
  LogOut,
  Receipt,
  ShieldCheck,
  Video,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type {
  CoursePlan,
  PaymentMethod,
  StudentDashboardPayload,
} from '../types';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentOptions,
  type PaymentChannelInfo,
} from './PaymentOptions';
import { PaymentStatusCard } from './PaymentStatusCard';

interface StudentDashboardProps {
  token: string;
  initialIntent: 'trial' | 'enroll';
  preselectedPlanId: string | null;
  onLogout: () => void;
  onBackToAcademy: () => void;
}

type StudentTab = 'overview' | 'enroll' | 'receipts';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00d : 00h : 00m : 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
}

export function StudentDashboard({
  token,
  initialIntent,
  preselectedPlanId,
  onLogout,
  onBackToAcademy,
}: StudentDashboardProps) {
  const [dashboard, setDashboard] = useState<StudentDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudentTab>(
    initialIntent === 'enroll' ? 'enroll' : 'overview'
  );
  const [remainingMs, setRemainingMs] = useState(0);

  const [checkoutPlanId, setCheckoutPlanId] = useState(
    preselectedPlanId || 'tajweed'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('jazzcash');
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelInfo[]>([]);
  const [accountLabel, setAccountLabel] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [res, methodsRes] = await Promise.all([
        fetch('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/payments/methods').catch(() => null),
      ]);
      if (!res.ok) {
        onLogout();
        return;
      }
      const data = (await res.json()) as StudentDashboardPayload;
      setDashboard(data);
      setRemainingMs(data.user.trialRemainingMs);

      if (methodsRes && methodsRes.ok) {
        const mData = await methodsRes.json();
        if (Array.isArray(mData.methods)) {
          setPaymentChannels(mData.methods as PaymentChannelInfo[]);
        }
      }

      setCheckoutPlanId((prev) => {
        if (preselectedPlanId) return preselectedPlanId;
        if (data.plans.length > 0 && !data.plans.some((p) => p.id === prev)) {
          return data.plans[0].id;
        }
        return prev;
      });
      if (data.user.accessStatus === 'locked' && initialIntent !== 'enroll') {
        setActiveTab('enroll');
      }
    } finally {
      setLoading(false);
    }
  }, [token, onLogout, preselectedPlanId, initialIntent]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (preselectedPlanId) {
      setCheckoutPlanId(preselectedPlanId);
    }
  }, [preselectedPlanId]);

  useEffect(() => {
    if (initialIntent === 'enroll') {
      setActiveTab('enroll');
    }
  }, [initialIntent]);

  useEffect(() => {
    if (!dashboard || dashboard.user.accessStatus !== 'trial' || !dashboard.user.trialEndsAt) {
      return;
    }
    const targetMs = new Date(dashboard.user.trialEndsAt).getTime();
    const timer = window.setInterval(() => {
      const next = Math.max(0, targetMs - Date.now());
      setRemainingMs(next);
      if (next === 0) {
        loadDashboard();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dashboard, loadDashboard]);

  const handleSimulateExpiry = async () => {
    try {
      const res = await fetch('/api/student/simulate-expiry', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadDashboard();
        setActiveTab('enroll');
      }
    } catch {
      setSubmitError('Unable to update trial status.');
    }
  };

  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitLoading(true);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: checkoutPlanId,
          paymentMethod,
          accountLabel,
          transactionRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Unable to submit payment.');
        return;
      }
      setSubmitSuccess(data.message);
      setAccountLabel('');
      setTransactionRef('');
      await loadDashboard();
      setActiveTab('receipts');
    } catch {
      setSubmitError('Network error while submitting payment.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-[#D4CBB8]" />
          <div className="h-44 w-full animate-pulse rounded-xl bg-[#EAE2D3]" />
        </div>
      </main>
    );
  }

  const { user, assignedTeacher, payments, classes, plans } = dashboard;
  const isLocked = user.accessStatus === 'locked';
  const isTrial = user.accessStatus === 'trial';
  const isActive = user.accessStatus === 'active';
  const selectedPlan: CoursePlan | undefined =
    plans.find((p) => p.id === checkoutPlanId) || plans[0];
  const guide = PAYMENT_METHOD_CONFIG[paymentMethod];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="rounded-xl border border-[#C8BEA8] bg-white p-5">
            <div className="border-b border-[#D4CBB8] pb-4">
              <p className="text-xs font-medium text-[#525B56]">Student Account</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#111815]">
                {user.name}
              </h2>
              <p className="truncate text-xs text-[#525B56]">{user.email}</p>
            </div>

            <nav aria-label="Student dashboard tabs" className="mt-4 space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[#093628] text-white'
                    : 'text-[#111815] hover:bg-[#EAE2D3]'
                }`}
              >
                <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Overview &amp; Classes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('enroll')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'enroll'
                    ? 'bg-[#093628] text-white'
                    : 'text-[#111815] hover:bg-[#EAE2D3]'
                }`}
              >
                <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Enroll &amp; Pay Fee</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('receipts')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'receipts'
                    ? 'bg-[#093628] text-white'
                    : 'text-[#111815] hover:bg-[#EAE2D3]'
                }`}
              >
                <Receipt className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Payment History</span>
              </button>
            </nav>

            <div className="mt-6 space-y-2 border-t border-[#D4CBB8] pt-4">
              <button
                type="button"
                onClick={onBackToAcademy}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#3C4641] hover:bg-[#EAE2D3] hover:text-[#111815]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back to Homepage</span>
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

        {/* Main Content */}
        <section className="space-y-6 lg:col-span-9">
          {/* Status Banner */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#C8BEA8] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {isActive && (
                  <>
                    <CheckCircle2
                      className="h-4 w-4 text-[#093628]"
                      aria-hidden="true"
                    />
                    <span className="text-[#093628]">
                      Active Paid Enrollment · {user.enrolledPlanName || user.preferredCourse}
                    </span>
                  </>
                )}
                {isTrial && (
                  <>
                    <Clock className="h-4 w-4 text-[#9F7225]" aria-hidden="true" />
                    <span className="text-[#8A611C]">
                      3-Day Free Trial Active · {user.preferredCourse}
                    </span>
                  </>
                )}
                {isLocked && (
                  <>
                    <Lock className="h-4 w-4 text-red-700" aria-hidden="true" />
                    <span className="text-red-700">
                      Trial Expired · Account Locked Until Enrollment Verified
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-1.5 font-display text-3xl font-bold text-[#111815]">
                {isLocked
                  ? 'Your 3-Day Free Trial Has Expired'
                  : isActive
                  ? 'Student Learning Dashboard'
                  : 'Student Free Trial Dashboard'}
              </h1>
            </div>

            {isTrial && (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="rounded-lg border border-[#C8BEA8] bg-[#F3EDE2] px-4 py-2 text-right">
                  <p className="text-[11px] font-semibold text-[#525B56]">
                    Trial Remaining Time
                  </p>
                  <p className="font-mono text-sm font-bold text-[#111815] tabular-nums">
                    {formatCountdown(remainingMs)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateExpiry}
                  className="text-xs font-semibold text-[#3C4641] underline underline-offset-4 hover:text-[#093628]"
                >
                  Simulate 3-day trial expiry
                </button>
              </div>
            )}

            {isLocked && (
              <button
                type="button"
                onClick={() => setActiveTab('enroll')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#06261C] whitespace-nowrap shrink-0"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Enroll in Paid Plan
              </button>
            )}
          </div>

          {submitSuccess && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-[#9F7225]/40 bg-[#F3EDE2] px-5 py-4 text-sm font-semibold text-[#111815]"
            >
              <Clock className="h-5 w-5 text-[#9F7225] shrink-0" aria-hidden="true" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Account Summary Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#C8BEA8] bg-white p-4">
              <p className="text-xs font-medium text-[#525B56]">Selected Course</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#111815]">
                {user.preferredCourse}
              </p>
            </div>
            <div className="rounded-xl border border-[#C8BEA8] bg-white p-4">
              <p className="text-xs font-medium text-[#525B56]">Enrolled Plan</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#111815]">
                {user.enrolledPlanName || (isTrial ? '3-Day Free Trial' : 'Not Enrolled')}
              </p>
            </div>
            <div className="rounded-xl border border-[#C8BEA8] bg-white p-4">
              <p className="text-xs font-medium text-[#525B56]">Assigned Teacher</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#111815]">
                {assignedTeacher ? assignedTeacher.name : 'Pending Admin Assignment'}
              </p>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & SCHEDULED GOOGLE MEET CLASSES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <PaymentStatusCard
                token={token}
                user={user}
                payments={payments}
                plans={plans}
                channels={paymentChannels}
                defaultPlanId={checkoutPlanId}
                onPaymentSubmitted={async (message) => {
                  setSubmitSuccess(message);
                  await loadDashboard();
                }}
              />

              {isLocked ? (
                <div className="rounded-xl border border-[#C8BEA8] bg-white p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
                    <Lock className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold text-[#111815]">
                    Your 3-Day Free Trial Has Expired
                  </h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#3C4641]">
                    Class schedules and Google Meet joining links are paused until you
                    submit payment for a monthly plan and the Academy Administrator
                    verifies your transaction.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enroll')}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#093628] px-6 py-3 text-sm font-semibold text-white hover:bg-[#06261C]"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Choose Plan &amp; Submit Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedTeacher && (
                    <div className="flex flex-col gap-4 rounded-xl border border-[#C8BEA8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={assignedTeacher.photoUrl}
                          alt={assignedTeacher.name}
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 rounded-lg border border-[#C8BEA8] object-cover object-top"
                        />
                        <div>
                          <p className="text-xs font-medium text-[#525B56]">
                            Assigned Quran Scholar
                          </p>
                          <h3 className="font-display text-xl font-bold text-[#111815]">
                            {assignedTeacher.name}
                          </h3>
                          <p className="text-xs text-[#525B56]">
                            {assignedTeacher.qualifications}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
                    <div className="border-b border-[#D4CBB8] px-6 py-4">
                      <h3 className="font-display text-2xl font-bold text-[#111815]">
                        Upcoming Scheduled Classes
                      </h3>
                    </div>

                    {classes.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#525B56]">
                        No classes scheduled yet. Our Academy Administrator will schedule
                        your Google Meet classes and assign your scholar shortly.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#D4CBB8]">
                        {classes.map((session) => (
                          <div
                            key={session.id}
                            className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#111815]">
                                {session.courseTitle} ({session.sessionType})
                              </p>
                              <p className="mt-0.5 text-xs text-[#525B56]">
                                Teacher: {session.teacherName} ·{' '}
                                <span className="font-mono tabular-nums">
                                  {session.classDate} at {session.classTime}
                                </span>{' '}
                                · {session.durationMinutes} min
                              </p>
                            </div>
                            <a
                              href={session.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-4 py-2 text-xs font-semibold text-white hover:bg-[#06261C] whitespace-nowrap shrink-0"
                            >
                              <Video className="h-3.5 w-3.5" aria-hidden="true" />
                              Join Google Meet
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENROLL & SUBMIT PAYMENT (STAYS PENDING UNTIL ADMIN APPROVAL) */}
          {activeTab === 'enroll' && (
            <div className="rounded-xl border border-[#C8BEA8] bg-white p-6 lg:p-8">
              <div className="border-b border-[#D4CBB8] pb-5">
                <p className="text-xs font-semibold text-[#093628]">
                  Available Plans &amp; Fee Submission
                </p>
                <h2 className="mt-1 font-display text-3xl font-bold text-[#111815]">
                  Select Your Plan &amp; Submit Payment Details
                </h2>
                <p className="mt-1 text-sm text-[#3C4641]">
                  Choose PayPal, JazzCash, or Easypaisa and submit your transaction
                  reference. All manual payments remain <strong>Pending</strong> until
                  verified and approved by the Academy Administrator.
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="mt-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#111815]">
                    1. Select Monthly Plan
                  </label>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => {
                      const active = checkoutPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setCheckoutPlanId(plan.id)}
                          className={`rounded-xl border p-4 text-left transition-colors ${
                            active
                              ? 'border-[#093628] bg-[#093628] text-white'
                              : 'border-[#C8BEA8] bg-[#F3EDE2] text-[#111815] hover:border-[#093628]'
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-display text-xl font-bold">
                              {plan.name}
                            </span>
                            <span
                              className={`font-mono text-base font-semibold tabular-nums ${
                                active ? 'text-[#D6B87C]' : 'text-[#093628]'
                              }`}
                            >
                              ${plan.priceUsd}
                            </span>
                          </div>
                          <p
                            className={`mt-2 text-xs font-medium ${
                              active ? 'text-white/85' : 'text-[#3C4641]'
                            }`}
                          >
                            {plan.sessionsPerWeek} classes/week · {plan.durationMinutes}{' '}
                            min
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <PaymentOptions
                  selectedMethod={paymentMethod}
                  amountUsd={selectedPlan?.priceUsd ?? 55}
                  channels={paymentChannels}
                  onSelectMethod={setPaymentMethod}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="account-label"
                      className="block text-xs font-semibold text-[#111815]"
                    >
                      3. {guide.accountLabelPrompt}
                    </label>
                    <input
                      id="account-label"
                      type="text"
                      required
                      value={accountLabel}
                      onChange={(e) => setAccountLabel(e.target.value)}
                      placeholder={guide.accountPlaceholder}
                      className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="tx-ref"
                      className="block text-xs font-semibold text-[#111815]"
                    >
                      4. {guide.txPrompt}
                    </label>
                    <input
                      id="tx-ref"
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder={guide.txPlaceholder}
                      className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                    />
                  </div>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
                  >
                    {submitError}
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-[#D4CBB8] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#3C4641]">
                    <ShieldCheck className="h-4 w-4 text-[#093628]" aria-hidden="true" />
                    <span>
                      Submission is recorded as <strong>Pending</strong> until Admin
                      approval.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#093628] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {submitLoading
                      ? 'Submitting Payment...'
                      : `Submit ${guide.title} Payment ($${selectedPlan?.priceUsd ?? 55})`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'receipts' && (
            <div className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white">
              <div className="border-b border-[#D4CBB8] px-6 py-4">
                <h2 className="font-display text-2xl font-bold text-[#111815]">
                  Payment History &amp; Verification Status
                </h2>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#525B56]">
                    No payments submitted yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enroll')}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#093628] px-4 py-2 text-xs font-semibold text-white hover:bg-[#06261C]"
                  >
                    Submit Plan Payment
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#D4CBB8] bg-[#F3EDE2] text-xs font-semibold text-[#3C4641]">
                      <tr>
                        <th className="px-6 py-3">Transaction Ref</th>
                        <th className="px-6 py-3">Plan</th>
                        <th className="px-6 py-3">Method</th>
                        <th className="px-6 py-3">Submitted</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4CBB8]">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F3EDE2]/60">
                          <td className="px-6 py-3.5 font-mono text-xs text-[#111815] tabular-nums">
                            {p.transactionRef}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-[#111815]">
                            {p.planName}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-[#3C4641]">
                            {PAYMENT_METHOD_CONFIG[p.paymentMethod]?.title ??
                              p.paymentMethod}{' '}
                            · {p.accountLabel}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-xs text-[#3C4641] tabular-nums">
                            {new Date(p.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-semibold text-[#111815] tabular-nums">
                            ${p.amountUsd}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {p.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#093628]">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                Approved
                              </span>
                            )}
                            {p.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A611C]">
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                Pending Verification
                              </span>
                            )}
                            {p.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                Rejected
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
        </section>
      </div>
    </main>
  );
}
