import { Check, Clock } from 'lucide-react';
import type { PaymentMethod } from '../types';

export interface PaymentMethodMeta {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  accountHeading: string;
  accountDetails: string;
  steps: string[];
  accountLabelPrompt: string;
  accountPlaceholder: string;
  txPrompt: string;
  txPlaceholder: string;
}

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, PaymentMethodMeta> = {
  paypal: {
    id: 'paypal',
    title: 'PayPal',
    subtitle: 'International USD Transfer',
    accountHeading: 'PayPal Merchant Account · Yaqoot Wal Marjan',
    accountDetails: 'payments@yaqootwalmarjan.com',
    steps: [
      'Sign in to your PayPal account and choose Send Money.',
      'Send the monthly tuition fee in USD to payments@yaqootwalmarjan.com.',
      'Enter your PayPal email and Transaction ID below for Admin verification.',
    ],
    accountLabelPrompt: 'Your PayPal Email Address',
    accountPlaceholder: 'e.g. parent@example.com',
    txPrompt: 'PayPal Transaction ID',
    txPlaceholder: 'e.g. 8HG92014XY123456A',
  },
  jazzcash: {
    id: 'jazzcash',
    title: 'JazzCash',
    subtitle: 'Mobile Wallet (PK)',
    accountHeading: 'JazzCash Account · Yaqoot Wal Marjan',
    accountDetails: '0300-0000000',
    steps: [
      'Open your JazzCash App (or dial *786#) and select Send Money.',
      'Transfer the monthly tuition fee to JazzCash 0300-0000000.',
      'Submit your sender mobile number and JazzCash TID below for Admin review.',
    ],
    accountLabelPrompt: 'Sender JazzCash Mobile Number',
    accountPlaceholder: 'e.g. 0300-1234567',
    txPrompt: 'JazzCash Transaction ID (TID)',
    txPlaceholder: 'e.g. 99827164501',
  },
  easypaisa: {
    id: 'easypaisa',
    title: 'EasyPaisa',
    subtitle: 'Mobile Wallet (PK)',
    accountHeading: 'EasyPaisa Account · Yaqoot Wal Marjan',
    accountDetails: '0345-0000000',
    steps: [
      'Open your EasyPaisa App and choose Money Transfer -> EasyPaisa.',
      'Send the monthly tuition fee to EasyPaisa 0345-0000000.',
      'Enter your sender mobile number and 11-digit TID below for verification.',
    ],
    accountLabelPrompt: 'Sender EasyPaisa Mobile Number',
    accountPlaceholder: 'e.g. 0345-1234567',
    txPrompt: 'EasyPaisa Transaction ID (TID)',
    txPlaceholder: 'e.g. 10948273615',
  },
  bank_transfer: {
    id: 'bank_transfer',
    title: 'Bank Transfer',
    subtitle: 'IBFT / Wire Transfer',
    accountHeading: 'Academy Bank IBAN · Yaqoot Wal Marjan',
    accountDetails: 'PK00MEZN0000000000000000',
    steps: [
      'Initiate an IBFT or wire transfer from your banking app to the IBAN above.',
      'Include your registered student name in the transfer remarks.',
      'Submit your sender bank name/account and UTR / reference ID below.',
    ],
    accountLabelPrompt: 'Sender Bank Name / Account Title',
    accountPlaceholder: 'e.g. Meezan Bank · Ahmad Khan',
    txPrompt: 'Bank Reference / UTR Number',
    txPlaceholder: 'e.g. IBFT-20261126-4412',
  },
};

export interface PaymentChannelInfo {
  method: PaymentMethod;
  displayName: string;
  receiverAccount: string;
  instructions: string[];
}

interface PaymentOptionsProps {
  selectedMethod: PaymentMethod;
  amountUsd: number;
  channels?: PaymentChannelInfo[];
  onSelectMethod: (method: PaymentMethod) => void;
}

function BrandMonogram({ method }: { method: PaymentMethod }) {
  if (method === 'paypal') {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087] text-base font-extrabold tracking-tight text-white shrink-0"
      >
        <span className="text-white">P</span>
        <span className="-ml-0.5 text-[#00AEEF]">P</span>
      </span>
    );
  }
  if (method === 'jazzcash') {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#B91C1C] text-sm font-extrabold tracking-tight text-[#FCD34D] shrink-0"
      >
        JC
      </span>
    );
  }
  if (method === 'easypaisa') {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#008A48] text-sm font-extrabold tracking-tight text-white shrink-0"
      >
        ep
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#093628] text-sm font-extrabold tracking-tight text-[#D6B87C] shrink-0"
    >
      BT
    </span>
  );
}

const BRAND_BUTTON_STYLE: Record<
  PaymentMethod,
  { activeBorder: string; activeBg: string; accentText: string }
> = {
  paypal: {
    activeBorder: 'border-[#003087]',
    activeBg: 'bg-[#003087]/8',
    accentText: 'text-[#003087]',
  },
  jazzcash: {
    activeBorder: 'border-[#B91C1C]',
    activeBg: 'bg-[#B91C1C]/8',
    accentText: 'text-[#B91C1C]',
  },
  easypaisa: {
    activeBorder: 'border-[#008A48]',
    activeBg: 'bg-[#008A48]/8',
    accentText: 'text-[#008A48]',
  },
  bank_transfer: {
    activeBorder: 'border-[#093628]',
    activeBg: 'bg-[#093628]/8',
    accentText: 'text-[#093628]',
  },
};

export function PaymentOptions({
  selectedMethod,
  amountUsd,
  channels,
  onSelectMethod,
}: PaymentOptionsProps) {
  const methods: PaymentMethod[] = [
    'jazzcash',
    'easypaisa',
    'bank_transfer',
    'paypal',
  ];
  const activeMeta = PAYMENT_METHOD_CONFIG[selectedMethod];
  const backendChannel = channels?.find((c) => c.method === selectedMethod);
  const displayAccount = backendChannel?.receiverAccount || activeMeta.accountDetails;
  const displaySteps =
    backendChannel?.instructions && backendChannel.instructions.length > 0
      ? backendChannel.instructions
      : activeMeta.steps;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#111815]">
          2. Choose Payment Method
        </label>
        <div
          role="radiogroup"
          aria-label="Payment method options"
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {methods.map((methodKey) => {
            const meta = PAYMENT_METHOD_CONFIG[methodKey];
            const isSelected = selectedMethod === methodKey;
            const brandStyle = BRAND_BUTTON_STYLE[methodKey];

            return (
              <button
                key={methodKey}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectMethod(methodKey)}
                className={`relative flex items-center justify-between gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${brandStyle.activeBorder} ${brandStyle.activeBg}`
                    : 'border-[#D4CBB8] bg-[#FAF8F4] hover:border-[#9E9481]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BrandMonogram method={methodKey} />
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? brandStyle.accentText : 'text-[#111815]'
                      }`}
                    >
                      {meta.title}
                    </p>
                    <p className="text-[11px] font-medium text-[#525B56]">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white shrink-0 ${
                      methodKey === 'paypal'
                        ? 'bg-[#003087]'
                        : methodKey === 'jazzcash'
                        ? 'bg-[#B91C1C]'
                        : methodKey === 'easypaisa'
                        ? 'bg-[#008A48]'
                        : 'bg-[#093628]'
                    }`}
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Payment Instructions */}
      <div className="rounded-xl border border-[#C8BEA8] bg-[#F3EDE2] p-5">
        <div className="flex flex-col gap-1 border-b border-[#D4CBB8] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#093628]">
              {activeMeta.accountHeading}
            </p>
            <p className="font-mono text-sm font-bold text-[#111815] tabular-nums">
              {displayAccount}
            </p>
          </div>
          <p className="font-mono text-sm font-bold text-[#093628] tabular-nums">
            Amount: ${amountUsd} USD
          </p>
        </div>

        <ol className="mt-3 space-y-1.5 text-xs leading-relaxed text-[#3C4641]">
          {displaySteps.map((step, index) => (
            <li key={step}>
              <span className="font-semibold text-[#111815]">{index + 1}.</span>{' '}
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-3 flex items-center gap-2 border-t border-[#D4CBB8] pt-3 text-xs font-semibold text-[#8A611C]">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Status after submission: Pending Verification until approved by Admin.
          </span>
        </div>
      </div>
    </div>
  );
}
