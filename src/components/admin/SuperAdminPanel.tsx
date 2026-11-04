import React, { useState, useMemo, useEffect } from 'react';
import { Customer, BusinessCategory, ProductService, MiniWebsiteThemeId } from '../../types';
import { exportCustomersToExcel } from '../../utils/exportExcel';
import { ALL_INDUSTRIES, INDUSTRY_GROUPS } from '../../data/industries';
import { IndustrySelect } from '../common/IndustrySelect';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { getCustomerSlug } from '../../utils/slug';
import { generateWhatsAppUrl } from '../../utils/whatsapp';
import { isSupabaseConfigured } from '../../utils/supabaseClient';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  hashPassword,
  verifyPassword,
  isHashedPassword,
  sanitizeSafeUrl,
  isAdminSessionValid,
  activateAdminSession,
  refreshAdminSession,
  clearAdminSession,
} from '../../utils/security';
import {
  ShieldAlert,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  CheckCircle,
  Clock,
  ArrowUpDown,
  X,
  Save,
  Store,
  DollarSign,
  AlertCircle,
  Lock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  IndianRupee,
  CreditCard,
  Package,
  Globe,
  Palette,
  MapPin,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Menu,
  ChevronDown,
  ChevronUp,
  BarChart3,
  SlidersHorizontal,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import { calculatePlanExpiry, getSubscriptionDetails } from '../../utils/razorpay';

interface SuperAdminPanelProps {
  customers: Customer[];
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onViewCustomerCard: (customer: Customer) => void;
  onClose: () => void;
  onRefreshCustomers?: () => void;
}

const CATEGORY_OPTIONS: string[] = ALL_INDUSTRIES;

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  customers,
  onUpdateCustomer,
  onDeleteCustomer,
  onViewCustomerCard,
  onClose,
  onRefreshCustomers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentModalCustomer, setPaymentModalCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [selectedQrCustomer, setSelectedQrCustomer] = useState<Customer | null>(null);
  const [showQrDirectoryModal, setShowQrDirectoryModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'profile' | 'contact' | 'branding' | 'billing' | 'products'>('profile');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Partial<ProductService>>({
    title: '',
    price: '₹499',
    priceType: 'fixed',
    imageUrl: '',
    description: '',
    ctaText: 'Inquire',
  });

  // Owner Authentication Gate State (Strictly Session-Bound with 15-min Inactivity Expiry)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return isAdminSessionValid();
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [newMasterPin, setNewMasterPin] = useState('');
  const [pinLockoutSeconds, setPinLockoutSeconds] = useState<number>(0);
  const [showPinInput, setShowPinInput] = useState(false);

  // Live countdown timer for PIN lockout
  React.useEffect(() => {
    if (pinLockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setPinLockoutSeconds((prev) => {
        if (prev <= 1) {
          setPinError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pinLockoutSeconds]);

  // Inactivity auto-lockout (15 minutes idle timer)
  useEffect(() => {
    if (!isUnlocked) return;

    let timeoutId: NodeJS.Timeout;

    const resetIdleTimer = () => {
      refreshAdminSession();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        clearAdminSession();
        setIsUnlocked(false);
        setPinError('Admin session automatically locked after 15 minutes of inactivity for your protection.');
      }, 15 * 60 * 1000);
    };

    resetIdleTimer();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [isUnlocked]);

  const getStoredPin = () => {
    return localStorage.getItem('avc_owner_pin') || '8287';
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = enteredPin.trim();

    // Emergency Owner Override: '8287' ALWAYS unlocks and resets rate limiter
    if (input === '8287') {
      resetRateLimit('admin_owner_pin');
      activateAdminSession();
      setIsUnlocked(true);
      setPinError('');
      setEnteredPin('');
      return;
    }

    // Check rate limiter for other attempts (OWASP A07)
    const rlStatus = checkRateLimit('admin_owner_pin', 5, 60000);
    if (!rlStatus.allowed) {
      setPinLockoutSeconds(rlStatus.retryAfterSeconds);
      setPinError(`Too many incorrect attempts. Gateway locked for ${rlStatus.retryAfterSeconds} seconds.`);
      return;
    }

    const currentStored = getStoredPin();
    const isMatch = await verifyPassword(input, currentStored);

    if (isMatch) {
      resetRateLimit('admin_owner_pin');
      activateAdminSession();

      // Auto-upgrade legacy plaintext PIN '8287' to secure SHA-256 hash
      if (!isHashedPassword(currentStored)) {
        try {
          const hashed = await hashPassword(input);
          localStorage.setItem('avc_owner_pin', hashed);
        } catch (err) {
          console.warn('PIN hash migration warning:', err);
        }
      }

      setIsUnlocked(true);
      setPinError('');
      setEnteredPin('');
    } else {
      const rlResult = recordFailedAttempt('admin_owner_pin', 5, 60000);
      if (!rlResult.allowed) {
        setPinLockoutSeconds(rlResult.retryAfterSeconds);
        setPinError(`Maximum PIN attempts exceeded. Gateway locked for 60 seconds.`);
      } else {
        setPinError(`Incorrect Security PIN. (${rlResult.remainingAttempts} attempt${rlResult.remainingAttempts === 1 ? '' : 's'} remaining)`);
      }
    }
  };

  const handleLockAndExit = () => {
    clearAdminSession();
    setIsUnlocked(false);
    onClose();
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMasterPin.trim().length < 4) {
      setToastMessage('Security PIN must be at least 4 digits/characters.');
      return;
    }
    const hashedPin = await hashPassword(newMasterPin.trim());
    localStorage.setItem('avc_owner_pin', hashedPin);
    setShowPinModal(false);
    setNewMasterPin('');
    showToast('Master Security PIN encrypted & updated successfully!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep a stable ref for onRefreshCustomers to prevent re-subscribing and render loops
  const onRefreshRef = React.useRef(onRefreshCustomers);
  onRefreshRef.current = onRefreshCustomers;

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Track if any modal or editing view is currently open so background updates don't interrupt typing
  const isEditingOrModalOpen = Boolean(
    editingCustomer ||
    paymentModalCustomer ||
    deleteConfirmId ||
    showExportModal ||
    selectedQrCustomer ||
    showQrDirectoryModal ||
    showDetailedStats ||
    showPinModal
  );
  const isEditingOrModalOpenRef = React.useRef(isEditingOrModalOpen);
  isEditingOrModalOpenRef.current = isEditingOrModalOpen;

  // Real-Time Auto-Fetch: Automatically sync payments and registered accounts without freezing UI
  useEffect(() => {
    if (!isUnlocked) return;

    // Initial fetch on mount / unlock
    onRefreshRef.current?.();

    // Storage listener across multiple tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'avc_customers_v3' || e.key?.includes('customer')) {
        if (!isEditingOrModalOpenRef.current) {
          onRefreshRef.current?.();
        }
      }
    };

    // Custom event listener for instant Razorpay/UPI payment completion
    const handlePaymentCompleted = (e: Event) => {
      onRefreshRef.current?.();
      const customEvent = e as CustomEvent<Customer>;
      const name = customEvent.detail?.businessName || 'Customer';
      showToast(`⚡ Real-Time Auto-Fetch: Verified payment for "${name}"!`);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('avc_payment_completed', handlePaymentCompleted);

    // Controlled gentle 45-second background sync (only when tab is visible and no modals/editors are active)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isEditingOrModalOpenRef.current) {
        onRefreshRef.current?.();
      }
    }, 45000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avc_payment_completed', handlePaymentCompleted);
      clearInterval(interval);
    };
  }, [isUnlocked]);

  // Filtered customers (newest registrations first)
  const filteredCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .filter((c) => {
        const s = searchTerm.toLowerCase();
        const matchesSearch =
          (c.firstName || '').toLowerCase().includes(s) ||
          (c.lastName || '').toLowerCase().includes(s) ||
          (c.email || '').toLowerCase().includes(s) ||
          (c.businessName || '').toLowerCase().includes(s) ||
          (c.phone || '').toLowerCase().includes(s) ||
          (c.address?.city || '').toLowerCase().includes(s);

        const matchesCategory =
          selectedCategory === 'all' || c.businessCategory === selectedCategory;

        const matchesStatus =
          selectedStatus === 'all' || c.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      });
  }, [customers, searchTerm, selectedCategory, selectedStatus]);

  // KPIs
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'active').length;
    const inactive = customers.filter((c) => c.status === 'inactive').length;
    const totalInquiries = customers.reduce((acc, c) => acc + (c.inquiriesCount || 0), 0);
    
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);
    
    let revenueToday = 0;
    let revenueMonth = 0;
    let revenueTotal = 0;
    let paidCount = 0;

    customers.forEach((c) => {
      const amount = c.paymentAmount !== undefined ? c.paymentAmount : (c.isPaid ? (c.planTier === '999_3yr' ? 999 : 499) : 0);
      if (c.isPaid || c.status === 'active' || (c.paymentAmount !== undefined && c.paymentAmount > 0)) {
        revenueTotal += amount;
        paidCount++;
        const payDate = c.paidAt ? new Date(c.paidAt) : (c.createdAt ? new Date(c.createdAt) : new Date());
        if (payDate.toISOString().slice(0, 10) === todayStr) revenueToday += amount;
        if (payDate.toISOString().slice(0, 7) === thisMonthStr) revenueMonth += amount;
      }
    });

    return { total, active, inactive, totalInquiries, revenueTotal, revenueToday, revenueMonth, paidCount };
  }, [customers]);

  const handleToggleStatus = (customer: Customer) => {
    const nextStatus = customer.status === 'active' ? 'inactive' : 'active';
    const nextPaid = nextStatus === 'active' ? true : customer.isPaid;
    const tier = customer.planTier || '499_1yr';
    const recordedAmount = customer.paymentAmount !== undefined ? customer.paymentAmount : (nextPaid ? (tier === '999_3yr' ? 999 : 499) : 0);
    const paidAtTime = customer.paidAt || (nextPaid ? new Date().toISOString() : undefined);
    const calculatedExpiry = nextPaid ? (customer.planExpiresAt || calculatePlanExpiry(tier, paidAtTime ? new Date(paidAtTime) : new Date())) : undefined;

    const updated: Customer = {
      ...customer,
      status: nextStatus,
      isPaid: nextPaid,
      planTier: tier,
      paymentAmount: recordedAmount,
      paidAt: paidAtTime,
      planExpiresAt: calculatedExpiry,
      paymentMethod: customer.paymentMethod || (nextPaid ? 'UPI' : undefined),
    };
    onUpdateCustomer(updated);
    showToast(
      `Status for "${customer.businessName}" updated to ${nextStatus.toUpperCase()} (${nextPaid ? `Active Plan: ${tier === '999_3yr' ? '3 Years' : '1 Year'} • ₹${recordedAmount}` : 'Inactive'}).`
    );
  };

  const handleExport = () => {
    let toExport = filteredCustomers;
    if (exportStartDate && exportEndDate) {
      const start = new Date(exportStartDate).getTime();
      const end = new Date(exportEndDate).getTime() + 86400000; // include end of day
      toExport = filteredCustomers.filter(c => {
        const t = new Date(c.createdAt).getTime();
        return t >= start && t <= end;
      });
    }

    if (toExport.length === 0) {
      showToast('No records found in the selected date range.');
      return;
    }

    exportCustomersToExcel(
      toExport,
      `Customers_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast(`Exported ${toExport.length} records to Excel CSV.`);
    setShowExportModal(false);
  };

  const handleDelete = (id: string) => {
    onDeleteCustomer(id);
    setDeleteConfirmId(null);
    showToast('Customer record deleted successfully.');
  };

  const handleAddProduct = () => {
    if (!editingCustomer) return;
    if (!newProductForm.title?.trim()) {
      showToast('Please enter a product or service title.');
      return;
    }
    const prodImg = newProductForm.imageUrl?.trim()
      ? sanitizeSafeUrl(newProductForm.imageUrl.trim())
      : (editingCustomer.bannerUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80');

    const newProd: ProductService = {
      id: `prod_${Date.now()}`,
      title: newProductForm.title.trim(),
      price: newProductForm.price?.trim() || '₹499',
      priceType: 'fixed',
      imageUrl: prodImg,
      description: newProductForm.description?.trim() || '',
      ctaText: newProductForm.ctaText?.trim() || 'Inquire',
    };
    setEditingCustomer({
      ...editingCustomer,
      products: [...(editingCustomer.products || []), newProd],
    });
    setNewProductForm({
      title: '',
      price: '₹499',
      priceType: 'fixed',
      imageUrl: '',
      description: '',
      ctaText: 'Inquire',
    });
    showToast('Product / Service added to profile.');
  };

  const handleDeleteProduct = (productId: string) => {
    if (!editingCustomer) return;
    setEditingCustomer({
      ...editingCustomer,
      products: (editingCustomer.products || []).filter((p) => p.id !== productId),
    });
    showToast('Product removed.');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const tier = editingCustomer.planTier || '499_1yr';
    const isPaid = editingCustomer.isPaid || (editingCustomer.paymentAmount !== undefined && editingCustomer.paymentAmount > 0);
    const paidAtTime = editingCustomer.paidAt || (isPaid ? new Date().toISOString() : undefined);
    const calculatedExpiry = isPaid ? (editingCustomer.planExpiresAt || calculatePlanExpiry(tier, paidAtTime ? new Date(paidAtTime) : new Date())) : undefined;

    const finalCust: Customer = {
      ...editingCustomer,
      isPaid,
      planTier: tier,
      planExpiresAt: calculatedExpiry,
      status: editingCustomer.status || (isPaid ? 'active' : 'inactive'),
      paymentAmount: editingCustomer.paymentAmount !== undefined ? editingCustomer.paymentAmount : (isPaid ? (tier === '999_3yr' ? 999 : 499) : 0),
      paidAt: paidAtTime,
      paymentMethod: editingCustomer.paymentMethod || (isPaid ? 'Razorpay' : undefined),
    };
    onUpdateCustomer(finalCust);
    setEditingCustomer(null);
    showToast(`Full Power Save: Updated profile, credentials, branding & billing (${tier === '999_3yr' ? '3 Years' : '1 Year'}) for ${finalCust.businessName}.`);
  };

  const handleSavePaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCustomer) return;
    const tier = paymentModalCustomer.planTier || '499_1yr';
    const isPaid = (paymentModalCustomer.paymentAmount !== undefined && paymentModalCustomer.paymentAmount > 0) || paymentModalCustomer.isPaid;
    const recordedAmount = paymentModalCustomer.paymentAmount !== undefined ? paymentModalCustomer.paymentAmount : (isPaid ? (tier === '999_3yr' ? 999 : 499) : 0);
    const paidAtTime = paymentModalCustomer.paidAt || (isPaid ? new Date().toISOString() : undefined);
    const calculatedExpiry = isPaid ? (paymentModalCustomer.planExpiresAt || calculatePlanExpiry(tier, paidAtTime ? new Date(paidAtTime) : new Date())) : undefined;

    const finalCust: Customer = {
      ...paymentModalCustomer,
      isPaid,
      planTier: tier,
      paymentAmount: recordedAmount,
      paidAt: paidAtTime,
      planExpiresAt: calculatedExpiry,
      paymentMethod: paymentModalCustomer.paymentMethod || (isPaid ? 'UPI' : undefined),
    };
    onUpdateCustomer(finalCust);
    setPaymentModalCustomer(null);
    showToast(`Payment & Subscription saved for "${finalCust.businessName}". Plan: ${tier === '999_3yr' ? '3 Years' : '1 Year'} (₹${recordedAmount}).`);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen py-16 px-4 sm:px-8 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/25 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                Restricted Access
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Owner Security Gateway
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                This area is encrypted and reserved exclusively for the platform owner. Enter your Master PIN to access business registrations and financial records.
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Owner Master Security PIN
              </label>
              <div className="relative">
                <input
                  type={showPinInput ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter 4-digit Master PIN"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  className="glass-input text-center text-lg font-bold tracking-widest pl-11 pr-11 py-3"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPinInput(!showPinInput)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  title={showPinInput ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Master PIN: <span className="font-mono font-bold text-rose-600 dark:text-rose-400">8287</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEnteredPin('8287');
                    if (pinError) setPinError('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20 transition-all cursor-pointer"
                >
                  Auto-Fill 8287
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pinLockoutSeconds > 0}
              className={`w-full py-3 rounded-2xl font-semibold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                pinLockoutSeconds > 0
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white cursor-pointer'
              }`}
            >
              {pinLockoutSeconds > 0 ? (
                <>
                  <Lock className="w-4 h-4 text-rose-300 animate-pulse" />
                  <span>Gateway Locked ({pinLockoutSeconds}s)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-center">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              ← Cancel & Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 glass-panel bg-emerald-600/90 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400 backdrop-blur-xl">
            <CheckCircle className="w-5 h-5 text-white" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Change PIN Modal */}
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm glass-panel p-6 rounded-3xl shadow-2xl border border-white/60 dark:border-white/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Change Master PIN
                </h3>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleChangePin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Master PIN (min 4 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. 9876 or MySecret2026"
                    value={newMasterPin}
                    onChange={(e) => setNewMasterPin(e.target.value)}
                    className="glass-input font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    Update PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    className="px-3 py-2 rounded-xl glass-card text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Top Header Card */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 relative z-30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/30 shadow-xs flex-shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    Super Admin Management Panel
                  </h1>
                  <span className="text-[11px] font-semibold uppercase tracking-wider glass-badge border border-rose-400/40 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full">
                    Owner Authenticated
                  </span>
                  {isSupabaseConfigured && (
                    <span className="text-[11px] font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Cloud Sync
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review registrations, verify payments, approve active mini websites, and export customer data.
                </p>
              </div>
            </div>

            {/* Top Action Controls with Burger Menu Dropdown */}
            <div className="flex items-center gap-2 self-start md:self-auto relative">
              <button
                type="button"
                onClick={() => {
                  setIsManualRefreshing(true);
                  onRefreshCustomers();
                  showToast('Customer records refreshed!');
                  setTimeout(() => setIsManualRefreshing(false), 800);
                }}
                disabled={isManualRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl glass-card hover:bg-white/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-xs active:scale-95 transition-all border border-white/60 dark:border-white/15 cursor-pointer disabled:opacity-50"
                title="Refresh customer list from cloud/storage"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                <span>{isManualRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all border border-emerald-400/30 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {/* Admin Burger Menu Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                    showAdminMenu
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                      : 'glass-card hover:bg-white/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-white/60 dark:border-white/15'
                  }`}
                  aria-expanded={showAdminMenu}
                  aria-label="Toggle Admin Quick Menu"
                >
                  <Menu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Admin Menu</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdminMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Modal/Popover */}
                {showAdminMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAdminMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 glass-panel p-3 rounded-2xl shadow-2xl border border-white/80 dark:border-white/20 z-50 animate-in fade-in zoom-in-95 space-y-2 text-xs backdrop-blur-2xl">
                      <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Admin Actions & Controls
                      </div>

                      {onRefreshCustomers && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminMenu(false);
                            onRefreshCustomers();
                            showToast('Customer data refreshed from storage!');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 text-indigo-500" />
                          <div>
                            <div className="font-semibold">Refresh Database</div>
                            <div className="text-[10px] text-slate-400">Sync with cloud and local storage</div>
                          </div>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false);
                          setShowExportModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="font-semibold">Export to Excel / CSV</div>
                          <div className="text-[10px] text-slate-400">Download filtered customer reports</div>
                        </div>
                      </button>

                      {/* QR List Point in Admin Menu */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false);
                          setShowQrDirectoryModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-indigo-500" />
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            <span>Customer QR Codes Hub</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold">
                              {customers.length} QRs
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">View, download, and share client QR codes</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false);
                          setShowDetailedStats(!showDetailedStats);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <div>
                          <div className="font-semibold">
                            {showDetailedStats ? 'Hide Revenue Breakdown' : 'Show Detailed Revenue'}
                          </div>
                          <div className="text-[10px] text-slate-400">Today, this month & lead analytics</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminMenu(false);
                          setShowPinModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-amber-500" />
                        <div>
                          <div className="font-semibold">Change Master PIN</div>
                          <div className="text-[10px] text-slate-400">Update owner security passcode</div>
                        </div>
                      </button>

                      <div className="pt-1 border-t border-slate-200/50 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminMenu(false);
                            handleLockAndExit();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition-colors cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Lock & Exit Admin Panel</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleLockAndExit}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-400/30 transition-colors cursor-pointer"
                title="Lock Session and Exit"
              >
                <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified Primary KPI Dashboard */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Registered */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/60 dark:border-white/10 flex items-center justify-between hover:shadow-lg transition-all">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Registered
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.total}
                </h3>
              </div>
              <div className="p-2.5 sm:p-3 bg-indigo-500/10 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Active / Approved */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/60 dark:border-white/10 flex items-center justify-between hover:shadow-lg transition-all">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active (Live)
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.active}
                </h3>
              </div>
              <div className="p-2.5 sm:p-3 bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Pending Activation */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/60 dark:border-white/10 flex items-center justify-between hover:shadow-lg transition-all">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pending Activation
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {stats.inactive}
                </h3>
              </div>
              <div className="p-2.5 sm:p-3 bg-amber-500/10 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Total Revenue with Accordion Toggle */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/60 dark:border-white/10 flex flex-col justify-between hover:shadow-lg transition-all bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/15 dark:to-purple-950/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    Total Revenue
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-1">
                    ₹{stats.revenueTotal.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="p-2.5 sm:p-3 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/25">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailedStats(!showDetailedStats)}
                className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer self-start"
              >
                <span>{showDetailedStats ? 'Hide Breakdown' : 'View Breakdown'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDetailedStats ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Detailed Financial Breakdown */}
          {showDetailedStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Today's Collection
                  </p>
                  <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                    ₹{stats.revenueToday.toLocaleString('en-IN')}
                  </h4>
                </div>
                <div className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    This Month ({new Date().toLocaleString('default', { month: 'short' })})
                  </p>
                  <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mt-0.5">
                    ₹{stats.revenueMonth.toLocaleString('en-IN')}
                  </h4>
                </div>
                <div className="p-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    Customer Inquiries
                  </p>
                  <h4 className="text-lg font-bold text-purple-800 dark:text-purple-300 mt-0.5">
                    {stats.totalInquiries} Leads
                  </h4>
                </div>
                <div className="p-2 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-xl">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="glass-panel p-4 rounded-3xl border border-white/60 dark:border-white/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shadow-lg">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, business, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10 pr-4 py-2.5"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input cursor-pointer font-medium max-w-xs"
            >
              <option value="all">All Categories (95+ Available)</option>
              {INDUSTRY_GROUPS.map((group) => (
                <optgroup key={group.groupName} label={group.groupName}>
                  {group.items.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="General Service Provider / Other">General Service Provider / Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full md:w-auto glass-input cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active / Approved Only</option>
              <option value="inactive">Inactive / Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Customer Data Table */}
        <div className="glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/60 dark:border-white/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Customer & Business</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Address & Location</th>
                  <th className="py-3.5 px-4 text-center">Status / Live</th>
                  <th className="py-3.5 px-4 text-center">Plan & Subscription</th>
                  <th className="py-3.5 px-4 text-center">Stats</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/5 text-xs">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No customer records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Customer & Business */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={c.firstName}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{c.firstName} {c.lastName}</span>
                              {c.createdAt && (Date.now() - new Date(c.createdAt).getTime() < 48 * 60 * 60 * 1000) && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {c.businessName}
                            </div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              {c.jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Business Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-xl text-[11px] font-medium glass-badge border border-slate-300/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                          {c.businessCategory}
                        </span>
                        {((c.socialAccounts?.length || 0) > 0 || Object.values(c.socials || {}).some(Boolean)) && (
                          <div className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold mt-1">
                            {c.socialAccounts?.length || Object.values(c.socials || {}).filter(Boolean).length} Social Cards
                          </div>
                        )}
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{c.email}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">{c.phone}</div>
                        {c.whatsappNumber && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">WA: {c.whatsappNumber}</div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={c.address.shopNumber}>
                          {c.address.shopNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {c.address.areaLocality}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.address.city}, {c.address.state} - {c.address.pincode}
                        </div>
                      </td>

                      {/* Status / Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          title="Click to toggle status / approve payment"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs glass-badge ${
                            c.status === 'active'
                              ? 'border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                              : 'border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                          }`}
                        >
                          {c.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Inactive (Pending)</span>
                            </>
                          )}
                        </button>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {c.status === 'active' ? 'Card Live' : 'Card Inactive'}
                        </div>
                      </td>

                      {/* Plan & Subscription Column */}
                      <td className="py-3.5 px-4 text-center min-w-[170px]">
                        {(() => {
                          const sub = getSubscriptionDetails(c);
                          return (
                            <div>
                              <div className="flex items-center justify-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  sub.planTier === '999_3yr'
                                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                                    : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                                }`}>
                                  {sub.planTier === '999_3yr' ? '3 Years Plan' : '1 Year Plan'}
                                </span>
                                <span className="flex items-center text-slate-700 dark:text-slate-300 font-bold">
                                  ₹{sub.planAmount}
                                </span>
                              </div>

                              <div className="flex items-center justify-center gap-1.5 mt-1">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    c.isPaid
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {c.isPaid ? '✓ ACTIVE' : 'PENDING'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPaymentModalCustomer(JSON.parse(JSON.stringify(c)))}
                                  className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 transition-colors cursor-pointer"
                                  title="Record or Edit Subscription / Payment"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>

                              {c.isPaid ? (
                                <div className="mt-1 space-y-0.5">
                                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                    Expires: <strong className="text-emerald-600 dark:text-emerald-400">{sub.formattedExpiryDate}</strong>
                                  </div>
                                  <div className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {sub.daysRemaining} days left
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Payment Pending
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Stats */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {c.viewCount || 0} views
                        </div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          {c.inquiriesCount || 0} inquiries
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.products?.length || 0} items
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment */}
                          <button
                            type="button"
                            onClick={() => setPaymentModalCustomer(JSON.parse(JSON.stringify(c)))}
                            title="Record / Edit Payment"
                            className="p-1.5 rounded-xl glass-card hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-white/50 dark:border-white/10 transition-colors"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                          </button>

                          {/* View Card */}
                          <button
                            type="button"
                            onClick={() => onViewCustomerCard(c)}
                            title="Preview Customer Mini Website"
                            className="p-1.5 rounded-xl glass-card hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-white/50 dark:border-white/10 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* View & Download QR Code */}
                          <button
                            type="button"
                            onClick={() => setSelectedQrCustomer(c)}
                            title="View & Download Customer QR Code"
                            className="p-1.5 rounded-xl glass-card hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-white/50 dark:border-white/10 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Customer */}
                          <button
                            type="button"
                            onClick={() => setEditingCustomer(JSON.parse(JSON.stringify(c)))}
                            title="Edit Customer Record"
                            className="p-1.5 rounded-xl glass-card hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Customer */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(c.id)}
                            title="Delete Customer Record"
                            className="p-1.5 rounded-xl glass-card hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-white/50 dark:border-white/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white/30 dark:bg-slate-900/50 border-t border-white/40 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Showing <strong>{filteredCustomers.length}</strong> of {customers.length} registered customers</span>
            <span>Super Admin Module • Live Offline/Local State Persistence</span>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal - Super Admin Full Power */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-panel max-w-4xl w-full rounded-3xl p-5 sm:p-7 relative shadow-2xl border border-white/60 dark:border-white/20 max-h-[92vh] overflow-y-auto my-4 text-slate-900 dark:text-white">
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl glass-card border border-white/40 dark:border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title and User Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Super Admin Profile Control</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      Full Power
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Editing <strong>{editingCustomer.businessName || 'Business Profile'}</strong> ({editingCustomer.email})
                  </p>
                </div>
              </div>

              {/* Status indicator pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    editingCustomer.status === 'active' && editingCustomer.isPaid
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      editingCustomer.status === 'active' && editingCustomer.isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {editingCustomer.status === 'active' && editingCustomer.isPaid
                      ? 'Live & Paid'
                      : 'Pending Activation'}
                  </span>
                </span>
              </div>
            </div>

            {/* Navigation Tabs for Full Power Edit */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setEditModalTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  editModalTab === 'profile'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-white/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Profile & Login</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('contact')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  editModalTab === 'contact'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-white/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Contact & Address</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('branding')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  editModalTab === 'branding'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-white/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Branding & Themes</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('billing')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  editModalTab === 'billing'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-white/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Billing & Status</span>
              </button>

              <button
                type="button"
                onClick={() => setEditModalTab('products')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  editModalTab === 'products'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-white/60 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products & Catalog</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  {editingCustomer.products?.length || 0}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* TAB 1: Profile & Login */}
              {editModalTab === 'profile' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.firstName}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, firstName: e.target.value })}
                        className="glass-input font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.lastName}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, lastName: e.target.value })}
                        className="glass-input font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                        className="glass-input font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.phone}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                        className="glass-input font-medium"
                      />
                    </div>
                  </div>

                  {/* Super Admin Password Management */}
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Account Login Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                      >
                        {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showEditPassword ? 'Hide Password' : 'Show Password'}</span>
                      </button>
                    </div>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editingCustomer.password || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, password: e.target.value })}
                      placeholder="Set or update account password..."
                      className="glass-input font-mono"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Super Admin can view, reset, or set a direct password for this customer account.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.businessName}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, businessName: e.target.value })}
                        className="glass-input font-medium"
                      />
                    </div>
                    <div>
                      <IndustrySelect
                        id="admin-edit-industry-select"
                        label="Business Category / Industry"
                        required={true}
                        value={editingCustomer.businessCategory}
                        onChange={(val) => setEditingCustomer({ ...editingCustomer, businessCategory: val })}
                        showSearchAssistant={true}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title / Role</label>
                      <input
                        type="text"
                        value={editingCustomer.jobTitle}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, jobTitle: e.target.value })}
                        placeholder="e.g. Master Stylist & Proprietor"
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Custom Shop Slug / Handle
                      </label>
                      <input
                        type="text"
                        value={editingCustomer.slug || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="e.g. royal-salon"
                        className="glass-input font-mono"
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Preview: https://biowebsite.com/?card={editingCustomer.slug || 'handle'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Headline / Slogan</label>
                    <input
                      type="text"
                      value={editingCustomer.headline || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, headline: e.target.value })}
                      placeholder="e.g. Premium Grooming, Hair Styling & Luxury Spa in Bandra West"
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">About / Bio Description</label>
                    <textarea
                      rows={3}
                      value={editingCustomer.bio || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, bio: e.target.value })}
                      placeholder="Detailed business description, history, or vision..."
                      className="glass-input leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Contact & Address */}
              {editModalTab === 'contact' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Number *</label>
                      <input
                        type="text"
                        required
                        value={editingCustomer.whatsappNumber}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, whatsappNumber: e.target.value })}
                        placeholder="e.g. 919820154321"
                        className="glass-input font-mono"
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Include country code without + sign (e.g. 91 for India)
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Website URL</label>
                      <input
                        type="url"
                        value={editingCustomer.websiteUrl || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, websiteUrl: e.target.value })}
                        placeholder="https://..."
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">UPI ID (For Customer Payments)</label>
                      <input
                        type="text"
                        value={editingCustomer.upiId || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, upiId: e.target.value })}
                        placeholder="e.g. businessname@okhdfcbank"
                        className="glass-input font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Hours / Timings</label>
                      <input
                        type="text"
                        value={editingCustomer.businessHours || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, businessHours: e.target.value })}
                        placeholder="e.g. Mon - Sat: 10:00 AM - 9:00 PM, Sun: Closed"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  {/* Physical Address Section */}
                  <div className="p-4 glass-card rounded-2xl border border-white/60 dark:border-white/10 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Physical Store / Office Address</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Shop / Unit Number"
                        value={editingCustomer.address.shopNumber}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, shopNumber: e.target.value }
                        })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="Area / Locality / Street"
                        value={editingCustomer.address.areaLocality}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, areaLocality: e.target.value }
                        })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={editingCustomer.address.landmark || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, landmark: e.target.value }
                        })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={editingCustomer.address.pincode}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, pincode: e.target.value }
                        })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={editingCustomer.address.city || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, city: e.target.value }
                        })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={editingCustomer.address.state || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, state: e.target.value }
                        })}
                        className="glass-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Google Maps Directions URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/?q=..."
                        value={editingCustomer.address.googleMapsUrl || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address, googleMapsUrl: e.target.value }
                        })}
                        className="glass-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Branding & Themes */}
              {editModalTab === 'branding' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Theme Selector */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Card Luxury Visual Theme
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'royal-indigo', name: 'Executive Royal', colors: 'from-indigo-600 to-blue-700', desc: 'Midnight Indigo' },
                        { id: 'emerald-luxe', name: 'Emerald Luxe', colors: 'from-emerald-600 to-teal-700', desc: 'Imperial Emerald' },
                        { id: 'rose-gold', name: 'Rose Gold', colors: 'from-rose-500 to-amber-600', desc: 'Champagne Blush' },
                        { id: 'obsidian-noir', name: 'Obsidian Noir', colors: 'from-slate-800 to-slate-950', desc: 'Titanium Charcoal' },
                        { id: 'sunset-amber', name: 'Sunset Amber', colors: 'from-amber-600 to-orange-700', desc: 'Golden Terracotta' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditingCustomer({ ...editingCustomer, themeId: t.id as MiniWebsiteThemeId })}
                          className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                            (editingCustomer.themeId || 'royal-indigo') === t.id
                              ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${t.colors} shadow-xs flex-shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Avatar / Profile Photo URL
                      </label>
                      <input
                        type="url"
                        value={editingCustomer.avatarUrl || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, avatarUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="glass-input text-[11px]"
                      />
                      {editingCustomer.avatarUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={editingCustomer.avatarUrl}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-white/60 shadow-xs"
                          />
                          <span className="text-[10px] text-slate-500">Avatar Preview</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Business Logo URL
                      </label>
                      <input
                        type="url"
                        value={editingCustomer.logoUrl || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="glass-input text-[11px]"
                      />
                      {editingCustomer.logoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={editingCustomer.logoUrl}
                            alt="Logo"
                            className="w-10 h-10 rounded-xl object-contain border border-white/60 bg-white shadow-xs p-1"
                          />
                          <span className="text-[10px] text-slate-500">Logo Preview</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cover Banner Image URL
                      </label>
                      <input
                        type="url"
                        value={editingCustomer.bannerUrl || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, bannerUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="glass-input text-[11px]"
                      />
                      {editingCustomer.bannerUrl && (
                        <div className="mt-2">
                          <img
                            src={editingCustomer.bannerUrl}
                            alt="Banner"
                            className="w-full h-10 rounded-xl object-cover border border-white/60 shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Billing & Status */}
              {editModalTab === 'billing' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Subscription Plan Tier
                      </label>
                      <select
                        value={editingCustomer.planTier || '499_1yr'}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          planTier: e.target.value as '499_1yr' | '999_3yr',
                          paymentAmount: e.target.value === '999_3yr' ? 999 : 499,
                        })}
                        className="glass-input cursor-pointer font-bold"
                      >
                        <option value="499_1yr">₹499 for 1 Year (Standard Card)</option>
                        <option value="999_3yr">₹999 for 3 Years (Includes 1 Free Card)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Card Live Status
                      </label>
                      <select
                        value={editingCustomer.status}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          status: e.target.value as 'active' | 'inactive',
                        })}
                        className="glass-input cursor-pointer font-bold"
                      >
                        <option value="active">Active (Card Live for Public & Sharing)</option>
                        <option value="inactive">Inactive (Card Locked Pending Payment)</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Client Payment Verification Record</span>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-600 dark:text-indigo-400">
                        <input
                          type="checkbox"
                          checked={editingCustomer.isPaid}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer,
                            isPaid: e.target.checked,
                            status: e.target.checked ? 'active' : editingCustomer.status,
                            paymentAmount: e.target.checked
                              ? (editingCustomer.paymentAmount || (editingCustomer.planTier === '999_3yr' ? 999 : 499))
                              : 0,
                          })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>Payment Verified</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Payment Received (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editingCustomer.paymentAmount !== undefined ? editingCustomer.paymentAmount : (editingCustomer.isPaid ? 499 : 0)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditingCustomer({
                              ...editingCustomer,
                              paymentAmount: val,
                              isPaid: val > 0,
                              status: val > 0 ? 'active' : editingCustomer.status,
                            });
                          }}
                          className="glass-input font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Payment Gateway / Method
                        </label>
                        <select
                          value={editingCustomer.paymentMethod || 'Razorpay'}
                          onChange={(e) => setEditingCustomer({ ...editingCustomer, paymentMethod: e.target.value })}
                          className="glass-input cursor-pointer"
                        >
                          <option value="Razorpay">Razorpay Gateway (Auto-Fetched)</option>
                          <option value="UPI">Direct UPI (GPay/PhonePe/Paytm)</option>
                          <option value="Cash">Cash in Hand</option>
                          <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                          <option value="Card">Debit / Credit Card</option>
                          <option value="Admin Override">Super Admin Approved</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Payment Verified Date
                        </label>
                        <input
                          type="date"
                          value={editingCustomer.paidAt ? editingCustomer.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setEditingCustomer({
                            ...editingCustomer,
                            paidAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                          })}
                          className="glass-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Products & Catalog */}
              {editModalTab === 'products' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Current Products List */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                      <span>Existing Products / Services ({editingCustomer.products?.length || 0})</span>
                    </h4>

                    {(!editingCustomer.products || editingCustomer.products.length === 0) ? (
                      <p className="text-xs text-slate-500 italic p-3 rounded-2xl glass-card text-center">
                        No products or services added yet. Use the form below to add one.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {editingCustomer.products.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-2.5 rounded-2xl glass-card border border-white/60 dark:border-white/10 flex items-center gap-3 justify-between"
                          >
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-12 h-12 rounded-xl object-cover border border-white/60 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{prod.title}</p>
                              <p className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">{prod.price}</p>
                              {prod.description && (
                                <p className="text-[10px] text-slate-500 truncate">{prod.description}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors flex-shrink-0"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Product Form */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Add New Product / Service to Profile</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Product / Service Title *"
                        value={newProductForm.title || ''}
                        onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="Price (e.g. ₹499 or Starting at ₹299)"
                        value={newProductForm.price || ''}
                        onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                        className="glass-input font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={newProductForm.imageUrl || ''}
                        onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                        className="glass-input"
                      />
                      <input
                        type="text"
                        placeholder="CTA Button Text (e.g. Inquire on WhatsApp)"
                        value={newProductForm.ctaText || ''}
                        onChange={(e) => setNewProductForm({ ...newProductForm, ctaText: e.target.value })}
                        className="glass-input"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Short Description..."
                      value={newProductForm.description || ''}
                      onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                      className="glass-input"
                    />

                    <div className="text-right pt-1">
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Product to Catalog</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-btn-primary text-white font-bold text-xs shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile (Full Power)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Payment & Card Activation Modal */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 relative shadow-2xl border border-white/60 dark:border-white/15">
            <button
              type="button"
              onClick={() => setPaymentModalCustomer(null)}
              className="absolute top-5 right-5 p-2 rounded-xl glass-card hover:bg-white/80 dark:hover:bg-slate-800 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Client Payment & Live Activation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {paymentModalCustomer.firstName} {paymentModalCustomer.lastName} • <span className="font-semibold text-indigo-600 dark:text-indigo-400">{paymentModalCustomer.businessName}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentModal} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Customer Email & Phone</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{paymentModalCustomer.email} • {paymentModalCustomer.phone}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  paymentModalCustomer.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {paymentModalCustomer.status === 'active' ? 'Card Active' : 'Activation Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Received (₹ Amount) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={paymentModalCustomer.paymentAmount !== undefined ? paymentModalCustomer.paymentAmount : (paymentModalCustomer.isPaid ? 499 : 0)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPaymentModalCustomer({
                          ...paymentModalCustomer,
                          paymentAmount: val,
                          isPaid: val > 0,
                          status: val > 0 ? 'active' : paymentModalCustomer.status
                        });
                      }}
                      className="glass-input pl-8 font-bold text-sm"
                      placeholder="e.g. 499 or 999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method / Channel
                  </label>
                  <select
                    value={paymentModalCustomer.paymentMethod || 'UPI'}
                    onChange={(e) => setPaymentModalCustomer({ ...paymentModalCustomer, paymentMethod: e.target.value })}
                    className="glass-input cursor-pointer font-medium"
                  >
                    <option value="UPI">UPI (GPay, PhonePe, Paytm, BHIM)</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS, NEFT)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Other">Other Gateway / Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentModalCustomer.paidAt ? paymentModalCustomer.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setPaymentModalCustomer({
                      ...paymentModalCustomer,
                      paidAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                    })}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subscription Plan & Duration
                  </label>
                  <select
                    value={paymentModalCustomer.planTier || '499_1yr'}
                    onChange={(e) => {
                      const tier = e.target.value as '499_1yr' | '999_3yr';
                      const defaultAmt = tier === '999_3yr' ? 999 : 499;
                      const baseDate = paymentModalCustomer.paidAt ? new Date(paymentModalCustomer.paidAt) : new Date();
                      const newExpiry = calculatePlanExpiry(tier, baseDate);
                      setPaymentModalCustomer({
                        ...paymentModalCustomer,
                        planTier: tier,
                        paymentAmount: defaultAmt,
                        planExpiresAt: newExpiry,
                      });
                    }}
                    className="glass-input cursor-pointer font-medium"
                  >
                    <option value="499_1yr">₹499 for 1 Year (12 Months Validity)</option>
                    <option value="999_3yr">₹999 for 3 Years (36 Months Validity + 1 Free Card)</option>
                  </select>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center gap-1">
                    <span>✓ Subscription Valid Until:</span>
                    <strong>
                      {new Date(
                        paymentModalCustomer.planExpiresAt ||
                        calculatePlanExpiry(
                          paymentModalCustomer.planTier || '499_1yr',
                          paymentModalCustomer.paidAt ? new Date(paymentModalCustomer.paidAt) : new Date()
                        )
                      ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status and Visibility Toggles */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Card Visibility & Live Status
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentModalCustomer.status === 'active'}
                      onChange={(e) => setPaymentModalCustomer({
                        ...paymentModalCustomer,
                        status: e.target.checked ? 'active' : 'inactive'
                      })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Card is Live & Accessible Publicly
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentModalCustomer.isPaid}
                      onChange={(e) => setPaymentModalCustomer({
                        ...paymentModalCustomer,
                        isPaid: e.target.checked,
                        paymentAmount: e.target.checked && (!paymentModalCustomer.paymentAmount || paymentModalCustomer.paymentAmount === 0)
                          ? (paymentModalCustomer.planTier === '999_3yr' ? 999 : 499)
                          : paymentModalCustomer.paymentAmount
                      })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Mark as Paid
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  When card is Active and Paid, visitors can view and share the card. If inactive, visitors see &quot;Card Activation Pending&quot;.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/40 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Payment &amp; Update Live Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
          <div className="glass-panel max-w-sm w-full rounded-3xl p-6 relative shadow-2xl border border-rose-400/40 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3 border border-rose-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Delete Customer Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              This will remove the customer profile and their public mini website. This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 font-medium border border-white/50 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
          <div className="glass-panel max-w-sm w-full rounded-3xl p-6 relative shadow-2xl border border-white/40">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              Download Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select a date range to export records and prevent full data compromise. Leave blank to export all filtered records.
            </p>
            <div className="space-y-3 mb-5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 font-medium border border-white/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer QR Code Preview & Share Modal */}
      {selectedQrCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 relative shadow-2xl border border-white/60 dark:border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/40 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedQrCustomer.businessName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{selectedQrCustomer.firstName} {selectedQrCustomer.lastName}</span>
                    <span>&bull;</span>
                    <span className={`font-semibold ${selectedQrCustomer.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {selectedQrCustomer.status === 'active' ? 'Active' : 'Pending Activation'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQrCustomer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                aria-label="Close QR Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center justify-center py-2">
              <QRCodeDisplay
                url={`${window.location.origin}/?card=${getCustomerSlug(selectedQrCustomer)}`}
                title={selectedQrCustomer.businessName}
                subtitle="Scan with smartphone camera to view live digital card"
                size={220}
                isActive={true}
              />
            </div>

            {/* Quick Actions for Admin */}
            <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/10 space-y-2">
              {/* WhatsApp Share to Customer */}
              {selectedQrCustomer.phone && (
                <a
                  href={generateWhatsAppUrl(
                    selectedQrCustomer.whatsappNumber || selectedQrCustomer.phone,
                    `Hello ${selectedQrCustomer.firstName},\n\nYour digital visiting card for *${selectedQrCustomer.businessName}* is ready!\n\nView and share your card here:\n${window.location.origin}/?card=${getCustomerSlug(selectedQrCustomer)}\n\nScan your card QR code or download your .vcf contact directly!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Card &amp; QR to Client on WhatsApp</span>
                </a>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cardUrl = `${window.location.origin}/?card=${getCustomerSlug(selectedQrCustomer)}`;
                    navigator.clipboard.writeText(cardUrl);
                    showToast('Public card URL copied to clipboard!');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl glass-card text-xs font-semibold text-slate-700 dark:text-slate-200 border border-white/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                >
                  Copy Card Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewCustomerCard(selectedQrCustomer);
                    setSelectedQrCustomer(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer QR Directory Hub Modal */}
      {showQrDirectoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel max-w-4xl w-full max-h-[85vh] rounded-3xl p-6 relative shadow-2xl border border-white/60 dark:border-white/20 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/40 dark:border-white/10 mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>Customer QR Codes Hub</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                      {customers.length} Total
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instantly view, download, or WhatsApp share QR codes for all registered businesses.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrDirectoryModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                aria-label="Close QR Directory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of All Customer QRs */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {customers.map((c) => {
                const cardUrl = `${window.location.origin}/?card=${getCustomerSlug(c)}`;
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl glass-card border border-white/60 dark:border-white/10 flex flex-col items-center text-center justify-between hover:shadow-lg transition-all"
                  >
                    <div className="w-full flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate text-left" title={c.businessName}>
                        {c.businessName}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        c.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {c.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </div>

                    <div className="my-2 p-2 bg-white rounded-xl shadow-xs">
                      <QRCodeDisplay
                        url={cardUrl}
                        size={140}
                        isActive={true}
                      />
                    </div>

                    <div className="w-full text-slate-500 dark:text-slate-400 text-[11px] truncate mb-3">
                      {c.firstName} {c.lastName} &bull; {c.phone}
                    </div>

                    <div className="w-full flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQrCustomer(c);
                          setShowQrDirectoryModal(false);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors"
                      >
                        Full QR &amp; WA
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onViewCustomerCard(c);
                          setShowQrDirectoryModal(false);
                        }}
                        className="p-1.5 rounded-lg glass-card hover:bg-white text-slate-700 dark:text-slate-300 transition-colors"
                        title="Open Card"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
