import React, { useState } from 'react';
import { Customer } from '../../types';
import {
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
  Share2,
  Download,
  QrCode,
  ArrowRight,
  Loader2,
  Lock,
  IndianRupee,
  Check,
} from 'lucide-react';
import { initiateRazorpayPayment, RazorpayPaymentResult } from '../../utils/razorpay';

interface RazorpayPaymentModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (result: RazorpayPaymentResult) => void;
  initialPlan?: '499_1yr' | '999_3yr';
}

export const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  customer,
  isOpen,
  onClose,
  onPaymentSuccess,
  initialPlan,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'499_1yr' | '999_3yr'>(
    initialPlan || customer.planTier || '499_1yr'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState<RazorpayPaymentResult | null>(null);

  // Sync selected plan if modal was re-opened with a different plan prop
  React.useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan, isOpen]);

  if (!isOpen) return null;

  const planAmount = selectedPlan === '999_3yr' ? 999 : 499;

  const handlePayNow = async () => {
    if (isProcessing || paymentDone) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      await initiateRazorpayPayment({
        amount: planAmount,
        planTier: selectedPlan,
        customer,
        onSuccess: (result) => {
          setIsProcessing(false);
          setSuccessResult(result);
          setPaymentDone(true);
          // Trigger success callback after short celebratory feedback
          setTimeout(() => {
            onPaymentSuccess(result);
          }, 1200);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setErrorMessage(err.description || 'Payment could not be completed. Please try again or choose another method.');
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-indigo-500/30 overflow-hidden my-6">
        {/* Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!isProcessing && !paymentDone && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl glass-card border border-white/40 dark:border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content based on state */}
        {paymentDone && successResult ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" /> Razorpay Payment Verified
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                Card Activated & Approved!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
                Payment of <strong>₹{successResult.amount}</strong> was successfully received. Your mini website is now <strong>100% Live</strong> and all sharing features are unlocked.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/30 text-xs font-mono text-left space-y-1.5">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Plan Activated:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {successResult.planTier === '999_3yr' ? '3 Years Plan (36 Months)' : '1 Year Annual Plan (12 Months)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Valid Until:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {new Date(successResult.planExpiresAt || Date.now() + 365*24*60*60*1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Transaction ID:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{successResult.paymentId}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Method:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{successResult.method}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-emerald-600">Auto-Approved (100% Active)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>Launch Your Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Razorpay Secure Gateway</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Activate Your Mini Website
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Complete payment to auto-approve your profile, unlock public sharing, and enable .vcf downloads.
              </p>
            </div>

            {/* Step 1: Choose Your Plan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Step 1: Choose Your Plan</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Select validity tier</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Plan 1 */}
                <div
                  onClick={() => setSelectedPlan('499_1yr')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                    selectedPlan === '499_1yr'
                      ? 'bg-indigo-500/15 border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/30'
                      : 'glass-card border-white/60 dark:border-white/10 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">1 Year Plan</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === '499_1yr'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-400'
                      }`}
                    >
                      {selectedPlan === '499_1yr' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹499
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Standard annual activation
                  </div>
                </div>

                {/* Plan 2 */}
                <div
                  onClick={() => setSelectedPlan('999_3yr')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                    selectedPlan === '999_3yr'
                      ? 'bg-indigo-500/15 border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/30'
                      : 'glass-card border-white/60 dark:border-white/10 hover:border-indigo-300'
                  }`}
                >
                  <div className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-bold shadow-xs">
                    Best Value
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">3 Years Plan</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === '999_3yr'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-400'
                      }`}
                    >
                      {selectedPlan === '999_3yr' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹999
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Includes 1 Free Companion Card
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Auto-Filled Payable Amount & Summary */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-slate-900/70 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Step 2: Auto-Filled Amount</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Check className="w-3 h-3 stroke-[3]" /> Auto-Filled: ₹{planAmount}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`${planAmount} (${selectedPlan === '999_3yr' ? '3 Years Plan' : '1 Year Plan'})`}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-slate-950 font-extrabold text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 shadow-inner cursor-default"
                  />
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {selectedPlan === '999_3yr' ? 'Save ₹498 (33% Off)' : 'Standard Annual'}
                  </span>
                  <span className="text-[10px]">Taxes & Hosting Included</span>
                </div>
              </div>
            </div>

            {/* What Unlocks List */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                Instant Auto-Unlocks Upon Payment:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Public Live Card URL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>1-Tap .vcf Downloads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>WhatsApp 1-Click Sharing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span>Active QR Standee</span>
                </div>
              </div>
            </div>

            {/* Payment Method Icons Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>UPI, Cards, NetBanking, GPay, PhonePe</span>
              </span>
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">Razorpay</span>
            </div>

            {/* Inline Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <span className="flex-shrink-0 font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-75 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Opening Razorpay Gateway...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{planAmount} & Launch Card Instantly</span>
                </>
              )}
            </button>

            {/* Clear Secondary Action: I'll Pay Later */}
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>← I'll Pay Later, Continue Editing Profile</span>
            </button>

            <div className="text-center text-[10px] text-slate-400">
              Auto-approved immediately • Super Admin notified in real-time
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
