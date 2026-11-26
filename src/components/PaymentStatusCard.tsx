import { CheckCircle2, Clock, Send, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type {
  CoursePlan,
  PaymentMethod,
  PaymentRecord,
  StudentUser,
} from '../types';
import {
  PAYMENT_METHOD_CONFIG,
  type PaymentChannelInfo,
} from './PaymentOptions';

interface PaymentStatusCardProps {
  token: string;
  user: StudentUser;
  payments: PaymentRecord[];
  plans: CoursePlan[];
  channels: PaymentChannelInfo[];
  defaultPlanId: string;
  onPaymentSubmitted: (message: string) => Promise<void> | void;
}

export function PaymentStatusCard({
  token,
  user,
  payments,
  plans,
  channels,
  defaultPlanId,
  onPaymentSubmitted,
}: PaymentStatusCardProps) {
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  const latestPayment = sortedPayments[0] ?? null;

  const isVerified =
    user.accessStatus === 'active' || latestPayment?.status === 'approved';
  const isPending = !isVerified && latestPayment?.status === 'pending';
  const isRejected = !isVerified && latestPayment?.status === 'rejected';

  const [showFormWhenVerified, setShowFormWhenVerified] = useState(false);
  const [planId, setPlanId] = useState(defaultPlanId || plans[0]?.id || 'tajweed');
  const [method, setMethod] = useState<PaymentMethod>('jazzcash');
  const [accountLabel, setAccountLabel] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (plans.length > 0 && !plans.some((p) => p.id === planId)) {
      setPlanId(plans[0].id);
    }
  }, [plans, planId]);

  const methodMeta = PAYMENT_METHOD_CONFIG[method];
  const channelInfo = channels.find((c) => c.method === method);
  const receiverAccount =
    channelInfo?.receiverAccount || methodMeta.accountDetails;
  const selectedPlan = plans.find((p) => p.id === planId) || plans[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          paymentMethod: method,
          accountLabel,
          transactionRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Unable to submit transaction reference.');
        return;
      }
      setAccountLabel('');
      setTransactionRef('');
      setShowFormWhenVerified(false);
      await onPaymentSubmitted(
        data.message ||
          'Transaction reference submitted and marked pending for admin approval.'
      );
    } catch {
      setErrorMsg('Network error while connecting to payment API.');
    } finally {
      setSubmitting(false);
    }
  };

  const showUploadForm = !isVerified || showFormWhenVerified;

  return (
    <section
      aria-labelledby="payment-status-heading"
      className="rounded-xl border border-[#C8BEA8] bg-white p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#D4CBB8] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#525B56]">
            Tuition &amp; Enrollment Verification
          </p>
          <h2
            id="payment-status-heading"
            className="mt-0.5 font-display text-2xl font-bold text-[#111815]"
          >
            Payment Status
          </h2>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 text-[#093628]">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Verified</span>
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-1.5 text-[#8A611C]">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Pending Admin Verification</span>
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1.5 text-red-700">
              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Rejected — Resubmit Reference</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[#8A611C]">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Pending Submission</span>
            </span>
          )}
        </div>
      </div>

      {/* Latest Payment Summary */}
      {latestPayment ? (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-[#D4CBB8] bg-[#F3EDE2] p-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-medium text-[#525B56]">Plan</p>
            <p className="mt-0.5 text-sm font-bold text-[#111815]">
              {latestPayment.planName}{' '}
              <span className="font-mono text-xs font-semibold text-[#093628] tabular-nums">
                (${latestPayment.amountUsd})
              </span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#525B56]">Method</p>
            <p className="mt-0.5 text-sm font-semibold text-[#111815]">
              {PAYMENT_METHOD_CONFIG[latestPayment.paymentMethod]?.title ??
                latestPayment.paymentMethod}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#525B56]">
              Transaction Reference
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[#111815] tabular-nums">
              {latestPayment.transactionRef}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#525B56]">Status</p>
            <p
              className={`mt-0.5 text-sm font-bold ${
                latestPayment.status === 'approved'
                  ? 'text-[#093628]'
                  : latestPayment.status === 'rejected'
                  ? 'text-red-700'
                  : 'text-[#8A611C]'
              }`}
            >
              {latestPayment.status === 'approved'
                ? 'Verified'
                : latestPayment.status === 'rejected'
                ? 'Rejected'
                : 'Pending'}
            </p>
          </div>
          {latestPayment.adminNote && (
            <div className="border-t border-[#D4CBB8] pt-2.5 text-xs text-[#3C4641] sm:col-span-4">
              <strong className="text-[#111815]">Admin Note:</strong>{' '}
              {latestPayment.adminNote}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#3C4641]">
          No tuition payment has been submitted yet. Transfer your monthly plan fee
          via JazzCash, EasyPaisa, Bank Transfer, or PayPal and enter your
          transaction reference code below for Admin verification.
        </p>
      )}

      {isVerified && !showFormWhenVerified && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="flex items-center gap-2 text-xs font-medium text-[#093628]">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Your enrollment is verified and live classes are unlocked.</span>
          </p>
          <button
            type="button"
            onClick={() => setShowFormWhenVerified(true)}
            className="text-xs font-semibold text-[#093628] underline underline-offset-4 hover:text-[#06261C]"
          >
            Submit another transaction reference
          </button>
        </div>
      )}

      {/* Transaction Reference Upload Form */}
      {showUploadForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4 border-t border-[#EAE2D3] pt-5"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#093628]">
              Upload Transaction Reference for Manual Approval
            </h3>
            <p className="font-mono text-xs text-[#525B56] tabular-nums">
              Send to: <strong className="text-[#111815]">{receiverAccount}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="ps-plan"
                className="block text-xs font-semibold text-[#111815]"
              >
                Monthly Plan
              </label>
              <select
                id="ps-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.priceUsd}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ps-method"
                className="block text-xs font-semibold text-[#111815]"
              >
                Payment Method
              </label>
              <select
                id="ps-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
              >
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ps-account"
                className="block text-xs font-semibold text-[#111815]"
              >
                {methodMeta.accountLabelPrompt}
              </label>
              <input
                id="ps-account"
                type="text"
                required
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder={methodMeta.accountPlaceholder}
                className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="ps-tx-ref"
                className="block text-xs font-semibold text-[#111815]"
              >
                Transaction Reference Code
              </label>
              <input
                id="ps-tx-ref"
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder={methodMeta.txPlaceholder}
                className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3 py-2.5 font-mono text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#525B56]">
              Submissions enter <strong>Pending</strong> status until verified by
              the Academy Administrator.
            </p>
            <div className="flex items-center gap-3">
              {isVerified && showFormWhenVerified && (
                <button
                  type="button"
                  onClick={() => setShowFormWhenVerified(false)}
                  className="text-xs font-semibold text-[#525B56] hover:text-[#111815]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#093628] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#06261C] disabled:opacity-60 whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {submitting
                  ? 'Submitting Reference...'
                  : `Submit ${methodMeta.title} Reference ($${selectedPlan?.priceUsd ?? 55})`}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
