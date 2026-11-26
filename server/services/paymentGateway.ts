import {
  createPayment,
  findNonRejectedPaymentByRef,
  findPaymentById,
  listPlans,
  updatePaymentReview,
  updateUser,
  type PaymentMethod,
  type PaymentRecord,
  type PaymentStatus,
  type UserRecord,
} from '../db/repository.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_PHONE_OR_WALLET_REGEX = /^[0-9+\-\s()]{7,32}$/;
const SAFE_BANK_ACCOUNT_REGEX = /^[A-Za-z0-9\s.\-_()/@]{3,64}$/;
const SAFE_TRANSACTION_REF_REGEX = /^[A-Za-z0-9\-_/.]{5,48}$/;
const UNSAFE_TEXT_REGEX = /[<>[\]{}$\\]/;

export class PaymentGatewayError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'PaymentGatewayError';
    this.statusCode = statusCode;
  }
}

export interface PaymentChannelConfig {
  method: PaymentMethod;
  displayName: string;
  verificationMode: 'manual';
  requiresManualVerification: true;
  defaultStatus: 'pending';
  receiverAccount: string;
  instructions: string[];
}

export interface ManualPaymentSubmissionInput {
  student: UserRecord;
  planId: unknown;
  paymentMethod: unknown;
  accountLabel: unknown;
  transactionRef: unknown;
}

export interface ManualPaymentVerificationInput {
  paymentId: unknown;
  adminUser: UserRecord;
  decision: unknown;
  adminNote?: unknown;
}

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  jazzcash: 'jazzcash',
  easypaisa: 'easypaisa',
  bank_transfer: 'bank_transfer',
  'bank-transfer': 'bank_transfer',
  'bank transfer': 'bank_transfer',
  banktransfer: 'bank_transfer',
  paypal: 'paypal',
};

function sanitizeSingleLineString(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') {
    return '';
  }
  const normalized = raw.replace(/[\r\n\t]+/g, ' ').trim();
  if (!normalized || UNSAFE_TEXT_REGEX.test(normalized)) {
    return '';
  }
  return normalized.slice(0, maxLen);
}

export class PaymentGateway {
  static readonly SUPPORTED_METHODS: readonly PaymentMethod[] = [
    'jazzcash',
    'easypaisa',
    'bank_transfer',
    'paypal',
  ];

  static getSupportedChannels(): PaymentChannelConfig[] {
    return [
      {
        method: 'jazzcash',
        displayName: 'JazzCash',
        verificationMode: 'manual',
        requiresManualVerification: true,
        defaultStatus: 'pending',
        receiverAccount:
          process.env.JAZZCASH_MERCHANT_ACCOUNT?.trim() || '0300-0000000',
        instructions: [
          'Open the JazzCash App (or dial *786#) and select Send Money.',
          'Transfer the monthly plan amount to the Academy JazzCash account.',
          'Submit your sender mobile number and JazzCash TID for Admin verification.',
        ],
      },
      {
        method: 'easypaisa',
        displayName: 'EasyPaisa',
        verificationMode: 'manual',
        requiresManualVerification: true,
        defaultStatus: 'pending',
        receiverAccount:
          process.env.EASYPAISA_MERCHANT_ACCOUNT?.trim() || '0345-0000000',
        instructions: [
          'Open the EasyPaisa App and choose Money Transfer -> EasyPaisa.',
          'Send the monthly plan amount to the Academy EasyPaisa account.',
          'Submit your sender mobile number and 11-digit TID for Admin verification.',
        ],
      },
      {
        method: 'bank_transfer',
        displayName: 'Bank Transfer',
        verificationMode: 'manual',
        requiresManualVerification: true,
        defaultStatus: 'pending',
        receiverAccount:
          process.env.BANK_TRANSFER_IBAN?.trim() ||
          'PK00MEZN0000000000000000 (Yaqoot Wal Marjan Academy)',
        instructions: [
          'Transfer the monthly plan fee via IBFT or wire transfer to the Academy IBAN.',
          'Record the sender bank account title or last 4 digits of your account.',
          'Submit your bank reference / UTR number for Admin verification.',
        ],
      },
      {
        method: 'paypal',
        displayName: 'PayPal',
        verificationMode: 'manual',
        requiresManualVerification: true,
        defaultStatus: 'pending',
        receiverAccount:
          process.env.PAYPAL_MERCHANT_EMAIL?.trim() ||
          'payments@yaqootwalmarjan.com',
        instructions: [
          'Sign in to PayPal and choose Send Money.',
          'Send the monthly tuition fee in USD to the Academy PayPal address.',
          'Submit your PayPal email and Transaction ID for Admin verification.',
        ],
      },
    ];
  }

  static normalizeMethod(rawMethod: unknown): PaymentMethod {
    if (typeof rawMethod !== 'string') {
      throw new PaymentGatewayError(
        400,
        'Please select a valid payment method (JazzCash, EasyPaisa, Bank Transfer, or PayPal).'
      );
    }
    const key = rawMethod.trim().toLowerCase();
    const mapped = METHOD_ALIASES[key];
    if (!mapped) {
      throw new PaymentGatewayError(
        400,
        'Unsupported payment method. Accepted methods: JazzCash, EasyPaisa, Bank Transfer, and PayPal.'
      );
    }
    return mapped;
  }

  static validateSubmissionFields(
    method: PaymentMethod,
    rawAccountLabel: unknown,
    rawTransactionRef: unknown
  ): { accountLabel: string; transactionRef: string } {
    if (typeof rawAccountLabel !== 'string' || typeof rawTransactionRef !== 'string') {
      throw new PaymentGatewayError(
        400,
        'Sender account details and transaction reference are required.'
      );
    }

    const accountLabel = sanitizeSingleLineString(rawAccountLabel, 80);
    const transactionRef = sanitizeSingleLineString(rawTransactionRef, 48);

    if (!accountLabel) {
      throw new PaymentGatewayError(
        400,
        'Please enter valid sender account details without special markup characters.'
      );
    }
    if (!transactionRef || !SAFE_TRANSACTION_REF_REGEX.test(transactionRef)) {
      throw new PaymentGatewayError(
        400,
        'Please enter a valid transaction reference ID (5-48 alphanumeric, dash, slash, dot, or underscore characters).'
      );
    }

    if (method === 'paypal') {
      if (!EMAIL_REGEX.test(accountLabel.toLowerCase())) {
        throw new PaymentGatewayError(
          400,
          'Please enter a valid sender PayPal email address.'
        );
      }
      return {
        accountLabel: accountLabel.toLowerCase(),
        transactionRef,
      };
    }

    if (method === 'jazzcash' || method === 'easypaisa') {
      if (!SAFE_PHONE_OR_WALLET_REGEX.test(accountLabel)) {
        throw new PaymentGatewayError(
          400,
          `Please enter a valid sender ${
            method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'
          } mobile wallet number.`
        );
      }
      return { accountLabel, transactionRef };
    }

    if (!SAFE_BANK_ACCOUNT_REGEX.test(accountLabel)) {
      throw new PaymentGatewayError(
        400,
        'Please enter a valid sender bank name or account reference.'
      );
    }
    return { accountLabel, transactionRef };
  }

  static async processManualPayment(
    input: ManualPaymentSubmissionInput
  ): Promise<{ payment: PaymentRecord; channel: PaymentChannelConfig }> {
    if (input.student.role !== 'student') {
      throw new PaymentGatewayError(
        403,
        'Only student accounts may submit enrollment payments.'
      );
    }

    if (typeof input.planId !== 'string' || !input.planId.trim()) {
      throw new PaymentGatewayError(400, 'Please select a valid monthly plan.');
    }

    const cleanPlanId = sanitizeSingleLineString(input.planId, 64);
    if (!cleanPlanId) {
      throw new PaymentGatewayError(400, 'Invalid plan identifier.');
    }

    const plans = await listPlans();
    const plan = plans.find((p) => p.id === cleanPlanId);
    if (!plan) {
      throw new PaymentGatewayError(400, 'Selected plan was not found.');
    }

    const method = PaymentGateway.normalizeMethod(input.paymentMethod);
    const { accountLabel, transactionRef } = PaymentGateway.validateSubmissionFields(
      method,
      input.accountLabel,
      input.transactionRef
    );

    const existingDuplicate = await findNonRejectedPaymentByRef(
      method,
      transactionRef
    );
    if (existingDuplicate) {
      throw new PaymentGatewayError(
        409,
        'This transaction reference has already been submitted and is pending or verified.'
      );
    }

    const channel = PaymentGateway.getSupportedChannels().find(
      (c) => c.method === method
    )!;

    // Enforce server-side manual verification state: always 'pending' until Admin reviews
    const payment = await createPayment({
      studentId: input.student.id,
      studentName: input.student.name,
      studentEmail: input.student.email,
      planId: plan.id,
      planName: plan.name,
      amountUsd: plan.priceUsd,
      paymentMethod: method,
      transactionRef,
      accountLabel,
      requiresManualVerification: true,
      status: 'pending',
      adminNote: '',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    });

    await updateUser(input.student.id, {
      preferredCourse: plan.name,
    });

    return { payment, channel };
  }

  static async verifyManualPayment(
    input: ManualPaymentVerificationInput
  ): Promise<{ payment: PaymentRecord; unlockedStudent: UserRecord | null }> {
    if (input.adminUser.role !== 'admin') {
      throw new PaymentGatewayError(
        403,
        'Only an Academy Administrator can verify manual payments.'
      );
    }

    if (typeof input.paymentId !== 'string' || !input.paymentId.trim()) {
      throw new PaymentGatewayError(400, 'Invalid payment identifier.');
    }
    const cleanPaymentId = sanitizeSingleLineString(input.paymentId, 128);
    if (!cleanPaymentId) {
      throw new PaymentGatewayError(400, 'Invalid payment identifier.');
    }

    if (input.decision !== 'approved' && input.decision !== 'rejected') {
      throw new PaymentGatewayError(
        400,
        'Verification decision must be approved or rejected.'
      );
    }

    const cleanNote =
      typeof input.adminNote === 'string'
        ? sanitizeSingleLineString(input.adminNote, 200)
        : '';

    const existing = await findPaymentById(cleanPaymentId);
    if (!existing) {
      throw new PaymentGatewayError(404, 'Payment record not found.');
    }

    if (existing.status !== 'pending') {
      throw new PaymentGatewayError(
        409,
        `Payment has already been marked as ${existing.status}.`
      );
    }

    const updated = await updatePaymentReview(
      existing.id,
      input.decision as PaymentStatus,
      cleanNote
    );

    if (!updated) {
      throw new PaymentGatewayError(404, 'Payment record not found.');
    }

    let unlockedStudent: UserRecord | null = null;
    if (input.decision === 'approved') {
      unlockedStudent = await updateUser(updated.studentId, {
        accessStatus: 'active',
        enrolledPlanId: updated.planId,
        enrolledPlanName: updated.planName,
      });
    }

    return { payment: updated, unlockedStudent };
  }
}
