import html2canvas from 'html2canvas';
import React, { useState, useEffect } from 'react';
import { Customer, ProductService, Inquiry, MiniWebsiteThemeId } from '../../types';
import { downloadVCard } from '../../utils/vcard';
import { addInquiry, addTestimonialToCustomer, addOrUpdateStoredCustomer } from '../../utils/storage';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { ThemeSelector } from '../common/ThemeSelector';
import { getMiniWebsiteTheme } from '../../utils/themes';
import { getCustomerSocialAccounts } from '../../utils/socialHelpers';
import { SocialCardWidget, getSocialPlatformIcon } from './SocialCardWidget';
import { ShareModal } from './ShareModal';
import { UpiPaymentModal } from './UpiPaymentModal';
import { cleanUpiId, generateUpiUri, launchUpiPayment, isMobileUserAgent } from '../../utils/upi';
import { formatWhatsAppNumber, generateWhatsAppUrl, launchWhatsAppUrl } from '../../utils/whatsapp';
import { getCustomerSlug, getCustomerCardUrl } from '../../utils/slug';
import { sanitizeSafeUrl, sanitizeTestimonialInput, sanitizeInquiryInput } from '../../utils/security';
import { formatCardLocation, formatFullAddressString } from '../../utils/address';
import { upsertCustomerToSupabase } from '../../utils/supabaseClient';
import {
  UserPlus,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Share2,
  Clock,
  Globe,
  ExternalLink,
  ShieldCheck,
  Star,
  Send,
  CheckCircle,
  Sparkles,
  QrCode,
  Store,
  ChevronRight,
  ChevronLeft,
  Eye,
  Palette,
  ArrowRight,
  ZoomIn,
  X,
  Plus,
  Check,
  Smartphone,
  Copy,
  Wallet,
  IndianRupee,
  Trash2,
} from 'lucide-react';

interface MiniWebsiteViewProps {
  customer: Customer;
  onBackToPortal?: () => void;
  isOwnerPreview?: boolean;
  standalone?: boolean;
  onUpdateCustomer?: (updated: Customer) => void;
  isDemo?: boolean;
}

export const MiniWebsiteView: React.FC<MiniWebsiteViewProps> = ({
  customer: initialCustomer,
  onBackToPortal,
  isOwnerPreview = false,
  standalone = false,
  onUpdateCustomer,
  isDemo = false,
}) => {
  const [customer, setCustomer] = useState<Customer>(initialCustomer);

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  // Synchronize document title and OpenGraph metadata dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalTitle = document.title;
    const cardTitle = `${customer.businessName || `${customer.firstName} ${customer.lastName}`} | Digital Visiting Card`;
    document.title = cardTitle;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', cardTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && customer.headline) {
      ogDesc.setAttribute('content', customer.headline);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [customer.businessName, customer.firstName, customer.lastName, customer.headline]);

  const [currentThemeId, setCurrentThemeId] = useState<MiniWebsiteThemeId>(customer.themeId || 'royal-indigo');
  const [selectedProduct, setSelectedProduct] = useState<ProductService | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [submittedWaUrl, setSubmittedWaUrl] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showThemeBar, setShowThemeBar] = useState(true);
  const [inactiveToast, setInactiveToast] = useState<string | null>(null);

  const showInactiveToast = (msg?: string) => {
    setInactiveToast(
      msg || 'Card Activation Pending — Please Make Payment. All actions, sharing, and downloads remain locked until payment is verified.'
    );
    setTimeout(() => setInactiveToast(null), 4000);
  };

  // Lightbox state for product image viewing with swipe support
  const [lightboxProduct, setLightboxProduct] = useState<ProductService | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const openProductLightbox = (product: ProductService, index: number = 0) => {
    setLightboxProduct(product);
    setLightboxImageIndex(index);
  };

  const closeProductLightbox = () => {
    setLightboxProduct(null);
    setLightboxImageIndex(0);
    setTouchStartX(null);
  };

  const handleNextLightboxImage = () => {
    if (!lightboxProduct) return;
    if (lightboxProduct.imageUrl2) {
      setLightboxImageIndex((prev) => (prev === 0 ? 1 : 0));
    }
  };

  const handlePrevLightboxImage = () => {
    if (!lightboxProduct) return;
    if (lightboxProduct.imageUrl2) {
      setLightboxImageIndex((prev) => (prev === 1 ? 0 : 1));
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeProductLightbox();
      } else if (e.key === 'ArrowRight') {
        handleNextLightboxImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevLightboxImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxProduct]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !lightboxProduct) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNextLightboxImage();
    } else if (diff < -45) {
      handlePrevLightboxImage();
    }
    setTouchStartX(null);
  };

  // Testimonial submission state for customers/visitors
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewAuthor, setReviewAuthor] = useState<string>('');
  const [reviewRole, setReviewRole] = useState<string>('Verified Customer');
  const [reviewContent, setReviewContent] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewContent.trim()) return;

    setReviewSubmitting(true);
    const sanitizedReview = sanitizeTestimonialInput({
      author: reviewAuthor.trim(),
      role: reviewRole.trim() || 'Verified Customer',
      content: reviewContent.trim(),
      rating: reviewRating,
    });

    const result = addTestimonialToCustomer(customer.id, sanitizedReview);

    if (result) {
      setCustomer(result.updatedCustomer);
      onUpdateCustomer?.(result.updatedCustomer);
      setReviewSuccess('Thank you! Your testimonial and star review has been posted.');
      setTimeout(() => {
        setReviewSuccess(null);
        setShowReviewModal(false);
        setReviewAuthor('');
        setReviewContent('');
        setReviewRating(5);
        setReviewRole('Verified Customer');
      }, 1500);
    }
    setReviewSubmitting(false);
  };

  const handleDeleteTestimonial = (testimonialId: string) => {
    if (window.confirm('Are you sure you want to delete this testimonial? It will be removed from your digital card.')) {
      const updatedTestimonials = (customer.testimonials || []).filter((t) => t.id !== testimonialId);
      const updatedCustomer: Customer = {
        ...customer,
        testimonials: updatedTestimonials,
      };
      setCustomer(updatedCustomer);
      onUpdateCustomer?.(updatedCustomer);
      addOrUpdateStoredCustomer(updatedCustomer);
    }
  };

  // UPI Payment Modal State & Launch Helpers
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [upiModalAmount, setUpiModalAmount] = useState<string | number>('');
  const [upiModalNote, setUpiModalNote] = useState<string>('');
  const [cardCopiedUpi, setCardCopiedUpi] = useState<boolean>(false);

  const cleanedCardUpiId = cleanUpiId(customer.upiId);
  const payeeDisplayName = customer.businessName || `${customer.firstName} ${customer.lastName}`;
  const universalCardUpiUri = cleanedCardUpiId
    ? generateUpiUri(
        {
          upiId: cleanedCardUpiId,
          payeeName: payeeDisplayName,
          note: `Payment to ${payeeDisplayName}`,
        },
        'all'
      )
    : '';

  const openUpiPaymentModal = (amount?: string | number, note?: string) => {
    if (customer.status !== 'active') {
      showInactiveToast('Payments will be enabled once your digital card is activated by the admin.');
      return;
    }
    setUpiModalAmount(amount || '');
    setUpiModalNote(note || `Payment to ${customer.businessName || customer.firstName}`);
    setShowUpiModal(true);
  };

  const handlePayViaUpiClick = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    if (customer.status !== 'active') {
      showInactiveToast('Payments will be enabled once your digital card is activated by the admin.');
      return;
    }

    if (!cleanedCardUpiId) {
      showInactiveToast('UPI ID is not configured by the merchant.');
      return;
    }

    // Opens UPI modal with PhonePe, Paytm, Google Pay, BHIM, All Apps & QR
    openUpiPaymentModal();
  };

  const handleCopyCardUpi = async () => {
    if (!customer.upiId) return;
    try {
      await navigator.clipboard.writeText(customer.upiId);
      setCardCopiedUpi(true);
      setTimeout(() => setCardCopiedUpi(false), 2200);
    } catch {
      setCardCopiedUpi(false);
    }
  };

  // Sync theme if customer profile updates
  useEffect(() => {
    if (customer.themeId) {
      setCurrentThemeId(customer.themeId);
    }
  }, [customer.themeId]);

  const theme = getMiniWebsiteTheme(currentThemeId);
  const isCardLive = isDemo || (customer.status === 'active' && customer.isPaid);

  // Check if active & paid
  if (standalone && !isOwnerPreview && !isCardLive) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center relative z-20">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center border border-amber-500/40 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Card Activation Pending</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This digital visiting card is currently not live. The business owner must complete activation payment before this card can be publicly viewed or shared.
          </p>
        </div>
      </div>
    );
  }

  // Construct absolute URL for this mini card using custom slug if available
  const effectiveSlug = getCustomerSlug(customer);
  const cardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?card=${effectiveSlug}`
    : `https://visitingcard.pro?card=${effectiveSlug}`;

  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
  const cleanWhatsApp = formatWhatsAppNumber(customer.whatsappNumber || customer.phone);

  const fullAddressString = [
    customer.address.shopNumber,
    customer.address.areaLocality,
    customer.address.landmark ? `Near ${customer.address.landmark}` : '',
    `${customer.address.city}, ${customer.address.state} ${customer.address.pincode}`,
  ].filter(Boolean).join(', ');

  const sanitizedQuery = `${customer.businessName || ''} ${fullAddressString}`
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawGoogleMapsUrl = customer.address.googleMapsUrl?.trim();
  const googleMapsUrl = rawGoogleMapsUrl
    ? sanitizeSafeUrl(rawGoogleMapsUrl, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sanitizedQuery)}`)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sanitizedQuery)}`;

  // Meta Tags for sharing preview when standalone
  useEffect(() => {
    if (standalone && customer) {
      document.title = `${customer.firstName} ${customer.lastName} - ${customer.businessName}`;
      
      const metaOgTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
      metaOgTitle.setAttribute('property', 'og:title');
      metaOgTitle.setAttribute('content', `${customer.firstName} ${customer.lastName} - ${customer.businessName}`);
      document.head.appendChild(metaOgTitle);

      const metaOgDesc = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
      metaOgDesc.setAttribute('property', 'og:description');
      metaOgDesc.setAttribute('content', customer.headline);
      document.head.appendChild(metaOgDesc);

      const imageUrl = customer.logoUrl || customer.avatarUrl;
      if (imageUrl) {
        const metaOgImage = document.querySelector('meta[property="og:image"]') || document.createElement('meta');
        metaOgImage.setAttribute('property', 'og:image');
        metaOgImage.setAttribute('content', imageUrl);
        document.head.appendChild(metaOgImage);
      }
    }
  }, [standalone, customer]);

  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    if (!isCardLive) {
      showInactiveToast('Card Activation Pending: Sharing is locked until payment is verified.');
      return;
    }
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    if (!isCardLive) {
      showInactiveToast('Card Activation Pending: Link copying is locked until payment is verified.');
      return;
    }
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || (!inquiryEmail.trim() && !inquiryPhone.trim())) return;
    
    const currentName = inquiryName.trim();
    const currentEmail = inquiryEmail.trim();
    const currentPhone = inquiryPhone.trim();
    const currentMessage = inquiryMessage.trim() || 'Requested consultation/information via mini website.';
    const currentProduct = selectedProduct;

    const cleanInquiry = sanitizeInquiryInput({
      customerId: customer.id,
      customerBusinessName: customer.businessName,
      senderName: currentName,
      senderEmail: currentEmail,
      senderPhone: currentPhone,
      message: currentMessage,
      serviceInterested: currentProduct?.title || undefined,
    });

    // 1. Save locally with atomic isolation
    const savedInquiry = addInquiry(cleanInquiry);

    // 2. Attach to customer record and sync to Supabase Cloud silently in background
    try {
      const updatedCustomer: Customer = {
        ...customer,
        inquiriesCount: (customer.inquiriesCount || 0) + 1,
        inquiries: [savedInquiry, ...(customer.inquiries || [])],
        updatedAt: new Date().toISOString(),
      };

      addOrUpdateStoredCustomer(updatedCustomer);
      if (onUpdateCustomer) {
        onUpdateCustomer(updatedCustomer);
      }
      upsertCustomerToSupabase(updatedCustomer).catch(() => {});
    } catch (err) {
      console.warn('Silent inquiry cloud sync notification:', err);
    }

    // 3. Prepare WhatsApp Message & Official E.164 Deep Link
    let waUrl = '';
    if (cleanWhatsApp) {
      const waText = `Hi ${customer.firstName},\n\nI just visited your Mini Website and I'm interested in your services.\n\n*My Details:*\nName: ${currentName}\nPhone: ${currentPhone || 'Not provided'}\nEmail: ${currentEmail || 'Not provided'}\n\n*Message:*\n${currentMessage}${currentProduct ? `\n\n*Interested In:*\n${currentProduct.title}` : ''}`;
      
      waUrl = generateWhatsAppUrl(cleanWhatsApp, waText);
      setSubmittedWaUrl(waUrl);
    }

    setInquirySuccess(true);
    setInquiryName('');
    setInquiryEmail('');
    setInquiryPhone('');
    setInquiryMessage('');
    setSelectedProduct(null);

    // 4. Launch WhatsApp redirect smoothly without triggering popup blockers or invalid number errors
    if (waUrl) {
      launchWhatsAppUrl(waUrl);
    }

    setTimeout(() => {
      setInquirySuccess(false);
      setSubmittedWaUrl(null);
    }, 12000);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.pageBg} ${theme.pageBgDark} ${standalone ? 'py-6 px-3 sm:px-6' : 'py-3 px-2'} relative overflow-x-hidden transition-colors duration-500`}>
      {/* Ambient Glowing Orbs customized with Theme Colors */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-65 animate-float-slow transition-all duration-700"
          style={{ backgroundColor: theme.orbColor1 }}
        />
        <div
          className="absolute top-1/3 -left-32 w-80 h-80 rounded-full blur-3xl opacity-50 animate-float-reverse transition-all duration-700"
          style={{ backgroundColor: theme.orbColor2 }}
        />
        <div
          className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-45 animate-float-slow transition-all duration-700"
          style={{ backgroundColor: theme.orbColor3 }}
        />
      </div>

      {/* Top Banner if previewing as Owner or in Standalone mode */}
      {!isDemo && isOwnerPreview && onBackToPortal && (
        <div className="max-w-xl mx-auto mb-4 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs shadow-md relative z-20">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Interactive Live Customer Preview Mode</span>
          </div>
          <button
            onClick={onBackToPortal}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium"
          >
            Back to Editor
          </button>
        </div>
      )}

      {/* Main Mini-Website Card Container (Mobile-first responsive frame) */}
      <main className="max-w-xl mx-auto glass-panel rounded-3xl shadow-2xl border border-white/60 dark:border-white/15 overflow-hidden transition-all relative z-10">
        
        {/* Banner Graphic with Glass Overlay */}
        <div className={`relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r ${theme.bannerGradient} transition-all duration-500`}>
          {customer.bannerUrl ? (
            <img
              src={customer.bannerUrl}
              alt={`${customer.businessName} cover`}
              className="w-full h-full object-cover opacity-80 filter saturate-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}

          {/* Quick status badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="glass-panel px-3 py-1 rounded-full text-xs font-medium text-slate-800 dark:text-slate-100 shadow-sm flex items-center gap-1.5 border border-white/40 dark:border-white/15">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.previewColors[0] }}></span>
              {customer.businessCategory}
            </span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setShowQRModal(true)}
              title="Show QR Code"
              className="p-2 rounded-full glass-panel hover:scale-105 active:scale-95 text-slate-800 dark:text-slate-100 transition-all shadow-sm border border-white/40 dark:border-white/15"
              aria-label="Show QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              title="Share Card"
              className="p-2 rounded-full glass-panel hover:scale-105 active:scale-95 text-slate-800 dark:text-slate-100 transition-all shadow-sm border border-white/40 dark:border-white/15"
              aria-label="Share Mini Website"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Header Block */}
        <div className="relative px-5 sm:px-7 pt-0 pb-6">
          {customer.status !== 'active' && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-bold">Pending Admin Activation (Inactive):</span> Public access, sharing, link copying, and .vcf downloads are locked until activated in Admin Panel.
              </div>
            </div>
          )}

          {/* Avatar & Logo Floating Cluster */}
          <div className="relative -mt-16 sm:-mt-20 mb-4 flex items-end justify-between">
            <div className="relative group">
              <img
                src={customer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={`${customer.firstName} ${customer.lastName}`}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover ring-4 ring-white/90 dark:ring-slate-900/90 shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white dark:ring-slate-900" title="Verified Business">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Business Logo Pill if present */}
            {customer.logoUrl && (
              <div className="glass-panel p-2 rounded-2xl shadow-lg border border-white/60 dark:border-white/15 mb-1">
                <img
                  src={customer.logoUrl}
                  alt={`${customer.businessName} logo`}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* Name & Identity */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {customer.firstName} {customer.lastName}
              </h1>
              {customer.isPaid && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${theme.accentBadge} glass-badge px-2.5 py-0.5 rounded-full border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 shadow-2xs`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Verified Business • {customer.planTier === '999_3yr' ? '3 Years Subscription' : '1 Year Subscription'}</span>
                </span>
              )}
            </div>

            <p className={`text-sm sm:text-base font-semibold ${theme.accentText} ${theme.accentTextDark}`}>
              {customer.jobTitle} <span className="text-slate-400 dark:text-slate-500 font-normal">at</span> {customer.businessName}
            </p>

            {customer.testimonials && customer.testimonials.length > 0 ? (
              <a
                href="#card-testimonials"
                className="inline-flex items-center gap-1 mt-0.5 mb-1 group cursor-pointer"
                title="View customer ratings and reviews"
              >
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 ml-1">
                  {(
                    customer.testimonials.reduce((acc, t) => acc + (t.rating || 5), 0) /
                    customer.testimonials.length
                  ).toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 ml-1 group-hover:underline">
                  ({customer.testimonials.length} reviews)
                </span>
              </a>
            ) : (
              <a
                href="#card-testimonials"
                className="inline-flex items-center gap-1 mt-0.5 mb-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Leave the first customer review</span>
              </a>
            )}

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium pt-0.5">
              "{customer.headline}"
            </p>

            {/* Location & Status Badge - Displays exact storefront address entered by the profile owner */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <a
                href={customer.status === 'active' ? googleMapsUrl : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (customer.status !== 'active') {
                    e.preventDefault();
                    showInactiveToast('Card Pending Activation: Google Maps directions are disabled until activated by Admin.');
                  }
                }}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-medium transition-colors"
                title="Open address in Google Maps"
              >
                {formatCardLocation(customer.address)}
              </a>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                Open for Inquiries
              </span>
            </div>
          </div>

          {/* Dynamic Grid: Action Buttons + Social Links */}
          <div className="pt-6 space-y-3">
            {/* Primary Action Buttons Grid */}
            <div className={`grid ${customer.upiId ? 'grid-cols-3 sm:grid-cols-7' : 'grid-cols-3 sm:grid-cols-6'} gap-2`}>
              {/* 1. Save Contact (vCard) */}
              <button
                onClick={() => {
                  if (customer.status !== 'active') {
                    showInactiveToast('Card Pending Activation: .vcf contact download is disabled until activated by Admin.');
                    return;
                  }
                  downloadVCard(customer);
                }}
                className={`flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl ${theme.primaryBtn} shadow-lg active:scale-95 transition-all text-center group min-w-0 ${
                  customer.status !== 'active' ? 'opacity-70 saturate-50' : ''
                }`}
                title={customer.status !== 'active' ? 'Disabled until activated by Admin' : 'Download Digital vCard'}
              >
                <UserPlus className="w-5 h-5 mb-1 text-white group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[11px] font-bold leading-tight truncate max-w-full px-1">Save Contact</span>
              </button>

              {/* 2. Call */}
              <a
                href={customer.status === 'active' ? `tel:${cleanPhone}` : '#'}
                onClick={(e) => {
                  if (customer.status !== 'active') {
                    e.preventDefault();
                    showInactiveToast('Card Pending Activation: Phone calls are disabled until activated by Admin.');
                  }
                }}
                className="flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-all text-center group border border-white/60 dark:border-white/10 min-w-0"
                title={customer.status !== 'active' ? 'Disabled until activated by Admin' : 'Call Business'}
              >
                <Phone className="w-5 h-5 mb-1 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[11px] font-bold leading-tight">Call</span>
              </a>

              {/* 3. WhatsApp */}
              <a
                href={customer.status === 'active' ? (generateWhatsAppUrl(
                  cleanWhatsApp,
                  `Hi ${customer.firstName}, I came across your Mini Website and would like to inquire about your services.`
                ) || '#') : '#'}
                onClick={(e) => {
                  if (customer.status !== 'active') {
                    e.preventDefault();
                    showInactiveToast('Card Pending Activation: WhatsApp messaging is disabled until activated by Admin.');
                  }
                }}
                target={customer.status === 'active' ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-all text-center group border border-white/60 dark:border-white/10 min-w-0"
                title={customer.status !== 'active' ? 'Disabled until activated by Admin' : 'Chat on WhatsApp'}
              >
                <MessageCircle className="w-5 h-5 mb-1 text-green-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[11px] font-bold leading-tight">WhatsApp</span>
              </a>

              {/* 4. Pay via UPI Tile (Same size as other action tiles) */}
              {customer.upiId && (
                <button
                  type="button"
                  id="tile-pay-upi-btn"
                  onClick={handlePayViaUpiClick}
                  className="flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl glass-card hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-all text-center group border border-emerald-500/30 dark:border-emerald-500/20 min-w-0 no-underline cursor-pointer"
                  title={customer.status !== 'active' ? 'Disabled until activated by Admin' : 'Pay via UPI (PhonePe, Paytm, Google Pay, BHIM)'}
                >
                  <IndianRupee className="w-5 h-5 mb-1 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-[11px] font-bold leading-tight text-emerald-700 dark:text-emerald-400">
                    Pay UPI
                  </span>
                </button>
              )}

              {/* 5. Email */}
              <a
                href={customer.status === 'active' ? `mailto:${customer.email}?subject=${encodeURIComponent(
                  `Inquiry via Mini Website - ${customer.businessName}`
                )}` : '#'}
                onClick={(e) => {
                  if (customer.status !== 'active') {
                    e.preventDefault();
                    showInactiveToast('Card Pending Activation: Email inquiry is disabled until activated by Admin.');
                  }
                }}
                className="flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-all text-center group border border-white/60 dark:border-white/10 min-w-0"
                title={customer.status !== 'active' ? 'Disabled until activated by Admin' : 'Send Email'}
              >
                <Mail className="w-5 h-5 mb-1 text-blue-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[11px] font-bold leading-tight">Email</span>
              </a>

              {/* 6. Get Directions */}
              <a
                href={customer.status === 'active' ? googleMapsUrl : '#'}
                onClick={(e) => {
                  if (customer.status !== 'active') {
                    e.preventDefault();
                    showInactiveToast('Card Pending Activation: Navigation directions are disabled until activated by Admin.');
                  }
                }}
                target={customer.status === 'active' ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-all text-center group border border-white/60 dark:border-white/10 min-w-0"
                title={customer.status !== 'active' ? 'Disabled until activated by Admin' : 'Open Google Maps Directions'}
              >
                <MapPin className="w-5 h-5 mb-1 text-rose-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[11px] font-bold leading-tight">Directions</span>
              </a>

              {/* 7. Share */}
              <button
                onClick={handleShare}
                className={`${
                  customer.upiId ? 'col-span-3 sm:col-span-1 flex-row sm:flex-col gap-1.5 sm:gap-0' : 'col-span-1 flex-col'
                } flex items-center justify-center py-2.5 sm:py-3 px-2 sm:px-1.5 rounded-2xl glass-card hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95 transition-all text-center group border border-white/60 dark:border-white/10 min-w-0`}
                title="Share Mini Website"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 sm:mb-1 text-amber-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="text-[11px] font-bold leading-tight">Share</span>
              </button>
            </div>

            {/* Quick Social Links Pills/Row if present */}
            {(() => {
              const socials = getCustomerSocialAccounts(customer);
              if (socials.length === 0) return null;

              return (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar pt-1">
                  {socials.map((account) => {
                    const platformName = account.platform.charAt(0).toUpperCase() + account.platform.slice(1).replace('_', ' ');
                    return (
                      <a
                        key={account.id}
                        href={sanitizeSafeUrl(account.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-100 shadow-xs active:scale-95 transition-all border border-white/60 dark:border-white/10 flex-shrink-0 text-xs font-semibold group"
                        title={account.title || platformName}
                      >
                        <span className="group-hover:scale-110 transition-transform">
                          {getSocialPlatformIcon(account.platform, 'w-4 h-4')}
                        </span>
                        <span className="whitespace-nowrap">{platformName}</span>
                      </a>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Section: Concise Business Introduction */}
        <div className="px-5 sm:px-7 py-5 border-t border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2.5">
            <Store className={`w-4 h-4 ${theme.accentText} ${theme.accentTextDark}`} />
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
              About Our Business
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {customer.bio}
          </p>
        </div>

        {/* Section: Products or Services Portfolio */}
        {customer.products && customer.products.length > 0 && (
          <div className="px-5 sm:px-7 py-5 border-t border-white/50 dark:border-white/10">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${theme.accentText} ${theme.accentTextDark}`} />
                <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
                  Featured Products & Services
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {customer.products.length} {customer.products.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-3.5">
              {customer.products.map((product) => {
                const hasImages = Boolean(product.imageUrl || product.imageUrl2);
                const hasTwoImages = Boolean(product.imageUrl && product.imageUrl2);

                return (
                  <div
                    key={product.id}
                    className="glass-card rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3.5 hover:shadow-xl transition-all border border-white/60 dark:border-white/10 group min-w-0"
                  >
                    {hasImages && (
                      <div
                        onClick={() => openProductLightbox(product, 0)}
                        className="relative w-full sm:w-28 h-36 sm:h-28 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 group/img bg-slate-100 dark:bg-slate-800 select-none"
                        title="Tap to enlarge photo (Swipe left/right)"
                      >
                        <img
                          src={product.imageUrl || product.imageUrl2}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hover/Tap Zoom indicator */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-1.5 rounded-full bg-black/60 text-white backdrop-blur-xs flex items-center gap-1 text-[10px] font-medium">
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Enlarge</span>
                          </span>
                        </div>

                        {/* Multi-photo badge */}
                        {hasTwoImages && (
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 text-[9px] text-white font-bold backdrop-blur-xs flex items-center gap-1 shadow-sm">
                            <span>2 Photos</span>
                            <span>•</span>
                            <span>Swipe</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => hasImages && openProductLightbox(product, 0)}
                            className={`font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug break-words ${
                              hasImages ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400' : ''
                            }`}
                          >
                            {product.title}
                          </h3>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full glass-badge ${theme.accentBadge} text-xs font-bold whitespace-nowrap flex-shrink-0`}>
                            {product.price}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {product.category && (
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium truncate max-w-[110px]">
                              {product.category}
                            </span>
                          )}
                          {hasImages && (
                            <button
                              type="button"
                              onClick={() => openProductLightbox(product, 0)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>View {hasTwoImages ? 'Photos (2)' : 'Photo'}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-wrap sm:flex-nowrap justify-end">
                          {customer.upiId && (
                            <button
                              type="button"
                              onClick={() => openUpiPaymentModal(product.price, `Payment for ${product.title}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 flex-shrink-0"
                              title={`Pay ${product.price} via UPI`}
                            >
                              <span>Pay UPI</span>
                            </button>
                          )}

                          <a
                            href={generateWhatsAppUrl(
                              cleanWhatsApp,
                              `Hi ${customer.firstName}, I am interested in ordering/inquiring about: "${product.title}" (${product.price}).`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-colors flex-shrink-0"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product);
                              const inquiryElem = document.getElementById('card-inquiry-form');
                              inquiryElem?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium ${theme.primaryBtn} transition-all shadow-sm flex-shrink-0`}
                          >
                            <span>{product.ctaText || 'Inquire'}</span>
                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section: Digital Contact Details & Business Hours */}
        <div className="px-5 sm:px-7 py-5 border-t border-white/50 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className={`w-4 h-4 ${theme.accentText} ${theme.accentTextDark}`} />
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
              Contact & Business Hours
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Phone */}
            <a
              href={`tel:${cleanPhone}`}
              className="glass-card p-3 rounded-2xl flex items-center gap-3 border border-white/60 dark:border-white/10 hover:shadow-md transition-all"
            >
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Phone className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] text-slate-400">Phone Number</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{customer.phone}</div>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${customer.email}`}
              className="glass-card p-3 rounded-2xl flex items-center gap-3 border border-white/60 dark:border-white/10 hover:shadow-md transition-all"
            >
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] text-slate-400">Email Address</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{customer.email}</div>
              </div>
            </a>

            {/* Address */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-3 rounded-2xl flex items-start gap-3 border border-white/60 dark:border-white/10 hover:shadow-md transition-all sm:col-span-2"
            >
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Physical Address</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {[customer.address.shopNumber, customer.address.areaLocality].filter(Boolean).join(', ') || customer.address.city}
                </div>
                {customer.address.landmark && (
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Landmark: {customer.address.landmark}
                  </div>
                )}
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {[
                    [customer.address.city, customer.address.state].filter(Boolean).join(', '),
                    customer.address.pincode ? `- ${customer.address.pincode}` : ''
                  ].filter(Boolean).join(' ')}
                </div>
              </div>
            </a>

            {/* Hours */}
            {customer.businessHours && (
              <div className="glass-card p-3 rounded-2xl flex items-start gap-3 border border-white/60 dark:border-white/10 sm:col-span-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Operating Hours</div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                    {customer.businessHours}
                  </div>
                </div>
              </div>
            )}

            {/* Website / Digital Profile Card */}
            {(customer.websiteUrl || getCustomerCardUrl(customer)) && (
              <a
                href={sanitizeSafeUrl(customer.websiteUrl || getCustomerCardUrl(customer))}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-3 rounded-2xl flex items-center gap-3 border border-white/60 dark:border-white/10 hover:shadow-md transition-all sm:col-span-2 cursor-pointer no-underline"
              >
                <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.iconText} border border-white/20`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-[11px] text-slate-400">
                    {customer.websiteUrl && customer.websiteUrl !== getCustomerCardUrl(customer)
                      ? 'Official Website'
                      : 'Digital Profile Card Link'}
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate font-mono text-xs">
                    {customer.websiteUrl || getCustomerCardUrl(customer)}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>

        {/* Section: Social Media Accounts & Profile Cards */}
        {(() => {
          const socialAccounts = getCustomerSocialAccounts(customer);
          if (socialAccounts.length === 0) return null;

          return (
            <div className="px-5 sm:px-7 py-5 border-t border-white/50 dark:border-white/10">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Share2 className={`w-4 h-4 ${theme.accentText} ${theme.accentTextDark}`} />
                  <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
                    Social Media & Profiles
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {socialAccounts.length} {socialAccounts.length === 1 ? 'account' : 'accounts'}
                </span>
              </div>

              {/* Grid of Bento-style Small Card Thumbnails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {socialAccounts.map((account) => (
                  <SocialCardWidget
                    key={account.id}
                    account={account}
                    defaultAvatar={customer.avatarUrl}
                    isEditable={false}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Section: Testimonials & Trust Indicators with Public Submission */}
        <div id="card-testimonials" className="px-5 sm:px-7 py-5 border-t border-white/50 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
                Customer Reviews & Trust
              </h2>
            </div>
            
            {!isDemo && (
              <button
                type="button"
                onClick={() => setShowReviewModal((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showReviewModal ? 'Close Form' : 'Write a Review'}</span>
              </button>
            )}
          </div>

          {/* Average Rating Summary Banner */}
          {customer.testimonials && customer.testimonials.length > 0 && (
            <div className="mb-4 p-3 rounded-2xl glass-card border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {(
                    customer.testimonials.reduce((acc, t) => acc + (t.rating || 5), 0) /
                    customer.testimonials.length
                  ).toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Based on {customer.testimonials.length} customer {customer.testimonials.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Verified</span>
              </div>
            </div>
          )}

          {/* Interactive Review Submission Form */}
          {showReviewModal && (
            <form
              onSubmit={handleSubmitReview}
              className="mb-5 p-4 sm:p-5 rounded-2xl glass-card border-2 border-amber-500/30 shadow-lg space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Give Feedback to {customer.businessName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Star Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Rating:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= (reviewHoverRating || reviewRating);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setReviewRating(starValue)}
                        onMouseEnter={() => setReviewHoverRating(starValue)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                    {reviewRating === 5 && '5.0 - Excellent!'}
                    {reviewRating === 4 && '4.0 - Very Good'}
                    {reviewRating === 3 && '3.0 - Good'}
                    {reviewRating === 2 && '2.0 - Fair'}
                    {reviewRating === 1 && '1.0 - Poor'}
                  </span>
                </div>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Reviewer Role or Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your City or Relationship (Optional)
                </label>
                <input
                  type="text"
                  value={reviewRole}
                  onChange={(e) => setReviewRole(e.target.value)}
                  placeholder="e.g. Customer from Mumbai, Regular Client"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Testimonial / Experience <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Tell new customers about the quality of service, turnaround time, or customer satisfaction..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              {reviewSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewAuthor.trim() || !reviewContent.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{reviewSubmitting ? 'Posting...' : 'Post Testimonial'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Testimonial List or Friendly Empty State */}
          {customer.testimonials && customer.testimonials.length > 0 ? (
            <div className="space-y-3">
              {customer.testimonials.map((test) => (
                <div
                  key={test.id}
                  className="glass-card p-4 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(test.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Verified Client
                      </span>
                      {isOwnerPreview && !isDemo && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonial(test.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/15 hover:text-rose-600 transition-colors"
                          title="Delete this testimonial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 italic mb-3 leading-relaxed">
                    "{test.content}"
                  </p>

                  <div className="flex items-center gap-2.5">
                    {test.avatarUrl ? (
                      <img
                        src={test.avatarUrl}
                        alt={test.author}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/50"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                        {test.author ? test.author[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {test.author}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {test.role} {test.company ? `• ${test.company}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 rounded-2xl glass-card border border-white/60 dark:border-white/10">
              <Star className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Be the first to leave a review!
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 max-w-xs mx-auto">
                Have you worked with or purchased from {customer.businessName}? Share your rating and feedback.
              </p>
              {!isDemo && (
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-sm hover:bg-amber-600 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write First Review</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Section: Direct Inquiry / Contact Form */}
        <div id="card-inquiry-form" className="px-5 sm:px-7 py-6 border-t border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Send className={`w-4 h-4 ${theme.accentText} ${theme.accentTextDark}`} />
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
              Share Your Contact / Send Inquiry
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Share your contact number or leave a message for {customer.firstName} to receive a fast response.
          </p>

          {selectedProduct && (
            <div className="mb-3.5 p-3 rounded-2xl glass-card border border-indigo-500/30 flex items-center justify-between text-xs">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                Inquiring regarding: <strong>{selectedProduct.title}</strong> ({selectedProduct.price})
              </span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-200 underline font-semibold"
              >
                Clear
              </button>
            </div>
          )}

          {inquirySuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Inquiry Sent Successfully!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Thank you! {customer.firstName} {customer.lastName} has received your inquiry details.
                  </p>
                </div>
              </div>

              {submittedWaUrl && (
                <div className="pt-2.5 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-200 font-medium">
                    Redirecting to WhatsApp chat with merchant...
                  </span>
                  <a
                    href={submittedWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => launchWhatsAppUrl(submittedWaUrl)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 no-underline cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open WhatsApp Chat Now</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Your Requirements / Message</label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={`Describe what you are looking for or preferred times to meet/talk...`}
                  className="glass-input"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl ${theme.primaryBtn} font-semibold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry Instantly</span>
              </button>
            </form>
          )}
        </div>

        {/* Section: Receive Payments / QR */}
        {(customer.paymentQrUrl || customer.upiId) && (
          <div className="px-5 sm:px-7 py-6 border-t border-white/50 dark:border-white/10 text-center flex flex-col items-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Sparkles className={`w-4 h-4 ${theme.accentText} ${theme.accentTextDark}`} />
              <h2 className="text-sm uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">
                Receive & Make Payments
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
              Instant bank-to-bank payment to {customer.businessName || `${customer.firstName} ${customer.lastName}`} via any UPI App.
            </p>

            {/* Main "PAY VIA UPI APPS" Action Link / Button and Quick Shortcuts */}
            {customer.upiId && (
              <div className="w-full max-w-md space-y-2.5 mb-4">
                <button
                  type="button"
                  id="section-pay-upi-btn"
                  onClick={handlePayViaUpiClick}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-between group border border-emerald-400/30 cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-base shadow-xs flex-shrink-0">
                      ₹
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>PAY VIA UPI APPS</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-white/25 text-white">
                          PhonePe • Paytm • GPay
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-100 font-normal block">
                        Direct payment via PhonePe, Paytm, Google Pay, BHIM & more
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ml-2 flex-shrink-0" />
                </button>

                {/* Direct App Shortcut Buttons for Quick 1-Tap Payment */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => openUpiPaymentModal('', `Payment to ${customer.businessName || customer.firstName}`)}
                    className="p-2.5 rounded-2xl bg-[#5f259f]/10 hover:bg-[#5f259f]/20 border border-[#5f259f]/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer group shadow-2xs"
                    title="Pay with PhonePe"
                  >
                    <span className="w-7 h-7 rounded-xl bg-[#5f259f] text-white flex items-center justify-center text-xs font-black shadow-xs group-hover:scale-105 transition-transform">
                      पे
                    </span>
                    <span className="text-[11px] font-bold text-[#5f259f] dark:text-purple-300">PhonePe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openUpiPaymentModal('', `Payment to ${customer.businessName || customer.firstName}`)}
                    className="p-2.5 rounded-2xl bg-[#002970]/10 hover:bg-[#002970]/20 border border-[#002970]/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer group shadow-2xs"
                    title="Pay with Paytm"
                  >
                    <span className="w-7 h-7 rounded-xl bg-[#002970] text-cyan-400 flex items-center justify-center text-[10px] font-black shadow-xs group-hover:scale-105 transition-transform">
                      Paytm
                    </span>
                    <span className="text-[11px] font-bold text-[#002970] dark:text-blue-300">Paytm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openUpiPaymentModal('', `Payment to ${customer.businessName || customer.firstName}`)}
                    className="p-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer group shadow-2xs"
                    title="Pay with Google Pay"
                  >
                    <span className="w-7 h-7 rounded-xl bg-white text-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black shadow-xs group-hover:scale-105 transition-transform">
                      G
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-300">GPay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openUpiPaymentModal()}
                    className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer group shadow-2xs"
                    title="Scan UPI QR"
                  >
                    <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform my-0.5" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Scan QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment QR Code (Custom or fallback) */}
            {customer.paymentQrUrl && (
              <div className="mb-4">
                <img
                  src={customer.paymentQrUrl}
                  alt="Payment QR Code"
                  className="w-44 h-44 mx-auto rounded-2xl object-cover shadow-lg border-2 border-white/60 dark:border-white/10"
                  referrerPolicy="no-referrer"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Scan with camera or UPI scanner to pay</p>
              </div>
            )}
            
            {/* Copyable UPI ID Box */}
            {customer.upiId && (
              <div className="w-full max-w-md flex flex-col items-center gap-2">
                <div className="w-full glass-card px-4 py-2.5 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-between shadow-xs">
                  <div className="text-left overflow-hidden mr-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">UPI ID:</span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {customer.upiId}
                    </span>
                  </div>
                  <button
                    id="copy-card-upi-btn"
                    type="button"
                    onClick={handleCopyCardUpi}
                    className="p-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer flex-shrink-0"
                    title="Copy UPI ID"
                  >
                    {cardCopiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{cardCopiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Subtle helper link to enter custom amount or scan dynamic QR */}
                <button
                  type="button"
                  onClick={() => openUpiPaymentModal()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-1 flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Enter Custom Amount & View Dynamic QR</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section: QR Code Sharing Footer Card */}
        <div className="px-5 sm:px-7 py-6 border-t border-white/50 dark:border-white/10 text-center">
          <QRCodeDisplay
            url={cardUrl}
            title="Scan QR Code to Share or Save"
            subtitle="Point smartphone camera to save contact or share with prospective clients instantly."
            size={180}
            isActive={customer.status === 'active'}
          />
        </div>

        {/* Footer Brand Credit & Verified Member Badge */}
        <div className="p-4 text-center glass-panel border-t border-white/40 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>Powered by <strong>BIO Website</strong></span>
            {customer.isPaid && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Active Member ({customer.planTier === '999_3yr' ? '3 Years Plan' : '1 Year Plan'})</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.pathname);
              }
              if (onBackToPortal) {
                onBackToPortal();
              }
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
          >
            Create Your Own Mini Website →
          </button>
        </div>
      </main>

      {/* Inactive Toast Notification */}
      {inactiveToast && (
        <div className="fixed bottom-6 inset-x-4 max-w-sm mx-auto z-50 py-3 px-4 rounded-2xl bg-amber-500/95 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-amber-400 animate-in fade-in slide-in-from-bottom-2">
          <span>⚠️</span>
          <span>{inactiveToast}</span>
        </div>
      )}

      {/* Share & QR Hub Modal */}
      <ShareModal
        isOpen={showShareModal || showQRModal}
        onClose={() => {
          setShowShareModal(false);
          setShowQRModal(false);
        }}
        customer={customer}
        cardUrl={cardUrl}
      />

      {/* UPI Payment Modal (All Apps & Dynamic QR) */}
      <UpiPaymentModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        customer={customer}
        initialAmount={upiModalAmount}
        initialNote={upiModalNote}
        theme={theme}
      />

      {/* Product Image Lightbox & Swipe Modal */}
      {lightboxProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={closeProductLightbox}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Title, Price and Close Button */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-slate-900/90 backdrop-blur-md z-10">
              <div className="min-w-0 pr-3">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {lightboxProduct.title}
                </h3>
                <span className="text-xs text-indigo-400 font-semibold">
                  {lightboxProduct.price}
                </span>
              </div>
              <button
                type="button"
                onClick={closeProductLightbox}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Stage with Touch Swipe */}
            <div
              className="relative bg-black/95 flex items-center justify-center min-h-[260px] sm:min-h-[340px] max-h-[55vh] select-none overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={
                  lightboxImageIndex === 1 && lightboxProduct.imageUrl2
                    ? lightboxProduct.imageUrl2
                    : (lightboxProduct.imageUrl || lightboxProduct.imageUrl2)
                }
                alt={`${lightboxProduct.title} - View ${lightboxImageIndex + 1}`}
                className="max-h-[52vh] max-w-full w-auto object-contain transition-all duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next Arrow Buttons if 2 images exist */}
              {lightboxProduct.imageUrl && lightboxProduct.imageUrl2 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevLightboxImage();
                    }}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/65 hover:bg-black/85 text-white transition-transform active:scale-90 border border-white/20 shadow-lg"
                    title="Previous Photo (Left Arrow or Swipe)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextLightboxImage();
                    }}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/65 hover:bg-black/85 text-white transition-transform active:scale-90 border border-white/20 shadow-lg"
                    title="Next Photo (Right Arrow or Swipe)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Touch Swipe and Photo Count Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/75 text-white/90 text-[10px] font-semibold border border-white/20 flex items-center gap-1.5 backdrop-blur-xs shadow-md">
                    <span>Photo {lightboxImageIndex + 1} of 2</span>
                    <span>•</span>
                    <span>Swipe Left / Right</span>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Selectors if 2 images exist */}
            {lightboxProduct.imageUrl && lightboxProduct.imageUrl2 && (
              <div className="flex items-center justify-center gap-2.5 p-2 bg-slate-950 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setLightboxImageIndex(0)}
                  className={`w-14 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                    lightboxImageIndex === 0
                      ? 'border-indigo-500 scale-105 shadow-md ring-2 ring-indigo-400'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={lightboxProduct.imageUrl}
                    alt="Photo 1"
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxImageIndex(1)}
                  className={`w-14 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                    lightboxImageIndex === 1
                      ? 'border-indigo-500 scale-105 shadow-md ring-2 ring-indigo-400'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={lightboxProduct.imageUrl2}
                    alt="Photo 2"
                    className="w-full h-full object-cover"
                  />
                </button>
              </div>
            )}

            {/* Product Details & Direct WhatsApp Inquire */}
            <div className="p-4 bg-slate-900 border-t border-white/10 space-y-3">
              {lightboxProduct.description && (
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {lightboxProduct.description}
                </p>
              )}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap sm:flex-nowrap">
                {customer.upiId && (
                  <button
                    type="button"
                    onClick={() => {
                      openUpiPaymentModal(lightboxProduct.price, `Payment for ${lightboxProduct.title}`);
                      closeProductLightbox();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Pay {lightboxProduct.price} via UPI</span>
                  </button>
                )}
                <a
                  href={generateWhatsAppUrl(
                    cleanWhatsApp,
                    `Hi ${customer.firstName}, I saw "${lightboxProduct.title}" (${lightboxProduct.price}) on your digital card and would like to order/inquire.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={closeProductLightbox}
                  className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden element for Image Generation (WhatsApp Share) */}
      <div 
        id="share-capture-card" 
        className="fixed left-[-9999px] top-0 w-[400px] bg-[#0F172A] p-5 text-left rounded-3xl font-sans"
        style={{ zIndex: -100 }}
      >
        <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-900 border border-white/10">
          {customer.bannerUrl && (
            <img
              src={customer.bannerUrl}
              alt={customer.businessName}
              className="w-full h-full object-cover opacity-80"
              crossOrigin="anonymous"
            />
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
              {customer.businessCategory}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        <div className="relative flex items-start gap-3 -mt-16 mb-4 px-2">
          <img
            src={customer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
            alt={customer.firstName}
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#0F172A] shadow-lg flex-shrink-0 bg-slate-800"
            crossOrigin="anonymous"
          />
          <div className="pt-10">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-bold text-white leading-tight">
                {customer.firstName} {customer.lastName}
              </h3>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-[13px] font-semibold text-indigo-400 mt-0.5">
              {customer.jobTitle}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-[220px]">
              {customer.businessName}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 italic mb-5 px-2">
          "{customer.headline}"
        </p>

        <div className="grid grid-cols-4 gap-3 mb-5 px-1">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white text-center shadow-lg">
            <UserPlus className="w-5 h-5 mx-auto mb-1" />
            <span className="text-[10px] font-bold block">Save</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 text-white border border-white/10 text-center">
            <Phone className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
            <span className="text-[10px] font-bold block">Call</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 text-white border border-white/10 text-center">
            <MessageCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <span className="text-[10px] font-bold block">WhatsApp</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 text-white border border-white/10 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-rose-500" />
            <span className="text-[10px] font-bold block">Map</span>
          </div>
        </div>

        {customer.products?.[0] && (
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-white/10 flex items-center gap-3 mb-5 mx-1 shadow-md">
            <img
              src={customer.products[0].imageUrl}
              alt=""
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              crossOrigin="anonymous"
            />
            <div className="overflow-hidden flex-1">
              <div className="font-semibold text-white text-sm truncate mb-1">
                {customer.products[0].title}
              </div>
              <div className="text-xs text-indigo-400 font-bold">
                {customer.products[0].price}
              </div>
            </div>
          </div>
        )}

        <div className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-[13px] flex items-center justify-center gap-2 mx-1 shadow-xl">
          <span>Preview Full Customer Experience</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
