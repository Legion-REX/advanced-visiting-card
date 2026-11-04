/**
 * UPI (Unified Payments Interface) Utilities for Indian Digital Payments
 * Compliant with NPCI UPI Linking Specifications and OWASP Injection Prevention.
 */

export interface UpiPaymentParams {
  upiId: string;
  payeeName: string;
  amount?: string | number;
  note?: string;
  transactionRef?: string;
}

export type UpiAppKey = 'all' | 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'amazonpay';

export interface UpiAppInfo {
  key: UpiAppKey;
  name: string;
  shortName: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badge?: string;
  iconName: string;
}

export const SUPPORTED_UPI_APPS: UpiAppInfo[] = [
  {
    key: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    bgColor: 'bg-[#5f259f] hover:bg-[#501e87]',
    textColor: 'text-white',
    borderColor: 'border-purple-600/40',
    badge: 'Fastest',
    iconName: 'PhonePe',
  },
  {
    key: 'paytm',
    name: 'Paytm UPI',
    shortName: 'Paytm',
    bgColor: 'bg-[#002970] hover:bg-[#002058]',
    textColor: 'text-white',
    borderColor: 'border-blue-900/40',
    badge: 'Popular',
    iconName: 'Paytm',
  },
  {
    key: 'gpay',
    name: 'Google Pay',
    shortName: 'GPay',
    bgColor: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750',
    textColor: 'text-slate-800 dark:text-slate-100',
    borderColor: 'border-slate-300 dark:border-slate-700',
    badge: 'Direct',
    iconName: 'GPay',
  },
  {
    key: 'bhim',
    name: 'BHIM UPI',
    shortName: 'BHIM',
    bgColor: 'bg-[#00793b] hover:bg-[#006631]',
    textColor: 'text-white',
    borderColor: 'border-green-700/40',
    badge: 'Govt NPCI',
    iconName: 'BHIM',
  },
  {
    key: 'all',
    name: 'All Installed UPI Apps',
    shortName: 'Any UPI App',
    bgColor: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700',
    textColor: 'text-white',
    borderColor: 'border-emerald-500/40',
    badge: 'Universal',
    iconName: 'Smartphone',
  },
];

/**
 * Validates UPI ID format (e.g. username@bank, 9876543210@paytm, business@okaxis)
 * Prevents URL parameter injection.
 */
export function isValidUpiId(upiId: string | undefined | null): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  const trimmed = upiId.trim();
  // Valid UPI IDs match username@handle where username can contain letters, numbers, dot, underscore, dash
  // Handle can be any bank handle like okaxis, okhdfcbank, ybl, paytm, ibl, sbi, etc.
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
  return upiRegex.test(trimmed);
}

/**
 * Cleans a UPI ID string
 */
export function cleanUpiId(upiId: string | undefined | null): string {
  if (!upiId || typeof upiId !== 'string') return '';
  return upiId.trim().replace(/\s+/g, '');
}

/**
 * Formats a clean amount string (e.g. "499" or "499.00" -> "499.00")
 */
export function formatUpiAmount(amount: string | number | undefined): string {
  if (!amount) return '';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return '';
  return num.toFixed(2);
}

/**
 * Builds a standard NPCI compliant UPI payment URI.
 * Handles app-specific schemes or standard universal upi:// scheme.
 */
export function generateUpiUri(
  params: UpiPaymentParams,
  appKey: UpiAppKey = 'all'
): string {
  const cleanId = cleanUpiId(params.upiId);
  if (!cleanId) return '';

  const payee = encodeURIComponent(params.payeeName.trim().slice(0, 99) || 'Merchant');
  const formattedAmt = formatUpiAmount(params.amount);
  const noteText = encodeURIComponent((params.note || `Payment to ${params.payeeName}`).trim().slice(0, 80));
  const tr = params.transactionRef ? `&tr=${encodeURIComponent(params.transactionRef)}` : '';
  const amtQuery = formattedAmt ? `&am=${formattedAmt}` : '';

  // Universal query string compliant with NPCI specification
  const queryString = `pa=${cleanId}&pn=${payee}${amtQuery}&cu=INR&tn=${noteText}${tr}`;

  switch (appKey) {
    case 'gpay':
      // Google Pay UPI Intent
      return `gpay://upi/pay?${queryString}`;
    case 'phonepe':
      // PhonePe UPI Intent
      return `phonepe://pay?${queryString}`;
    case 'paytm':
      // Paytm UPI Intent
      return `paytmmp://pay?${queryString}`;
    case 'bhim':
      // BHIM UPI Intent
      return `bhim://pay?${queryString}`;
    case 'cred':
      // CRED UPI Intent
      return `cred://pay?${queryString}`;
    case 'amazonpay':
      // Amazon Pay UPI Intent
      return `amazonpay://pay?${queryString}`;
    case 'all':
    default:
      // Universal standard upi:// scheme - Triggers OS native app chooser on Android/iOS
      return `upi://pay?${queryString}`;
  }
}

/**
 * Checks if the current client is a mobile device (Android, iPhone, etc.)
 */
export function isMobileUserAgent(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Triggers the UPI intent on the client device.
 * Uses multiple dispatch strategies to guarantee that mobile operating systems
 * (Android OS Intent Chooser / iOS UPI handler) intercept the upi:// deep link.
 */
export function launchUpiPayment(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false;

  // 1. Direct window location assignment (Standard, reliable handler for Android & iOS intent dispatch)
  try {
    window.location.href = url;
    return true;
  } catch (e) {
    console.warn('Direct window.location.href dispatch failed:', e);
  }

  // 2. Dynamic anchor element fallback
  try {
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      } catch {}
    }, 500);
    return true;
  } catch (err) {
    console.warn('Anchor trigger failed:', err);
    return false;
  }
}
