import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, Lock, Shield } from 'lucide-react';
import {
  createZohoWidgetSession,
  openZohoCheckoutWidget,
  verifyZohoWidgetPayment,
} from '@/app/utils/zohoPaymentsIntegration';

type PaymentState = 'idle' | 'creating' | 'processing' | 'verifying' | 'success' | 'error';

export function QuickPaymentPage() {
  const [amount, setAmount] = useState('1000');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('Honey Translation Services payment');
  const [status, setStatus] = useState<PaymentState>('idle');
  const [message, setMessage] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const canSubmit = useMemo(() => {
    const numericAmount = Number(amount);
    return (
      Number.isFinite(numericAmount) &&
      numericAmount > 0 &&
      name.trim().length > 1 &&
      email.includes('@') &&
      status !== 'creating' &&
      status !== 'processing' &&
      status !== 'verifying'
    );
  }, [amount, email, name, status]);

  const handleQuickPayment = async () => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setStatus('error');
      setMessage('Enter a valid payment amount.');
      return;
    }

    if (!name.trim() || !email.trim()) {
      setStatus('error');
      setMessage('Name and email are required.');
      return;
    }

    try {
      setStatus('creating');
      setMessage('Creating your Razorpayment session...');
      setPaymentId('');

      const referenceNumber = `QP-${Date.now()}`;
      const invoiceNumber = `HTQP-${Date.now().toString().slice(-8)}`;

      const session = await createZohoWidgetSession({
        amount: Number(numericAmount.toFixed(2)),
        currencyCode: 'INR',
        description: description.trim() || 'Honey Translation Services payment',
        invoiceNumber,
        referenceNumber,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      setStatus('processing');
      setMessage('Opening secure Zoho checkout...');

      const widgetResult = await openZohoCheckoutWidget({
        session,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      const resolvedPaymentId =
        widgetResult?.payment_id ||
        widgetResult?.payment?.payment_id ||
        widgetResult?.data?.payment_id ||
        '';

      if (!resolvedPaymentId) {
        throw new Error('Payment was not completed in the Zoho checkout window.');
      }

      setStatus('verifying');
      setMessage('Verifying payment with Razorpay...');

      const verification = await verifyZohoWidgetPayment({
        paymentId: resolvedPaymentId,
        paymentsSessionId: session.payments_session_id,
      });

      if (verification.status !== 'succeeded') {
        throw new Error(`Payment status is ${verification.status}.`);
      }

      setPaymentId(resolvedPaymentId);
      setStatus('success');
      setMessage('Payment completed and verified successfully.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setStatus('error');
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-orange-600 to-red-600 shadow-xl">
            <CreditCard className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-stone-900">Zoho Quick Payment</h1>
          <p className="mx-auto max-w-2xl text-lg text-stone-600">
            Pay directly through your Razorpay integration without leaving this checkout flow.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-orange-200 bg-white/90 p-8 shadow-2xl shadow-orange-200/40 backdrop-blur">
            <div className="mb-8 flex items-center gap-3">
              <Shield className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="text-2xl font-semibold text-stone-900">Payment Details</h2>
                <p className="text-sm text-stone-500">This uses your backend Zoho session API and widget checkout.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Amount (INR)</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="1000"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Customer Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="Customer name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="name@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Phone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="+91 9876543210"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-500 focus:bg-white"
                  placeholder="What is this payment for?"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleQuickPayment}
              disabled={!canSubmit}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:from-orange-700 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock className="h-5 w-5" />
              {status === 'creating' || status === 'processing' || status === 'verifying'
                ? 'Processing Payment...'
                : 'Pay with Razorpay'}
            </button>
          </section>

          <aside className="rounded-[2rem] border border-stone-200 bg-stone-950 p-8 text-stone-100 shadow-2xl">
            <h2 className="text-2xl font-semibold">Live Status</h2>
            <p className="mt-2 text-sm text-stone-400">
              This page calls `POST /api/payments/session` and `POST /api/payments/verify` on your local backend.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Current state</p>
                <p className="mt-2 text-lg font-medium capitalize">{status}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Message</p>
                <p className="mt-2 text-sm leading-6 text-stone-200">
                  {message || 'Waiting for payment input.'}
                </p>
              </div>

              {paymentId && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Payment ID</p>
                  <p className="mt-2 break-all text-sm text-emerald-100">{paymentId}</p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-orange-300" />
                <p className="text-sm text-orange-50">Server-side token refresh is enabled from your backend `.env`.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-orange-300" />
                <p className="text-sm text-orange-50">Card details stay inside Razorpay\'s payment widget.</p>
              </div>
              <div className="flex items-start gap-3">
                {status === 'error' ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
                ) : (
                  <Lock className="mt-0.5 h-5 w-5 text-orange-300" />
                )}
                <p className="text-sm text-orange-50">
                  If this fails, the most likely missing piece is a mismatched Zoho `account_id` or `widget_api_key`.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default QuickPaymentPage;
