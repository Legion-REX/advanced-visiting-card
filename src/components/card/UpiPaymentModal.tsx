import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Customer } from '../../types';
import { MiniWebsiteTheme } from '../../utils/themes';
import {
  generateUpiUri,
  SUPPORTED_UPI_APPS,
  UpiAppKey,
  isMobileUserAgent,
  launchUpiPayment,
  cleanUpiId,
  isValidUpiId,
} from '../../utils/upi';
import {
  X,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ShieldCheck,
  Download,
  IndianRupee,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface UpiPaymentModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: string | number;
  initialNote?: string;
  theme?: MiniWebsiteTheme;
}

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  customer,
  isOpen,
  onClose,
  initialAmount = '',
  initialNote = '',
  theme,
}) => {
  const upiId = cleanUpiId(customer.upiId);
  const payeeName = customer.businessName || `${customer.firstName} ${customer.lastName}`;

  // Clean initial amount if string has currency symbol
  const cleanedInitialAmt = initialAmount
    ? String(initialAmount).replace(/[^0-9.]/g, '')
    : '';

  const [amount, setAmount] = useState<string>(cleanedInitialAmt);
  const [note, setNote] = useState<string>(initialNote || `Payment to ${payeeName}`);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? isMobileUserAgent() : false;
  });
  const [activeTab, setActiveTab] = useState<'apps' | 'qr'>(() => {
    if (typeof window !== 'undefined' && !isMobileUserAgent()) {
      return 'qr';
    }
    return 'apps';
  });
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showAppNotice, setShowAppNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mobileDetected = isMobileUserAgent();
    setIsMobile(mobileDetected);
    if (!mobileDetected) {
      setActiveTab('qr');
    }
  }, [isOpen]);

  // Update values if modal opens with different product/amount
  useEffect(() => {
    if (isOpen) {
      if (initialAmount) {
        setAmount(String(initialAmount).replace(/[^0-9.]/g, ''));
      }
      if (initialNote) {
        setNote(initialNote);
      }
    }
  }, [isOpen, initialAmount, initialNote]);

  // Compute live universal UPI URI
  const universalUpiUri = generateUpiUri(
    {
      upiId,
      payeeName,
      amount: amount ? parseFloat(amount) : undefined,
      note,
    },
    'all'
  );

  // Generate dynamic QR code whenever amount or UPI URL changes
  useEffect(() => {
    if (canvasRef.current && universalUpiUri) {
      QRCode.toCanvas(
        canvasRef.current,
        universalUpiUri,
        {
          width: 200,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (!error && canvasRef.current) {
            setQrDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [universalUpiUri, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleCopyUpi = async () => {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleLaunchApp = (appKey: UpiAppKey) => {
    const url = generateUpiUri(
      {
        upiId,
        payeeName,
        amount: amount ? parseFloat(amount) : undefined,
        note,
      },
      appKey
    );

    // Launch UPI intent
    launchUpiPayment(url);

    if (!isMobileUserAgent()) {
      setShowAppNotice(
        `Triggering ${appKey === 'all' ? 'UPI app' : appKey.toUpperCase()}. On desktop PCs without UPI apps, please switch to the "Scan & Pay QR" tab above to scan with PhonePe, Paytm or Google Pay camera.`
      );
      setTimeout(() => setShowAppNotice(null), 6000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${customer.slug || 'UPI'}_Payment_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="upi-payment-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/60 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {customer.avatarUrl ? (
              <img
                src={customer.avatarUrl}
                alt={payeeName}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
                ₹
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug truncate max-w-[210px] sm:max-w-xs">
                  {payeeName}
                </h3>
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 mr-0.5" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                UPI ID: <span className="font-semibold text-slate-700 dark:text-slate-200">{upiId || 'Not configured'}</span>
              </p>
            </div>
          </div>

          <button
            id="close-upi-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if client hasn't added UPI ID */}
        {!upiId ? (
          <div className="my-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
            <p className="font-bold mb-1">⚠️ UPI ID Not Configured</p>
            <p>
              This merchant has not set up their UPI ID yet. The business owner can add their UPI ID in their Customer Portal profile settings.
            </p>
          </div>
        ) : (
          <>
            {/* Amount Section */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Amount to Pay (INR ₹)
              </label>
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                  ₹
                </div>
                <input
                  id="upi-amount-input"
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (optional)"
                  className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Quick:
                </span>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${
                      amount === String(amt)
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Optional Note */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/40">
                <input
                  id="upi-note-input"
                  type="text"
                  maxLength={60}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add payment note or order reference"
                  className="w-full px-3 py-1.5 rounded-lg bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 outline-none transition-all"
                />
              </div>
            </div>

            {/* Notification / Toast for desktop app trigger */}
            {showAppNotice && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-200 text-xs flex items-start gap-2 animate-in fade-in">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{showAppNotice}</p>
              </div>
            )}

            {/* View Mode Toggle: Mobile App Intent vs Dynamic QR Code */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 my-4 border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('apps')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'apps'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay via UPI App</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'qr'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan & Pay QR</span>
              </button>
            </div>

            {/* TAB 1: Mobile UPI App Selection (Direct PhonePe, Paytm, GPay, BHIM & Universal Intents) */}
            {activeTab === 'apps' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                {/* 1. PhonePe Direct Option */}
                <a
                  id="pay-phonepe-btn"
                  href={generateUpiUri({ upiId, payeeName, amount: amount ? parseFloat(amount) : undefined, note }, 'phonepe')}
                  onClick={(e) => {
                    if (!isMobileUserAgent()) e.preventDefault();
                    handleLaunchApp('phonepe');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#5f259f] hover:bg-[#521f8a] text-white font-bold text-sm shadow-md shadow-purple-950/20 active:scale-[0.98] transition-all flex items-center justify-between group border border-purple-400/30 cursor-pointer no-underline"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-white text-[#5f259f] flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                      पे
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white">PhonePe</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                          Fastest
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-100 font-normal">
                        Open & Pay directly via PhonePe App
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-200 group-hover:translate-x-1 group-hover:text-white transition-all flex-shrink-0 ml-2" />
                </a>

                {/* 2. Paytm Direct Option */}
                <a
                  id="pay-paytm-btn"
                  href={generateUpiUri({ upiId, payeeName, amount: amount ? parseFloat(amount) : undefined, note }, 'paytm')}
                  onClick={(e) => {
                    if (!isMobileUserAgent()) e.preventDefault();
                    handleLaunchApp('paytm');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#002970] hover:bg-[#002058] text-white font-bold text-sm shadow-md shadow-blue-950/20 active:scale-[0.98] transition-all flex items-center justify-between group border border-blue-400/30 cursor-pointer no-underline"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center px-1 shadow-xs flex-shrink-0">
                      <span className="text-[11px] font-black text-[#002970] leading-none tracking-tight">
                        Pay<span className="text-[#00b9f5]">tm</span>
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white">Paytm UPI</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                          Popular
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-100 font-normal">
                        Pay via Paytm Wallet, Bank A/C or UPI
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 group-hover:text-white transition-all flex-shrink-0 ml-2" />
                </a>

                {/* 3. Google Pay Direct Option */}
                <a
                  id="pay-gpay-btn"
                  href={generateUpiUri({ upiId, payeeName, amount: amount ? parseFloat(amount) : undefined, note }, 'gpay')}
                  onClick={(e) => {
                    if (!isMobileUserAgent()) e.preventDefault();
                    handleLaunchApp('gpay');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-between group border border-slate-300 dark:border-slate-700 cursor-pointer no-underline"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs flex-shrink-0 font-black text-sm">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">P</span>
                      <span className="text-[#FBBC05]">a</span>
                      <span className="text-[#34A853]">y</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">Google Pay</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          GPay
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        Direct 1-Tap Google Pay Checkout
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-white transition-all flex-shrink-0 ml-2" />
                </a>

                {/* 4. BHIM UPI Direct Option */}
                <a
                  id="pay-bhim-btn"
                  href={generateUpiUri({ upiId, payeeName, amount: amount ? parseFloat(amount) : undefined, note }, 'bhim')}
                  onClick={(e) => {
                    if (!isMobileUserAgent()) e.preventDefault();
                    handleLaunchApp('bhim');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#00793b] hover:bg-[#006631] text-white font-bold text-sm shadow-md shadow-green-950/20 active:scale-[0.98] transition-all flex items-center justify-between group border border-green-400/30 cursor-pointer no-underline"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-white text-[#00793b] flex items-center justify-center shadow-xs flex-shrink-0 font-black text-xs">
                      BHIM
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white">BHIM UPI</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                          Govt NPCI
                        </span>
                      </div>
                      <p className="text-[11px] text-green-100 font-normal">
                        Official National Payments Corp. App
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-200 group-hover:translate-x-1 group-hover:text-white transition-all flex-shrink-0 ml-2" />
                </a>

                {/* 5. Master Universal "All Other UPI Apps" Option */}
                <a
                  id="pay-all-upi-apps-btn"
                  href={universalUpiUri}
                  onClick={(e) => {
                    if (!isMobileUserAgent()) e.preventDefault();
                    handleLaunchApp('all');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-between group border border-emerald-400/30 cursor-pointer no-underline"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white">All Other UPI Apps</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/25 text-white uppercase tracking-wider">
                          Device Chooser
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-100 font-normal">
                        Cred, Navi, WhatsApp Pay, Banking Apps & more
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
                </a>

                {/* Copyable UPI ID Box */}
                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between mt-3">
                  <div className="text-left overflow-hidden mr-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Payee UPI ID
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy UPI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Dynamic QR Code Scanner View */}
            {activeTab === 'qr' && (
              <div className="text-center py-2 animate-in fade-in duration-150">
                <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 mb-3">
                  <canvas ref={canvasRef} className="mx-auto block" />
                </div>

                <div className="max-w-xs mx-auto mb-4">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Scan with any UPI Scanner
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Point PhonePe, Google Pay, Paytm, or BHIM scanner at this code to pay{' '}
                    {amount ? <strong className="text-emerald-600">₹{amount}</strong> : 'any amount'}.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchApp('all')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in App</span>
                  </button>
                </div>
              </div>
            )}

            {/* Copy UPI ID Bar */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Merchant UPI ID
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {upiId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy UPI'}</span>
              </button>
            </div>

            {/* Security Guarantee Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Direct Bank-to-Bank Transfer via NPCI UPI. Zero commission.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
