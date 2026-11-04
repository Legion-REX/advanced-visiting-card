import { Customer } from '../types';

/**
 * Converts any business name or title into a URL-safe lowercase slug.
 * e.g. "Rajesh Royal Men's Salon & Grooming" -> "rajesh-royal-mens-salon-grooming"
 */
export function cleanSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // remove non-word chars
    .replace(/[\s_-]+/g, '-')     // collapse whitespace and underscores to hyphens
    .replace(/^-+|-+$/g, '');     // trim leading and trailing hyphens
}

/**
 * Returns the effective slug for a customer.
 */
export function getCustomerSlug(customer: Customer): string {
  if (customer.slug && customer.slug.trim()) {
    return cleanSlug(customer.slug);
  }
  const fromName = cleanSlug(customer.businessName);
  if (fromName) return fromName;
  return customer.id;
}

/**
 * Extracts a shop subdomain from the current window hostname if present.
 * e.g. "sharma-sweets.mydomain.com" -> "sharma-sweets"
 * Returns null if on standard platform hosts (localhost, run.app, vercel, etc.)
 */
export function getSubdomainFromHost(hostname: string): string | null {
  if (!hostname) return null;
  const lower = hostname.toLowerCase();

  // Ignored / host platforms
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower.endsWith('.run.app') ||
    lower.endsWith('.aistudio.com') ||
    lower.endsWith('.web.app') ||
    lower.endsWith('.firebaseapp.com') ||
    lower.endsWith('.vercel.app') ||
    lower === 'visitingcard.pro'
  ) {
    return null;
  }

  const parts = lower.split('.');
  // Check if at least 3 parts (e.g. sub.domain.com) and first part is not www or admin
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== 'www' && sub !== 'api' && sub !== 'app' && sub !== 'admin') {
      return sub;
    }
  }

  return null;
}

/**
 * Builds the canonical public card URL for a customer.
 */
export function getCustomerCardUrl(customer: Customer): string {
  const slug = getCustomerSlug(customer);
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/?card=${slug}`;
  }
  return `https://visitingcard.pro/?card=${slug}`;
}

/**
 * Checks if a customer matches a given target string (slug, handle, ID, phone, alias, etc.)
 */
export function isCustomerMatchingTarget(customer: Customer, rawTarget: string): boolean {
  if (!customer || !rawTarget) return false;

  const target = rawTarget.trim().toLowerCase();
  if (!target) return false;

  // Normalized without dashes, underscores or spaces
  const noDashTarget = target.replace(/[-_\s]+/g, '');
  const digitsOnly = target.replace(/[^0-9]/g, '');

  // 1. Direct ID & Supabase ID match
  const custId = (customer.id || '').toLowerCase();
  const supabaseId = ((customer as any).supabase_id || '').toLowerCase();
  if (custId === target || custId.replace(/[-_\s]+/g, '') === noDashTarget) return true;
  if (supabaseId && (supabaseId === target || supabaseId.replace(/[-_\s]+/g, '') === noDashTarget)) return true;

  // 2. Slug match (exact or dash-stripped)
  const custSlug = (customer.slug || '').toLowerCase();
  if (custSlug) {
    if (custSlug === target || custSlug.replace(/[-_\s]+/g, '') === noDashTarget) return true;
  }

  // 3. Aliases match
  if (Array.isArray(customer.aliases)) {
    for (const alias of customer.aliases) {
      const a = (alias || '').toLowerCase();
      if (a === target || a.replace(/[-_\s]+/g, '') === noDashTarget) return true;
    }
  }

  // 4. Business name slug & business name without non-alphanumeric
  const bSlug = cleanSlug(customer.businessName || '').toLowerCase();
  if (bSlug && (bSlug === target || bSlug.replace(/[-_\s]+/g, '') === noDashTarget)) return true;

  const bNormalized = (customer.businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (bNormalized && bNormalized === noDashTarget) return true;

  // 5. Common abbreviations (e.g. 'jack7jones' <-> 'j7jones', 'jack' <-> 'j' prefix before number)
  // 'jack7jones' -> 'j7jones'
  const jReplacedTarget = noDashTarget.replace(/^jack(?=\d|[a-z])/i, 'j');
  const jackReplacedTarget = noDashTarget.replace(/^j(?=\d)/i, 'jack');

  const allSlugsToCheck = [
    custSlug,
    bSlug,
    bNormalized,
    ...(customer.aliases || []).map(a => a.toLowerCase())
  ].filter(Boolean);

  for (const s of allSlugsToCheck) {
    const sNoDash = s.replace(/[-_\s]+/g, '');
    if (sNoDash === jReplacedTarget || sNoDash === jackReplacedTarget) return true;
    // Also if customer slug has 'jack' and target has 'j'
    const sWithJ = sNoDash.replace(/^jack(?=\d|[a-z])/i, 'j');
    const sWithJack = sNoDash.replace(/^j(?=\d)/i, 'jack');
    if (sWithJ === noDashTarget || sWithJack === noDashTarget) return true;
  }

  // 6. Phone number match (last 10 digits)
  const phoneDigits = (customer.phone || '').replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 10 && phoneDigits.endsWith(digitsOnly)) return true;

  // 7. Owner full name slug
  const ownerNameSlug = cleanSlug(`${customer.firstName || ''} ${customer.lastName || ''}`).toLowerCase();
  if (ownerNameSlug && (ownerNameSlug === target || ownerNameSlug.replace(/[-_\s]+/g, '') === noDashTarget)) return true;

  // 8. Email match (full email address or handle)
  const custEmail = (customer.email || '').toLowerCase();
  if (custEmail && custEmail === target) return true;
  const emailHandle = custEmail.split('@')[0]?.toLowerCase();
  if (emailHandle && (emailHandle === target || emailHandle.replace(/[-_\s]+/g, '') === noDashTarget)) return true;

  return false;
}
