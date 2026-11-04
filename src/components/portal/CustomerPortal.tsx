import React, { useState, useEffect, useMemo } from 'react';
import { Customer, ProductService, Inquiry, MiniWebsiteThemeId } from '../../types';
import { MiniWebsiteView } from '../card/MiniWebsiteView';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { ImageUploadBox } from '../common/ImageUploadBox';
import { ThemeSelector } from '../common/ThemeSelector';
import { IndustrySelect } from '../common/IndustrySelect';
import { getMiniWebsiteTheme } from '../../utils/themes';
import { downloadVCard } from '../../utils/vcard';
import { cleanSlug, getCustomerSlug } from '../../utils/slug';
import { SocialProfilesManager } from './SocialProfilesManager';
import { formatShareLocation } from '../../utils/address';
import { launchWhatsAppUrl, formatWhatsAppNumber } from '../../utils/whatsapp';
import { UpiPaymentModal } from '../card/UpiPaymentModal';
import { isValidUpiId, cleanUpiId as sanitizeUpiId } from '../../utils/upi';
import {
  sanitizeSafeUrl,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  isAuthorizedToManage,
} from '../../utils/security';
import {
  Smartphone,
  Edit3,
  Package,
  MessageSquare,
  QrCode,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  Share2,
  Sparkles,
  Store,
  Clock,
  PhoneCall,
  UserPlus,
  Palette,
  Navigation,
  Globe,
  MessageCircle,
  Edit,
  X,
  IndianRupee,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { RazorpayPaymentModal } from './RazorpayPaymentModal';
import { RazorpayPaymentResult, getSubscriptionDetails } from '../../utils/razorpay';
import { addOrUpdateStoredCustomer, saveStoredCustomers, getStoredCustomers } from '../../utils/storage';

interface CustomerPortalProps {
  customer: Customer;
  allCustomers?: Customer[];
  inquiries: Inquiry[];
  onUpdateCustomer: (updated: Customer) => void;
  onLogout: () => void;
  onViewStandaloneCard: () => void;
  autoOpenPaymentModal?: boolean;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  allCustomers = [],
  inquiries,
  onUpdateCustomer,
  onLogout,
  onViewStandaloneCard,
  autoOpenPaymentModal,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit-profile' | 'payments' | 'themes' | 'products' | 'socials' | 'inquiries' | 'share' | 'referral'>(
    !customer.isPaid ? 'edit-profile' : 'preview'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [testPaymentModalOpen, setTestPaymentModalOpen] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [selectedLaunchPlan, setSelectedLaunchPlan] = useState<'499_1yr' | '999_3yr'>(
    customer.planTier || '499_1yr'
  );
  const [saveToast, setSaveToast] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sync plan tier
  useEffect(() => {
    if (customer.planTier) {
      setSelectedLaunchPlan(customer.planTier);
    }
  }, [customer.planTier]);

  const launchPlanAmount = selectedLaunchPlan === '999_3yr' ? 999 : 499;

  // Form states for profile editing
  const [formData, setFormData] = useState<Customer>(customer);

  // Sync state if customer data updates (e.g. from Cloud sync or account refresh)
  useEffect(() => {
    setFormData(customer);
  }, [customer.id, customer.updatedAt, customer.businessName, customer.avatarUrl, customer.bannerUrl]);

  // Ensure clean browser URL while editing so refresh stays in Customer Portal
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('card=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // New product form states
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductImage2, setNewProductImage2] = useState('');
  const [newProductCta, setNewProductCta] = useState('Inquire Now');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);

  const MAX_PRODUCTS = 20;

  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const captureLocation = () => {
    setLocationFeedback(null);
    if (!navigator.geolocation) {
      setLocationFeedback({
        type: 'error',
        text: 'Geolocation is not supported by your current browser.'
      });
      return;
    }
    
    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          address: {
            ...formData.address,
            googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
          }
        });
        setIsCapturingLocation(false);
        setLocationFeedback({
          type: 'success',
          text: `GPS coordinates captured successfully (${latitude.toFixed(4)}, ${longitude.toFixed(4)})!`
        });
        setTimeout(() => setLocationFeedback(null), 4000);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsCapturingLocation(false);
        setLocationFeedback({
          type: 'error',
          text: 'Could not access GPS location. Please check browser permissions or paste link manually.'
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const customerSlug = getCustomerSlug(formData);
  const cardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?card=${customerSlug}`
    : `https://visitingcard.pro?card=${customerSlug}`;
  const subdomainUrl = `https://${customerSlug}.yourdomain.com`;

  // Live condition: must be active status and marked as paid
  const isCardLive = customer.status === 'active' && customer.isPaid;

  // Active subscription & plan details
  const subscriptionInfo = useMemo(() => getSubscriptionDetails(formData), [formData]);

  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [inactiveToast, setInactiveToast] = useState<string | null>(null);

  const showInactiveToast = (msg?: string) => {
    setInactiveToast(
      msg || 'Card Activation Pending — Please Make Payment. Public sharing, link copying, QR scanning, and contact download remain locked until payment is verified.'
    );
    setTimeout(() => setInactiveToast(null), 4000);
  };

  const handleRazorpaySuccess = (result: RazorpayPaymentResult) => {
    const updatedCustomer: Customer = {
      ...customer,
      ...formData,
      planTier: result.planTier || selectedLaunchPlan,
      isPaid: true,
      status: 'active', // Instantly auto-approved upon successful payment!
      paymentAmount: result.amount,
      paymentMethod: result.method,
      paidAt: result.paidAt,
      planExpiresAt: result.planExpiresAt,
    };
    setFormData(updatedCustomer);
    onUpdateCustomer(updatedCustomer);
    addOrUpdateStoredCustomer(updatedCustomer);
    saveStoredCustomers(getStoredCustomers().map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('avc_payment_completed', { detail: updatedCustomer }));
    }
    setShowRazorpayModal(false);
    showInactiveToast('🎉 Payment Verified via Razorpay! Your card is now 100% LIVE and auto-approved.');
  };

  const customerInquiries = inquiries.filter((inq) => inq.customerId === customer.id);

  const handleCopyLink = async () => {
    if (!isCardLive) {
      showInactiveToast('Card Activation Pending: Please complete payment to activate link copying and public sharing.');
      return;
    }
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleCopySubdomain = async () => {
    if (!isCardLive) {
      showInactiveToast('Card Activation Pending: Custom subdomain is locked until payment is verified.');
      return;
    }
    try {
      await navigator.clipboard.writeText(subdomainUrl);
      setCopiedSubdomain(true);
      setTimeout(() => setCopiedSubdomain(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    if (!isCardLive) {
      showInactiveToast('Card Activation Pending: WhatsApp card sharing is locked until payment is verified.');
      return;
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `*${customer.businessName}*\n${customer.firstName} ${customer.lastName} | ${customer.jobTitle}\n\n"${customer.headline}"\n\n📍 ${formatShareLocation(customer.address)}\n📱 Contact: ${customer.phone}\n\n*View complete digital profile & services:*\n${cardUrl}`
    )}`;
    launchWhatsAppUrl(waUrl);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // OWASP A01: Access Control Check (IDOR protection)
    if (!isAuthorizedToManage(customer, formData.id)) {
      alert('Security Notice: Unauthorized profile modification prevented.');
      return;
    }

    // NPCI UPI VPA Validation: If provided, must match standard VPA syntax
    const rawUpi = formData.upiId?.trim() || '';
    if (rawUpi && !isValidUpiId(rawUpi)) {
      alert('Invalid UPI ID format! Please enter a valid UPI address (e.g. yourbusiness@okaxis or 9820154321@paytm) so visitors can pay you without errors.');
      return;
    }
    const cleanUpi = rawUpi ? sanitizeUpiId(rawUpi) : undefined;

    // OWASP A03: Input Sanitization against XSS & URL injection
    const sanitizedData: Customer = {
      ...formData,
      firstName: sanitizeText(formData.firstName),
      lastName: sanitizeText(formData.lastName),
      businessName: sanitizeText(formData.businessName),
      jobTitle: sanitizeText(formData.jobTitle),
      headline: sanitizeText(formData.headline),
      bio: sanitizeText(formData.bio),
      email: sanitizeEmail(formData.email),
      phone: sanitizePhone(formData.phone),
      whatsappNumber: formatWhatsAppNumber(formData.whatsappNumber || formData.phone) || sanitizePhone(formData.whatsappNumber || ''),
      websiteUrl: formData.websiteUrl?.trim()
        ? sanitizeSafeUrl(formData.websiteUrl.trim(), '')
        : (cardUrl || ''),
      upiId: cleanUpi,
      address: {
        ...formData.address,
        shopNumber: sanitizeText(formData.address.shopNumber),
        areaLocality: sanitizeText(formData.address.areaLocality),
        landmark: formData.address.landmark ? sanitizeText(formData.address.landmark) : undefined,
        city: sanitizeText(formData.address.city),
        state: sanitizeText(formData.address.state),
        pincode: sanitizeText(formData.address.pincode),
        googleMapsUrl: formData.address.googleMapsUrl ? sanitizeSafeUrl(formData.address.googleMapsUrl) : undefined,
      }
    };

    setFormData(sanitizedData);
    onUpdateCustomer(sanitizedData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductTitle.trim()) return;

    if ((formData.products || []).length >= MAX_PRODUCTS) {
      alert(`Maximum limit of ${MAX_PRODUCTS} products reached. Please edit or delete existing products to add new ones.`);
      return;
    }

    // Strictly use user-uploaded image if provided. Do NOT fallback to random demo or Unsplash photos.
    const productCoverImage = newProductImage.trim()
      ? sanitizeSafeUrl(newProductImage.trim())
      : '';

    const newProd: ProductService = {
      id: `prod-${Date.now()}`,
      title: sanitizeText(newProductTitle.trim()),
      description: sanitizeText(newProductDesc.trim()) || 'High quality customized offering tailored to client requirements.',
      price: sanitizeText(newProductPrice.trim()) || 'Contact for pricing',
      priceType: newProductPrice.includes('$') || newProductPrice.includes('₹') ? 'fixed' : 'contact',
      imageUrl: productCoverImage,
      imageUrl2: newProductImage2.trim() ? sanitizeSafeUrl(newProductImage2.trim()) : undefined,
      ctaText: sanitizeText(newProductCta.trim()) || 'Inquire Now',
      category: 'Offerings',
    };

    const updatedProducts = [newProd, ...(formData.products || [])];
    const updated = { ...formData, products: updatedProducts };
    setFormData(updated);
    onUpdateCustomer(updated);

    // Reset form cleanly
    setNewProductTitle('');
    setNewProductDesc('');
    setNewProductPrice('');
    setNewProductImage('');
    setNewProductImage2('');
    setNewProductCta('Inquire Now');
    setShowAddProduct(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleUpdateExistingProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.title.trim()) return;

    // Strictly use user-uploaded image if provided. Do NOT fallback to random demo or Unsplash photos.
    const existingCoverImage = editingProduct.imageUrl?.trim()
      ? sanitizeSafeUrl(editingProduct.imageUrl.trim())
      : '';

    const sanitizedProduct: ProductService = {
      ...editingProduct,
      title: sanitizeText(editingProduct.title.trim()),
      description: sanitizeText(editingProduct.description.trim()),
      price: sanitizeText(editingProduct.price.trim()),
      ctaText: sanitizeText(editingProduct.ctaText.trim()) || 'Inquire Now',
      imageUrl: existingCoverImage,
      imageUrl2: editingProduct.imageUrl2 ? sanitizeSafeUrl(editingProduct.imageUrl2.trim()) : undefined,
    };

    const updatedProducts = (formData.products || []).map((p) =>
      p.id === editingProduct.id ? sanitizedProduct : p
    );
    const updated = { ...formData, products: updatedProducts };
    setFormData(updated);
    onUpdateCustomer(updated);

    setEditingProduct(null);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = (formData.products || []).filter((p) => p.id !== productId);
    const updated = { ...formData, products: updatedProducts };
    setFormData(updated);
    onUpdateCustomer(updated);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Toast */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 glass-panel bg-emerald-600/95 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400 backdrop-blur-xl animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Profile Saved Successfully!</span>
            {!isCardLive && (
              <span className="text-[11px] text-emerald-100">
                Ready to launch? Choose plan &amp; activate your card live.
              </span>
            )}
          </div>
          {!isCardLive && (
            <button
              type="button"
              onClick={() => {
                setSaveToast(false);
                setShowRazorpayModal(true);
              }}
              className="ml-1 px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-extrabold text-[11px] shadow-sm hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Launch (₹{launchPlanAmount})
            </button>
          )}
        </div>
      )}

      {/* Inactive Notice Toast */}
      {inactiveToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-panel bg-amber-500/95 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-amber-300 backdrop-blur-xl animate-in fade-in max-w-md text-xs font-bold">
          <AlertCircle className="w-5 h-5 text-slate-950 flex-shrink-0" />
          <span>{inactiveToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="glass-nav sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between gap-3 border-b border-white/50 dark:border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={customer.avatarUrl}
            alt={customer.firstName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-600/30 shadow-sm flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {customer.businessName}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider glass-badge ${
                  isCardLive
                    ? 'border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'border border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                {isCardLive ? `✓ ${subscriptionInfo.planTier === '999_3yr' ? '3 Years' : '1 Year'} Active` : 'Activation Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {customer.firstName} {customer.lastName} &middot; {customer.jobTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Main Burger Menu Button */}
          <button
            type="button"
            onClick={() => setShowMobileDrawer(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            aria-label="Open Navigation Menu"
            title="Open Full Navigation Menu"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>

          <button
            type="button"
            onClick={onViewStandaloneCard}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-badge border text-xs font-semibold hover:scale-102 transition-all ${
              isCardLive
                ? 'border-indigo-200/60 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300'
                : 'border-amber-400/60 dark:border-amber-600/50 text-amber-700 dark:text-amber-300'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isCardLive ? 'Open Live Page' : 'Card Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl glass-card hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-white/60 dark:border-white/10 transition-colors"
            title="Copy Public Card Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white glass-card border border-white/40 dark:border-white/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Slide-out Burger Menu Drawer (Mobile & Desktop) */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-white/10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={customer.avatarUrl}
                  alt={customer.firstName}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {customer.businessName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${isCardLive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isCardLive
                        ? `${subscriptionInfo.planTier === '999_3yr' ? '3 Years' : '1 Year'} Active`
                        : 'Pending Activation'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileDrawer(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Digital Card Link in Drawer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/10">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Digital Card Link
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                  {cardUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors flex-shrink-0"
                >
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Navigation Categories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Studio & Profile */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
                  Studio & Profile
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('preview');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4" />
                      <span>Live Mini Website View</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('edit-profile');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'edit-profile'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile & Address</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('products');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'products'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4" />
                      <span>Manage Products</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {formData.products?.length || 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* Branding & Payments */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
                  Branding & Payments
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('payments');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'payments'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IndianRupee className="w-4 h-4 text-emerald-500" />
                      <span>UPI & Payments</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      formData.upiId
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}>
                      {formData.upiId ? 'Active' : 'Setup'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('themes');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'themes'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Palette className="w-4 h-4" />
                      <span>Website Themes</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                      5 Themes
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('socials');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'socials'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4" />
                      <span>Social Media Cards</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Audience & Growth */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
                  Audience & Growth
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inquiries');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'inquiries'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>Leads & Inquiries</span>
                    </div>
                    {customerInquiries.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                        {customerInquiries.length}
                      </span>
                    )}
                  </button>

                  {/* QR Code & Sharing List Point */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('share');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'share'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold">QR Code & vCard Sharing</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                      QR Point
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('referral');
                      setShowMobileDrawer(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activeTab === 'referral'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Refer & Earn</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                      ₹150
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => {
                  setShowMobileDrawer(false);
                  onViewStandaloneCard();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isCardLive ? 'Open Public Card' : 'Preview Private Card'}</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 px-3 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payment & Card Activation Notice Banner */}
      {!isCardLive && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/15 border border-amber-500/35 text-amber-900 dark:text-amber-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3.5 max-w-xl">
              <div className="p-2.5 rounded-2xl bg-amber-500/25 flex-shrink-0 text-amber-700 dark:text-amber-300 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm flex flex-wrap items-center gap-2">
                  <span>Card Activation Pending — Choose Plan to Launch</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/40 font-bold">
                    {customer.isPaid ? 'Awaiting Verification' : 'Payment Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Select your plan below. Price is auto-calculated. Complete payment to activate your card, unlock WhatsApp sharing, and enable .vcf contact downloads.
                </p>
              </div>
            </div>

            {/* Plan Selector & Auto-Filled Price Launch Trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              {/* Interactive Plan Chips */}
              <div className="inline-flex p-1 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/30 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedLaunchPlan('499_1yr')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedLaunchPlan === '499_1yr'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                  }`}
                >
                  {selectedLaunchPlan === '499_1yr' && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>1 Year (₹499)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLaunchPlan('999_3yr')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
                    selectedLaunchPlan === '999_3yr'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                  }`}
                >
                  <span className="absolute -top-2 right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[8px] font-extrabold uppercase">
                    Best Value
                  </span>
                  {selectedLaunchPlan === '999_3yr' && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>3 Years (₹999)</span>
                </button>
              </div>

              {/* Auto-filled Action Button */}
              <button
                type="button"
                onClick={() => setShowRazorpayModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay ₹{launchPlanAmount} & Launch Card</span>
              </button>

              <button
                type="button"
                onClick={onViewStandaloneCard}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Digital Card & Subscription Live Status Banner */}
      {isCardLive && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/35 text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm flex flex-wrap items-center gap-2">
                  <span>Active Subscription: <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold">{subscriptionInfo.planName}</strong></span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE 🟢
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                  <span>Activated: <strong>{subscriptionInfo.formattedActivatedDate}</strong></span>
                  <span>•</span>
                  <span>Valid Until: <strong className="text-emerald-600 dark:text-emerald-400">{subscriptionInfo.formattedExpiryDate}</strong></span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    {subscriptionInfo.daysRemaining} Days Remaining
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1 font-mono truncate">
                  <span className="text-slate-400">Card Link:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 underline truncate">{cardUrl}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/60 dark:border-white/10 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={onViewStandaloneCard}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Live Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Streamlined Navigation Bar (Hidden on Desktop) */}
      <div className="lg:hidden px-4 pt-3 pb-1 relative z-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
          {/* Burger Menu Trigger Pill */}
          <button
            type="button"
            onClick={() => setShowMobileDrawer(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white shadow-sm font-bold flex-shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>All Pages (9)</span>
          </button>

          {/* Quick Frequent Tabs */}
          {[
            { id: 'preview', label: 'Preview', icon: Smartphone },
            { id: 'edit-profile', label: 'Edit Profile', icon: Edit3 },
            { id: 'products', label: `Products (${formData.products?.length || 0})`, icon: Package },
            { id: 'payments', label: 'UPI & Pay', icon: IndianRupee },
            { id: 'share', label: 'QR Code', icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0 text-xs cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md font-bold'
                    : 'glass-card text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column / Tabs Navigation (Desktop only, with Collapse Toggle) */}
        <aside className={`hidden lg:block transition-all duration-300 space-y-4 ${
          isSidebarCollapsed ? 'lg:col-span-1 xl:col-span-1' : 'lg:col-span-4 xl:col-span-2'
        }`}>
          <div className="glass-panel p-2.5 sm:p-3 rounded-3xl border border-white/60 dark:border-white/15 space-y-1 shadow-lg">
            {/* Sidebar Header & Collapse Toggle */}
            <div className={`flex items-center mb-1 pb-1.5 border-b border-white/40 dark:border-white/10 ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between px-1'
            }`}>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Sidebar to Icons'}
              >
                {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation Tabs */}
            <button
              onClick={() => setActiveTab('preview')}
              title="Live Mini Website View"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'preview'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Live Mini Website View</span>}
            </button>

            <button
              onClick={() => setActiveTab('edit-profile')}
              title="Edit Profile & Address"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'edit-profile'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <Edit3 className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Edit Profile & Address</span>}
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              title="UPI & Online Payments"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'payments'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <IndianRupee className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {!isSidebarCollapsed && <span>UPI & Payments</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  formData.upiId
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}>
                  {formData.upiId ? 'Active' : 'Setup'}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              title="Website Themes"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'themes'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Website Themes</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                  5 Themes
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              title={`Manage Products (${formData.products?.length || 0})`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'products'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Manage Products</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  {formData.products?.length || 0}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('socials')}
              title="Social Media Cards"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'socials'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Social Media Cards</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-pink-500/20 text-pink-700 dark:text-pink-300 font-bold">
                  Thumbnails
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              title={`Leads & Inquiries (${customerInquiries.length})`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'inquiries'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Leads & Inquiries</span>}
              </div>
              {!isSidebarCollapsed && customerInquiries.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] glass-badge border border-indigo-300/60 dark:border-indigo-700/60 text-indigo-700 dark:text-indigo-300 font-bold">
                  {customerInquiries.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('referral')}
              title="Refer & Earn"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'referral'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Refer & Earn</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  New
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('share')}
              title="QR Code & vCard Sharing"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'share'
                  ? 'glass-btn-primary text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <QrCode className="w-4 h-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>QR Code & Sharing</span>}
            </button>
          </div>

          {/* Quick Stats Widget (Hidden if sidebar is collapsed) */}
          {!isSidebarCollapsed && (
            <div className="glass-card p-4 rounded-3xl border border-white/60 dark:border-white/10 text-xs space-y-3 shadow-md">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[11px]">
                Visitor Activity
              </span>
              <div className="flex items-center justify-between py-1 border-b border-white/40 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Total Profile Views</span>
                <span className="font-bold text-slate-900 dark:text-white">{customer.viewCount || 1}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/40 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Inquiries Received</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{customerInquiries.length}</span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isCardLive) {
                      showInactiveToast('Card Activation Pending: .vcf contact download is locked until payment is verified.');
                      return;
                    }
                    downloadVCard(customer);
                  }}
                  className={`w-full py-2.5 px-3 rounded-2xl glass-card text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                    isCardLive
                      ? 'hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-white/50 dark:border-white/10'
                      : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  }`}
                  title={!isCardLive ? 'Locked until payment verified' : 'Test vCard Download'}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isCardLive ? 'Test vCard Download' : 'vCard Download (Locked)'}</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Middle Area: Form Content */}
        <main className={`min-w-0 w-full transition-all duration-300 ${
          isSidebarCollapsed
            ? (activeTab === 'preview' ? 'lg:col-span-11 xl:col-span-11' : 'lg:col-span-11 xl:col-span-7')
            : (activeTab === 'preview' ? 'lg:col-span-8 xl:col-span-10' : 'lg:col-span-8 xl:col-span-6')
        }`}>
          
          {/* TAB 1: LIVE MINI WEBSITE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Live Mini Website Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This is how your prospective clients see your digital card when you share the link or QR code.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('themes')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-badge border border-indigo-200/60 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:scale-102 transition-all"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Change Theme</span>
                  </button>
                  <button
                    onClick={onViewStandaloneCard}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Full Screen Mode</span>
                  </button>
                </div>
              </div>

              {/* Quick Switch Theme Bar */}
              <div className="p-3 rounded-2xl glass-panel border border-white/60 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Active Theme: <span className="text-indigo-600 dark:text-indigo-400">{getMiniWebsiteTheme(formData.themeId).name}</span>
                  </span>
                </div>
                <ThemeSelector
                  selectedThemeId={formData.themeId || 'royal-indigo'}
                  onSelectTheme={(tId) => {
                    const updated = { ...formData, themeId: tId };
                    setFormData(updated);
                    onUpdateCustomer(updated);
                    setSaveToast(true);
                    setTimeout(() => setSaveToast(false), 2500);
                  }}
                  variant="compact-chips"
                />
              </div>

              {/* Embedded view */}
              <div className="border border-white/60 dark:border-white/15 rounded-3xl overflow-hidden shadow-2xl">
                <MiniWebsiteView
                  customer={formData}
                  isOwnerPreview={true}
                  onBackToPortal={() => setActiveTab('edit-profile')}
                />
              </div>
            </div>
          )}

          {/* TAB 2: EDIT PROFILE & ADDRESS */}
          {activeTab === 'edit-profile' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Edit Profile, Branding & Address
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update your digital visiting card details. Changes persist locally in real time.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                {/* Visual Media Uploads */}
                <div className="p-4 rounded-2xl glass-card border border-white/60 dark:border-white/10 space-y-4">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Profile Photo, Logo & Header Banner
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload your business profile photo, brand logo, and header banner. Your images are automatically processed and stored.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Square Media: Profile Avatar & Brand Logo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageUploadBox
                        id="upload-avatar-box"
                        label="Profile Photo / Avatar"
                        value={formData.avatarUrl}
                        onChange={(newUrl) => setFormData({ ...formData, avatarUrl: newUrl })}
                        onRemove={() => setFormData({ ...formData, avatarUrl: '' })}
                        aspectRatio="square"
                        recommendedText="Recommended 400×400 px"
                        maxWidth={500}
                        maxHeight={500}
                      />

                      <ImageUploadBox
                        id="upload-logo-box"
                        label="Brand Logo"
                        value={formData.logoUrl || ''}
                        onChange={(newUrl) => setFormData({ ...formData, logoUrl: newUrl })}
                        onRemove={() => setFormData({ ...formData, logoUrl: '' })}
                        aspectRatio="square"
                        recommendedText="Recommended 400×400 px"
                        maxWidth={500}
                        maxHeight={500}
                      />
                    </div>

                    {/* Panoramic Landscape Media: Header Banner */}
                    <div>
                      <ImageUploadBox
                        id="upload-banner-box"
                        label="Header Banner"
                        value={formData.bannerUrl || ''}
                        onChange={(newUrl) => setFormData({ ...formData, bannerUrl: newUrl })}
                        onRemove={() => setFormData({ ...formData, bannerUrl: '' })}
                        aspectRatio="banner"
                        recommendedText="Recommended 1200×500 px"
                        maxWidth={1200}
                        maxHeight={500}
                      />
                    </div>
                  </div>
                </div>

                {/* Mini Website Visual Theme (5 Themes) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                        Mini Website Visual Theme (5 Options)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Select an elegant theme that dictates the color palette, ambient lighting, badges, and buttons.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Active: {getMiniWebsiteTheme(formData.themeId).name}
                    </span>
                  </div>

                  <ThemeSelector
                    selectedThemeId={formData.themeId || 'royal-indigo'}
                    onSelectTheme={(tId) => setFormData({ ...formData, themeId: tId })}
                    variant="full-cards"
                  />
                </div>

                {/* Identity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <IndustrySelect
                      id="portal-industry-select"
                      label="Your Industry / Category"
                      required={true}
                      value={formData.businessCategory}
                      onChange={(val) => setFormData({ ...formData, businessCategory: val })}
                      showSearchAssistant={true}
                    />
                  </div>
                </div>

                {/* Custom Subdomain & Direct Slug Handle */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                        Custom Shop Subdomain & URL Handle
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Choose your shop's web handle. Your card is immediately reachable on this subdomain and link.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Live Subdomain
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-xs font-mono select-none hidden sm:inline">https://</span>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => {
                        const cleaned = cleanSlug(e.target.value);
                        setFormData({ ...formData, slug: cleaned });
                      }}
                      placeholder="your-shop-name"
                      className="glass-input font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs py-2 flex-1"
                    />
                    <span className="text-slate-400 text-xs font-mono select-none">.yourdomain.com</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Direct Link: <code className="text-indigo-600 dark:text-indigo-400 font-semibold">{cardUrl}</code></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title / Role</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Short Headline / Slogan</label>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">About / Business Bio</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="glass-input"
                  />
                </div>

                {/* Direct Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={formData.whatsappNumber || ''}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email ID *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-medium text-slate-700 dark:text-slate-300">Website / Card Link</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, websiteUrl: cardUrl })}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                        title="Reset to Digital Visiting Card Link"
                      >
                        Set Card Link
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.websiteUrl ?? cardUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder={cardUrl || 'https://yourwebsite.com'}
                      className="glass-input font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Storefront Full Address */}
                <div className="p-4 rounded-2xl glass-card border border-white/60 dark:border-white/10 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Storefront Address (Used for Directions & Map)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Shop / Unit Number</label>
                      <input
                        type="text"
                        value={formData.address.shopNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, shopNumber: e.target.value }
                        })}
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Area / Locality</label>
                      <input
                        type="text"
                        value={formData.address.areaLocality}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, areaLocality: e.target.value }
                        })}
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                        placeholder="e.g. Mumbai, Noida, Delhi"
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value }
                        })}
                        placeholder="e.g. Maharashtra, Uttar Pradesh"
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, pincode: e.target.value }
                        })}
                        placeholder="e.g. 400070"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={formData.address.landmark || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, landmark: e.target.value }
                      })}
                      placeholder="e.g. Opposite Phoenix Marketcity Mall Gate 2"
                      className="glass-input"
                    />
                  </div>

                  <div className="pt-3 p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        Google Maps Shop Directions Link
                      </label>
                      {formData.address.googleMapsUrl && (
                        <a
                          href={formData.address.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test Directions Link</span>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={formData.address.googleMapsUrl || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, googleMapsUrl: e.target.value }
                        })}
                        placeholder="e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                        className="glass-input flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={captureLocation}
                        disabled={isCapturingLocation}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl glass-btn-primary text-white font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 flex-shrink-0 text-xs"
                        title="Auto-detect current GPS coordinates"
                      >
                        <Navigation className={`w-3.5 h-3.5 ${isCapturingLocation ? 'animate-spin' : ''}`} />
                        <span>{isCapturingLocation ? 'Capturing GPS...' : 'Auto Capture GPS'}</span>
                      </button>
                    </div>

                    {locationFeedback && (
                      <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                        locationFeedback.type === 'success'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${locationFeedback.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span>{locationFeedback.text}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      This link powers the <span className="font-semibold text-slate-700 dark:text-slate-300">"Directions"</span> button and <span className="font-semibold text-slate-700 dark:text-slate-300">"Physical Address"</span> on your live mini website. When customers tap it, Google Maps opens directly with turn-by-turn navigation to your shop!
                    </p>
                  </div>
                </div>

                {/* Business Hours & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Business Hours</label>
                    <input
                      type="text"
                      value={formData.businessHours}
                      onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                      placeholder="Mon - Sat: 9:00 AM - 8:00 PM"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={formData.websiteUrl || ''}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder={cardUrl || 'https://yourwebsite.com'}
                      className="glass-input font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Receive Payments & UPI */}
                <div className="p-4 rounded-2xl glass-card border border-white/60 dark:border-white/10 space-y-4">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Receive Payments & UPI
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload your existing Payment QR code (GPay, PhonePe, Paytm, etc.) and enter your UPI ID. This allows customers to pay you directly from your card.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ImageUploadBox
                        id="upload-payment-qr"
                        label="Payment QR Code Image"
                        value={formData.paymentQrUrl || ''}
                        onChange={(newUrl) => setFormData({ ...formData, paymentQrUrl: newUrl })}
                        onRemove={() => setFormData({ ...formData, paymentQrUrl: '' })}
                        aspectRatio="square"
                        maxWidth={600}
                        maxHeight={600}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-medium text-slate-700 dark:text-slate-300">
                          Merchant UPI ID (Unified Payments Interface)
                        </label>
                        {formData.upiId && isValidUpiId(formData.upiId) ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>PAY UPI Ready</span>
                          </span>
                        ) : formData.upiId ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Format: name@bank
                          </span>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={formData.upiId || ''}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value.trim().replace(/\s+/g, '') })}
                        placeholder="yourbusiness@okaxis or 9820154321@paytm"
                        className="glass-input mb-2"
                      />

                      {/* Quick Bank Handle Suggestions */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="text-[10px] font-semibold text-slate-400">Quick Handle:</span>
                        {['@okaxis', '@okhdfcbank', '@oksbi', '@paytm', '@ybl', '@ibl'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => {
                              const current = (formData.upiId || '').split('@')[0];
                              const prefix = current || 'yourname';
                              setFormData({ ...formData, upiId: `${prefix}${handle}` });
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>

                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <span>⚡ 1-Tap UPI Intent Enabled:</span>
                        </p>
                        <p>
                          Adding your UPI ID automatically activates the <strong>PAY VIA UPI</strong> button on your public visiting card. When customers tap it on their smartphones, it opens their installed UPI apps (Google Pay, PhonePe, Paytm, BHIM, CRED) so they can pay you instantly!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/50 dark:border-white/10 mt-3">
                  {!isCardLive ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Choose Plan:
                      </span>
                      {/* Plan Choice Chips */}
                      <div className="inline-flex p-1 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-amber-500/30 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedLaunchPlan('499_1yr')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            selectedLaunchPlan === '499_1yr'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                          }`}
                        >
                          {selectedLaunchPlan === '499_1yr' && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>1 Year (₹499)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLaunchPlan('999_3yr')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            selectedLaunchPlan === '999_3yr'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                          }`}
                        >
                          {selectedLaunchPlan === '999_3yr' && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>3 Years (₹999)</span>
                        </button>
                      </div>

                      {/* Auto-filled Launch Card Button */}
                      <button
                        type="button"
                        onClick={() => setShowRazorpayModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Launch Card (Pay ₹{launchPlanAmount})</span>
                      </button>
                    </div>
                  ) : <div />}

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl glass-btn-primary text-white font-bold text-xs shadow-lg active:scale-98 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes &amp; Update Card</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: UPI & ONLINE PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* 1. Subscription & Plan Status Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/25 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-200/50 dark:border-indigo-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {subscriptionInfo.planName}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          customer.isPaid
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                        }`}>
                          {customer.isPaid ? 'Active Subscription' : 'Payment Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {customer.isPaid
                          ? 'Your Mini Website Card is fully verified, online, and accessible 24/7 across all devices.'
                          : 'Activate your plan to launch your card, unlock WhatsApp sharing, and enable contact downloads.'}
                      </p>
                    </div>
                  </div>

                  {!customer.isPaid ? (
                    <button
                      type="button"
                      onClick={() => setShowRazorpayModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Activate Card (₹{launchPlanAmount})
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Subscription Validity</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {subscriptionInfo.daysRemaining} Days Remaining
                      </span>
                    </div>
                  )}
                </div>

                {/* Subscription Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-white/10">
                    <span className="text-[10px] text-slate-400 font-medium block">Billing Amount</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-extrabold">₹{subscriptionInfo.planAmount}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-white/10">
                    <span className="text-[10px] text-slate-400 font-medium block">Activated On</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-bold">{subscriptionInfo.formattedActivatedDate}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-white/10">
                    <span className="text-[10px] text-slate-400 font-medium block">Valid Until</span>
                    <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">{subscriptionInfo.formattedExpiryDate}</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-white/10">
                    <span className="text-[10px] text-slate-400 font-medium block">Payment Status</span>
                    <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                      {customer.isPaid ? '100% Paid (No Dues)' : 'Unpaid'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/40 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                        <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          UPI & Online Payment Settings
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Enable 1-tap direct bank-to-bank payments via Google Pay, PhonePe, Paytm, BHIM & Netbanking.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {formData.upiId ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>PAY UPI Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Setup Pending</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
                  {/* Left Column: Form Controls */}
                  <form onSubmit={handleSaveProfile} className="lg:col-span-7 space-y-6">
                    {/* UPI ID Card */}
                    <div className="p-5 rounded-3xl glass-card border border-white/60 dark:border-white/10 space-y-4 shadow-sm">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                          Merchant UPI ID (VPA)
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          Payments sent to this UPI ID are credited directly into your linked bank account with 0% gateway commission.
                        </p>
                        
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.upiId || ''}
                            onChange={(e) => setFormData({ ...formData, upiId: e.target.value.trim().replace(/\s+/g, '') })}
                            placeholder="e.g. rajeshroyalsalon@okaxis or 9820154321@paytm"
                            className="glass-input text-sm font-mono tracking-wide py-3"
                          />
                        </div>
                      </div>

                      {/* Quick Bank Handle Suggestions */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                          Quick Bank Handle Suggestions:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['@okaxis', '@okhdfcbank', '@oksbi', '@paytm', '@ybl', '@ibl', '@icici', '@barodampay'].map((handle) => (
                            <button
                              key={handle}
                              type="button"
                              onClick={() => {
                                const current = (formData.upiId || '').split('@')[0];
                                const prefix = current || customer.phone.replace(/[^0-9]/g, '') || 'mybusiness';
                                setFormData({ ...formData, upiId: `${prefix}${handle}` });
                              }}
                              className="px-2.5 py-1 rounded-xl text-xs font-mono bg-white/70 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                            >
                              {handle}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Supported Apps List */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">
                          Supported Apps for Direct Payment:
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">Google Pay</span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">PhonePe</span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">Paytm</span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">BHIM UPI</span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">CRED</span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">All Bank Apps</span>
                        </div>
                      </div>
                    </div>

                    {/* Counter Standee QR Code Upload */}
                    <div className="p-5 rounded-3xl glass-card border border-white/60 dark:border-white/10 space-y-3 shadow-sm">
                      <div>
                        <label className="block font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                          Store Counter Standee / QR Code Image (Optional)
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Upload a photo of your shop's existing physical QR standee (GPay, PhonePe, Paytm, BharatPe). Visitors can scan it directly with their phone cameras.
                        </p>
                      </div>

                      <div className="max-w-xs">
                        <ImageUploadBox
                          id="upload-payment-qr-tab"
                          label="Counter QR Standee Photo"
                          value={formData.paymentQrUrl || ''}
                          onChange={(newUrl) => setFormData({ ...formData, paymentQrUrl: newUrl })}
                          onRemove={() => setFormData({ ...formData, paymentQrUrl: '' })}
                          aspectRatio="square"
                          maxWidth={600}
                          maxHeight={600}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Changes update your live visiting card immediately.
                      </p>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-btn-primary text-white font-bold text-xs shadow-lg active:scale-98 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Payment Settings</span>
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Interactive Card Preview */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 rounded-3xl glass-card border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                          Card Visitor Preview
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          How Customers See & Pay
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          This is the exact interactive payment box rendered on your public mini website:
                        </p>
                      </div>

                      {/* The Exact Visiting Card Payment Block */}
                      <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md text-center flex flex-col items-center">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 max-w-xs leading-relaxed">
                          Instant bank-to-bank payment to {formData.businessName || 'Your Business'} via any UPI App.
                        </p>

                        {/* Pay via UPI Apps Button */}
                        <button
                          type="button"
                          onClick={() => setTestPaymentModalOpen(true)}
                          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-between group border border-emerald-400/30 mb-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 text-left">
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-sm shadow-xs flex-shrink-0">
                              ₹
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">PAY VIA UPI APPS</span>
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-white/25 text-white">
                                  All Apps
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-100 font-normal block">
                                Google Pay, PhonePe, Paytm, BHIM & more
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-1 flex-shrink-0" />
                        </button>

                        {/* Copyable UPI ID Box */}
                        <div className="w-full glass-card px-3 py-2 rounded-xl border border-white/60 dark:border-white/10 flex items-center justify-between shadow-2xs mb-2.5">
                          <div className="text-left overflow-hidden mr-2">
                            <span className="text-[9px] text-slate-400 font-semibold uppercase block">UPI ID:</span>
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {formData.upiId || 'Not configured yet'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!formData.upiId) return;
                              await navigator.clipboard.writeText(formData.upiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="p-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer flex-shrink-0"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Dynamic Amount QR Trigger */}
                        <button
                          type="button"
                          onClick={() => setTestPaymentModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Enter Custom Amount & View Dynamic QR</span>
                        </button>
                      </div>

                      {/* Merchant Helper Note */}
                      <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Test It Live:</span>
                        </p>
                        <p>
                          Click <strong>"PAY VIA UPI APPS"</strong> or <strong>"Enter Custom Amount"</strong> above to test how your customers experience custom amount calculation and dynamic QR codes!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MINI WEBSITE THEMES (5 DISTINCT PROFESSIONAL DESIGNS) */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Mini Website Themes (5 Professional & Elegant Options)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose any theme below. The entire mini website updates automatically with matching ambient glassmorphic glows, header banners, action buttons, pricing badges, and contact forms.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-sm hover:scale-102 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View in Live Preview</span>
                    </button>
                  </div>
                </div>

                {/* Theme Selector Cards */}
                <ThemeSelector
                  selectedThemeId={formData.themeId || 'royal-indigo'}
                  onSelectTheme={(tId) => {
                    const updated = { ...formData, themeId: tId };
                    setFormData(updated);
                    onUpdateCustomer(updated);
                    setSaveToast(true);
                    setTimeout(() => setSaveToast(false), 2500);
                  }}
                  variant="full-cards"
                />

                {/* Theme Details Breakdown */}
                <div className="mt-8 p-5 rounded-2xl glass-card border border-white/60 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Active Theme Details
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10">
                      <span className="text-slate-400 block text-[11px]">Active Aesthetic</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {getMiniWebsiteTheme(formData.themeId).name}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {getMiniWebsiteTheme(formData.themeId).tagline}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10">
                      <span className="text-slate-400 block text-[11px]">Ambient Light Orbs</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Frosted Glassmorphism
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Multi-layer background lighting with soft blur
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 sm:col-span-2 lg:col-span-1">
                      <span className="text-slate-400 block text-[11px]">Sync Status</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Saved to Public Card
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Visitors opening your link immediately experience this theme
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE PRODUCTS & PORTFOLIO */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-3xl shadow-xl border border-white/60 dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Products & Services Portfolio
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      (formData.products || []).length >= MAX_PRODUCTS
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {(formData.products || []).length} / {MAX_PRODUCTS} Products
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload up to 20 offerings with 2 photos per item (cover photo + secondary angle), pricing, and direct inquiry buttons.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={(formData.products || []).length >= MAX_PRODUCTS && !showAddProduct}
                  onClick={() => {
                    if ((formData.products || []).length >= MAX_PRODUCTS && !showAddProduct) {
                      return;
                    }
                    setShowAddProduct(!showAddProduct);
                    setEditingProduct(null);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
                    (formData.products || []).length >= MAX_PRODUCTS && !showAddProduct
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                      : 'glass-btn-primary text-white active:scale-95'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {showAddProduct 
                      ? 'Close Form' 
                      : (formData.products || []).length >= MAX_PRODUCTS 
                        ? 'Limit Reached (20/20)' 
                        : 'Add New Item'}
                  </span>
                </button>
              </div>

              {/* Limit alert if max products reached */}
              {(formData.products || []).length >= MAX_PRODUCTS && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>You have reached the maximum limit of <strong>20 products</strong>. You can edit existing products or delete an item to add a new one.</span>
                </div>
              )}

              {/* Edit Product Modal / Drawer */}
              {editingProduct && (
                <div className="glass-panel p-6 rounded-3xl border-2 border-indigo-500/40 shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/30 dark:border-white/10">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-500" />
                      <span>Edit Product Offering</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateExistingProduct} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Item Title *</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.title}
                          onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                          className="glass-input"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Price / Terms</label>
                        <input
                          type="text"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                          className="glass-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="glass-input"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <ImageUploadBox
                          label="Image 1 (Main Cover Photo) *"
                          value={editingProduct.imageUrl || ''}
                          onChange={(url) => setEditingProduct({ ...editingProduct, imageUrl: url })}
                          onRemove={() => setEditingProduct({ ...editingProduct, imageUrl: '' })}
                          aspectRatio="banner"
                          recommendedText="Main product showcase photo"
                          maxWidth={800}
                          maxHeight={600}
                        />
                      </div>
                      <div>
                        <ImageUploadBox
                          label="Image 2 (Secondary Angle / Extra Photo)"
                          value={editingProduct.imageUrl2 || ''}
                          onChange={(url) => setEditingProduct({ ...editingProduct, imageUrl2: url })}
                          onRemove={() => setEditingProduct({ ...editingProduct, imageUrl2: undefined })}
                          aspectRatio="banner"
                          recommendedText="Optional 2nd photo for left/right swipe"
                          maxWidth={800}
                          maxHeight={600}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={editingProduct.ctaText}
                        onChange={(e) => setEditingProduct({ ...editingProduct, ctaText: e.target.value })}
                        className="glass-input"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl glass-btn-primary text-white font-semibold shadow-md"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add Product Form Drawer */}
              {showAddProduct && !editingProduct && (
                <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Add New Product / Service Card
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {(formData.products || []).length} of {MAX_PRODUCTS} used
                    </span>
                  </div>
                  <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Item Title *</label>
                        <input
                          type="text"
                          required
                          value={newProductTitle}
                          onChange={(e) => setNewProductTitle(e.target.value)}
                          placeholder="e.g. Classic Hot Towel Shave"
                          className="glass-input"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Price / Terms</label>
                        <input
                          type="text"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          placeholder="e.g. ₹499 or Contact for pricing"
                          className="glass-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newProductDesc}
                        onChange={(e) => setNewProductDesc(e.target.value)}
                        placeholder="Highlight details, materials, or turnaround time..."
                        className="glass-input"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <ImageUploadBox
                          label="Image 1 (Main Cover Photo) *"
                          value={newProductImage}
                          onChange={(url) => setNewProductImage(url)}
                          onRemove={() => setNewProductImage('')}
                          aspectRatio="banner"
                          recommendedText="Primary image displayed on card"
                          maxWidth={800}
                          maxHeight={600}
                        />
                      </div>
                      <div>
                        <ImageUploadBox
                          label="Image 2 (Secondary Angle / Extra Photo)"
                          value={newProductImage2}
                          onChange={(url) => setNewProductImage2(url)}
                          onRemove={() => setNewProductImage2('')}
                          aspectRatio="banner"
                          recommendedText="Optional 2nd photo for left/right swipe"
                          maxWidth={800}
                          maxHeight={600}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={newProductCta}
                        onChange={(e) => setNewProductCta(e.target.value)}
                        placeholder="e.g. Book Chair, Inquire, Reserve"
                        className="glass-input"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        className="px-4 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl glass-btn-primary text-white font-semibold shadow-md"
                      >
                        Add to Card
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Existing List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.products || []).map((product) => (
                  <div
                    key={product.id}
                    className="glass-card p-4 rounded-3xl border border-white/60 dark:border-white/10 flex flex-col justify-between hover:shadow-xl transition-all"
                  >
                    <div>
                      {/* Images Display */}
                      <div className="mb-3 relative rounded-2xl overflow-hidden">
                        {product.imageUrl2 ? (
                          <div className="grid grid-cols-2 gap-1.5 h-36">
                            <div className="relative h-full">
                              <img
                                src={product.imageUrl}
                                alt={`${product.title} - Photo 1`}
                                className="w-full h-full object-cover rounded-xl shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] text-white font-medium">
                                1 of 2
                              </span>
                            </div>
                            <div className="relative h-full">
                              <img
                                src={product.imageUrl2}
                                alt={`${product.title} - Photo 2`}
                                className="w-full h-full object-cover rounded-xl shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] text-white font-medium">
                                2 of 2
                              </span>
                            </div>
                          </div>
                        ) : product.imageUrl ? (
                          <div className="relative h-36">
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover rounded-2xl shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] text-white font-medium">
                              1 Photo
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {product.title}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full glass-badge border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold whitespace-nowrap">
                          {product.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Button: {product.ctaText}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct({ ...product });
                            setShowAddProduct(false);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="p-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/20 transition-colors"
                          title="Edit Product Details & Photos"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SOCIAL MEDIA PROFILES & THUMBNAILS */}
          {activeTab === 'socials' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl border border-white/60 dark:border-white/15 space-y-6">
              <SocialProfilesManager
                customer={formData}
                onUpdateCustomer={(updated) => {
                  setFormData(updated);
                  onUpdateCustomer(updated);
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 3000);
                }}
              />
            </div>
          )}

          {/* TAB 4: LEADS & INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-xl border border-white/60 dark:border-white/15 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Customer Inquiries & Form Submissions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prospective buyers who contacted you via your mini website's inquiry form.
                </p>
              </div>

              {customerInquiries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/60 dark:border-white/10 rounded-3xl glass-card">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No inquiries received yet. Share your mini website link or QR code to start receiving leads!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="glass-card p-4 rounded-2xl border border-white/60 dark:border-white/10 text-xs space-y-2 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {inq.senderName}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(inq.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
                        {inq.senderPhone && (
                          <a
                            href={`tel:${inq.senderPhone}`}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 underline font-medium"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                            {inq.senderPhone}
                          </a>
                        )}
                        {inq.senderEmail && (
                          <a
                            href={`mailto:${inq.senderEmail}`}
                            className="inline-flex items-center gap-1 hover:text-indigo-600 underline font-medium"
                          >
                            {inq.senderEmail}
                          </a>
                        )}
                        {inq.serviceInterested && (
                          <span className="px-2.5 py-0.5 rounded-full glass-badge border border-indigo-300/40 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                            Interested in: {inq.serviceInterested}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-700 dark:text-slate-200 glass-card p-3 rounded-xl border border-white/40 dark:border-white/10 italic">
                        "{inq.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REFERRAL TAB */}
          {activeTab === 'referral' && (() => {
            const cleanMyPhone = customer.phone.replace(/[^0-9]/g, '');
            const myReferrals = (allCustomers || []).filter((c) => {
              if (!c.referredBy) return false;
              const cleanRef = c.referredBy.replace(/[^0-9]/g, '');
              return (
                c.referredBy === customer.phone ||
                c.referredBy === customer.id ||
                (cleanMyPhone.length >= 10 && cleanRef.endsWith(cleanMyPhone.slice(-10)))
              );
            });
            const paidReferrals = myReferrals.filter((c) => c.isPaid || c.status === 'active');
            const earnedRewards = paidReferrals.length * 100; // ₹100 per active customer
            const pendingCount = myReferrals.filter((c) => !c.isPaid && c.status !== 'active').length;
            const referralLink = `${window.location.origin}?ref=${customer.phone}`;
            const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
              `Hello! Create your high-converting Digital Visiting Card & Mini Website with one-click WhatsApp, product showcase, and Google Maps direction: ${referralLink}`
            )}`;

            return (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Refer & Earn Program
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Invite other shop and business owners to create their Mini Website. For every business that registers using your link and activates their card, you earn ₹100 reward or subscription extensions!
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center space-y-4">
                  <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      Your Unique Referral Link
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Anyone registering through this link will be automatically tracked under your account.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="w-full glass-input text-xs font-mono text-center sm:text-left"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        setCopiedReferral(true);
                        setTimeout(() => setCopiedReferral(false), 2200);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      {copiedReferral ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReferral ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-white/60 dark:border-white/10 text-center">
                    <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{myReferrals.length}</div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Referrals</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/60 dark:border-white/10 text-center">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{earnedRewards}</div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Earned Rewards ({paidReferrals.length} Active)</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/60 dark:border-white/10 text-center">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{pendingCount}</div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Pending Activation</div>
                  </div>
                </div>

                {/* Referred Businesses List */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Referred Businesses ({myReferrals.length})
                  </h4>
                  {myReferrals.length === 0 ? (
                    <div className="p-4 rounded-xl glass-card border border-white/40 dark:border-white/10 text-center text-xs text-slate-500">
                      No referrals yet. Share your link with friends or other shop owners to start earning!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myReferrals.map((refCust) => (
                        <div
                          key={refCust.id}
                          className="p-3 rounded-xl glass-card border border-white/60 dark:border-white/10 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {refCust.businessName || `${refCust.firstName} ${refCust.lastName}`}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {refCust.businessCategory} • Joined {new Date(refCust.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              refCust.isPaid || refCust.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {refCust.isPaid || refCust.status === 'active' ? 'Active / Verified' : 'Pending Activation'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 5: SHARE & QR CODE */}
          {activeTab === 'share' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 max-w-xl mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Share Your Mini Website
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Display this QR code at your checkout counter, print it on paper cards, or send the direct link to telephone prospects.
                </p>
              </div>

              {/* Inactive Notice Banner if pending */}
              {!isCardLive && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-3 shadow-sm">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">Card Activation Pending — Please Complete Payment</span>
                    <p className="text-[11px] font-normal text-slate-700 dark:text-slate-300 mt-0.5">
                      Public access, link copying, WhatsApp sharing, QR code scanning, and .vcf contact downloads remain locked until payment is verified.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRazorpayModal(true)}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ₹{customer.planTier === '999_3yr' ? '999' : '499'} via Razorpay & Unlock Sharing</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Link & Subdomain URLs */}
              <div className="space-y-3 text-left text-xs">
                {/* 1. Direct Web Link */}
                <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      Direct Card Link
                    </span>
                    <span className={`text-[10px] font-bold ${isCardLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isCardLive ? '100% Live' : 'Payment Required'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={cardUrl}
                      className="flex-1 glass-input font-mono text-xs py-1.5 px-2.5 truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all whitespace-nowrap ${
                        isCardLive
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                      }`}
                      title={!isCardLive ? 'Locked until payment verified' : 'Copy Link'}
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Subdomain Address */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Custom Subdomain (Hosting Wildcard)
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">*.yourdomain.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={subdomainUrl}
                      className="flex-1 glass-input font-mono text-xs py-1.5 px-2.5 truncate font-bold text-indigo-600 dark:text-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={handleCopySubdomain}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all whitespace-nowrap ${
                        isCardLive
                          ? 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                      }`}
                      title={!isCardLive ? 'Locked until payment verified' : 'Copy Subdomain'}
                    >
                      {copiedSubdomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSubdomain ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp 1-Click Share Button */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow flex items-center justify-center gap-2 active:scale-98 transition-all ${
                    isCardLive
                      ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-dashed border-amber-400/60'
                  }`}
                  title={!isCardLive ? 'Disabled until payment verified' : 'Share on WhatsApp'}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isCardLive ? 'Share Card on WhatsApp' : 'WhatsApp Share (Locked - Payment Pending)'}</span>
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center pt-2">
                <QRCodeDisplay
                  url={cardUrl}
                  title={`${customer.businessName}`}
                  subtitle={isCardLive ? "Scan with smartphone camera to open and save this digital card" : "QR code scanning will activate once payment is verified"}
                  size={210}
                  isActive={isCardLive}
                />
              </div>

              <div className="p-4 rounded-2xl glass-card border border-indigo-500/20 text-xs space-y-2 text-center">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200">
                  Instant vCard Download (.vcf)
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Prospective clients can tap "Save Contact" on your mini website to instantly save your phone, email, address, and company details to their smartphone address book.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!isCardLive) {
                      showInactiveToast('Card Activation Pending: .vcf contact download is locked until payment is verified.');
                      return;
                    }
                    downloadVCard(customer);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
                    isCardLive
                      ? 'glass-btn-primary text-white'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 cursor-not-allowed'
                  }`}
                  title={!isCardLive ? 'Disabled until payment is verified' : 'Download .vcf File'}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isCardLive ? 'Download .vcf File' : 'vCard Download (Locked)'}</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Column: Sticky Mobile Mockup Preview (Only visible on large screens and not on preview tab) */}
        {activeTab !== 'preview' && (
          <aside className="hidden xl:block xl:col-span-4">
            <div className="sticky top-24">
              <div className="glass-panel rounded-[2.5rem] border-[8px] border-slate-900/10 dark:border-white/10 shadow-2xl overflow-hidden h-[85vh] relative flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900/10 dark:bg-white/10 rounded-b-2xl z-50"></div>
                
                <div className="flex-1 overflow-y-auto hide-scrollbar relative">
                   <MiniWebsiteView
                      customer={formData}
                      standalone={false}
                      isOwnerPreview={true}
                    />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Inactive Toast Notification with direct Launch Button */}
      {inactiveToast && (
        <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-50 py-3 px-4 rounded-2xl bg-amber-500/95 text-slate-950 font-bold text-xs shadow-2xl flex items-center justify-between gap-3 border border-amber-400 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="line-clamp-2">{inactiveToast}</span>
          </div>
          {!isCardLive && (
            <button
              type="button"
              onClick={() => {
                setInactiveToast(null);
                setShowRazorpayModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-[11px] shadow-sm hover:bg-black transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
            >
              Pay ₹{launchPlanAmount}
            </button>
          )}
        </div>
      )}

      {/* Interactive UPI Payment Modal (Test Mode in Portal) */}
      {testPaymentModalOpen && (
        <UpiPaymentModal
          customer={formData}
          isOpen={testPaymentModalOpen}
          onClose={() => setTestPaymentModalOpen(false)}
        />
      )}

      {/* Razorpay Gateway Payment & Activation Modal */}
      {showRazorpayModal && (
        <RazorpayPaymentModal
          customer={formData}
          isOpen={showRazorpayModal}
          initialPlan={selectedLaunchPlan}
          onClose={() => setShowRazorpayModal(false)}
          onPaymentSuccess={handleRazorpaySuccess}
        />
      )}
    </div>
  );
};
