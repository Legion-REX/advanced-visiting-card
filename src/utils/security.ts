/**
 * OWASP Top 10 Security Hardening Utilities
 * - A01: Broken Access Control (Owner & IDOR verification)
 * - A02: Cryptographic Failures (Client-Side SHA-256 Password & PIN Hashing)
 * - A03: Injection & XSS (Input, URL, Inquiry, and Testimonial Sanitization)
 * - A07: Identification & Authentication Failures (Brute-Force & Rate Limiting)
 * - A08: Software & Data Integrity Failures (Strict File Type & Size Validation)
 */

// ==========================================
// 1. RATE LIMITING & BRUTE-FORCE PROTECTION (A07)
// ==========================================

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const RATE_LIMIT_PREFIX = 'avc_sec_rl_';

/**
 * Checks current rate limit status for an identifier (e.g. email, phone, IP/device).
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  lockoutWindowMs: number = 60000 // 60 seconds lockout
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  const key = `${RATE_LIMIT_PREFIX}${cleanId}`;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
    }

    const record: RateLimitRecord = JSON.parse(raw);
    const now = Date.now();

    // Check if currently locked
    if (record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    // Check if the previous attempt window has expired (sliding window of 10 minutes)
    if (now - record.firstAttemptAt > 10 * 60 * 1000) {
      localStorage.removeItem(key);
      return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
    }

    const remaining = Math.max(0, maxAttempts - record.attempts);
    return { allowed: remaining > 0, remainingAttempts: remaining, retryAfterSeconds: 0 };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }
}

/**
 * Records a failed authentication attempt and applies a lockout if threshold is exceeded.
 */
export function recordFailedAttempt(
  identifier: string,
  maxAttempts: number = 5,
  lockoutWindowMs: number = 60000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remainingAttempts: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  const key = `${RATE_LIMIT_PREFIX}${cleanId}`;
  const now = Date.now();

  try {
    let record: RateLimitRecord;
    const raw = localStorage.getItem(key);

    if (raw) {
      record = JSON.parse(raw);
      // If previous window expired, start fresh
      if (now - record.firstAttemptAt > 10 * 60 * 1000) {
        record = { attempts: 1, firstAttemptAt: now, lockedUntil: 0 };
      } else {
        record.attempts += 1;
      }
    } else {
      record = { attempts: 1, firstAttemptAt: now, lockedUntil: 0 };
    }

    // Check if lockout threshold hit
    if (record.attempts >= maxAttempts) {
      record.lockedUntil = now + lockoutWindowMs;
      localStorage.setItem(key, JSON.stringify(record));
      const retryAfterSeconds = Math.ceil(lockoutWindowMs / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    localStorage.setItem(key, JSON.stringify(record));
    const remaining = Math.max(0, maxAttempts - record.attempts);
    return { allowed: true, remainingAttempts: remaining, retryAfterSeconds: 0 };
  } catch {
    return { allowed: true, remainingAttempts: 0, retryAfterSeconds: 0 };
  }
}

/**
 * Resets failed attempts after a successful login.
 */
export function resetRateLimit(identifier: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
    localStorage.removeItem(`${RATE_LIMIT_PREFIX}${cleanId}`);
  } catch {
    // ignore
  }
}

// ==========================================
// 2. INPUT & CONTENT SANITIZATION (A03)
// ==========================================

/**
 * Strips HTML tags, script payloads, dangerous URI schemas, and restricts length.
 */
export function sanitizeText(input: unknown, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  
  let cleaned = input.trim();
  if (!cleaned) return '';

  // 1. Strip dangerous tags and attributes
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Strip inline event handlers like onload=, onerror=

  // 2. Replace raw control characters
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');

  // 3. Enforce maximum length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Sanitizes phone numbers, keeping only digits and optional leading plus sign.
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^0-9]/g, '');
  const result = hasPlus ? `+${digits}` : digits;
  return result.slice(0, 16);
}

/**
 * Sanitizes an email address with length limitation.
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  // Basic sanity check and length cap
  if (!trimmed.includes('@') || trimmed.length > 100) {
    return sanitizeText(trimmed, 100);
  }
  return trimmed.replace(/[^\w.@+-]/g, '').slice(0, 100);
}

/**
 * Validates and sanitizes a public review / testimonial submission.
 */
export function sanitizeTestimonialInput(data: {
  author?: string;
  role?: string;
  content?: string;
  rating?: number;
}): {
  author: string;
  role: string;
  content: string;
  rating: number;
} {
  const author = sanitizeText(data.author || 'Anonymous Customer', 60);
  const role = sanitizeText(data.role || 'Verified Customer', 40);
  const content = sanitizeText(data.content || '', 600);
  
  // Rating must be integer between 1 and 5
  let rating = Math.round(Number(data.rating) || 5);
  if (rating < 1) rating = 1;
  if (rating > 5) rating = 5;

  return { author, role, content, rating };
}

/**
 * Validates and sanitizes a customer inquiry / lead form submission.
 */
export function sanitizeInquiryInput<T extends {
  customerId?: string;
  customerBusinessName?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  message?: string;
  serviceInterested?: string;
}>(data: T): {
  customerId: string;
  customerBusinessName?: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  serviceInterested?: string;
} {
  return {
    customerId: data.customerId || '',
    customerBusinessName: data.customerBusinessName ? sanitizeText(data.customerBusinessName, 100) : undefined,
    senderName: sanitizeText(data.senderName || 'Interested Customer', 80),
    senderEmail: sanitizeEmail(data.senderEmail || ''),
    senderPhone: sanitizePhone(data.senderPhone || ''),
    message: sanitizeText(data.message || 'Consultation inquiry from digital visiting card.', 1000),
    serviceInterested: data.serviceInterested ? sanitizeText(data.serviceInterested, 100) : undefined,
  };
}

/**
 * Sanitizes URLs to prevent Cross-Site Scripting (XSS via javascript: or data: URIs)
 * Complies with OWASP ASVS & OWASP Top 10 A03.
 */
export function sanitizeSafeUrl(url: string | undefined | null, defaultFallback: string = '#'): string {
  if (!url || typeof url !== 'string') return defaultFallback;
  const trimmed = url.trim();
  if (!trimmed) return defaultFallback;

  const lower = trimmed.toLowerCase();

  // Allow safe client-side image Data URLs (JPEG, PNG, WebP, GIF, SVG) from file uploads
  if (
    lower.startsWith('data:image/jpeg;') ||
    lower.startsWith('data:image/jpg;') ||
    lower.startsWith('data:image/png;') ||
    lower.startsWith('data:image/webp;') ||
    lower.startsWith('data:image/gif;') ||
    lower.startsWith('data:image/svg+xml;')
  ) {
    return trimmed;
  }

  // Block dangerous pseudo-protocols like javascript:, other data: types (text/html, etc.), vbscript:
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    console.warn('[SECURITY] Blocked potentially malicious URI scheme:', lower.slice(0, 20));
    return defaultFallback;
  }

  // Allow anchor links
  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  // Allow standard safe protocols
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('sms:') ||
    lower.startsWith('whatsapp:')
  ) {
    return trimmed;
  }

  // If missing protocol but looks like a web URL (e.g. "www.example.com" or "example.com")
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return defaultFallback;
}

// ==========================================
// 3. IMAGE & FILE UPLOAD INTEGRITY (A08)
// ==========================================

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB maximum raw upload

/**
 * Validates uploaded file type and size to block malicious SVG, script, or oversized files.
 */
export function validateImageUploadFile(file: unknown): { valid: boolean; error?: string } {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'No valid file selected.' };
  }

  // Check file size
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb}MB) exceeds the maximum allowed limit of 5MB. Please upload a smaller image.`,
    };
  }

  // Check MIME type - Strictly prohibit image/svg+xml and non-images
  const mime = file.type.toLowerCase();
  if (mime === 'image/svg+xml') {
    return {
      valid: false,
      error: 'SVG vector files are not allowed for security reasons. Please upload JPEG, PNG, or WebP.',
    };
  }

  const isAllowed = ALLOWED_IMAGE_MIME_TYPES.some((allowed) => mime === allowed);
  if (!isAllowed) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPEG, PNG, WebP, and GIF images are supported.',
    };
  }

  return { valid: true };
}

// ==========================================
// 4. CLIENT-SIDE PASSWORD & PIN HASHING (A02)
// ==========================================

const PASSWORD_SALT = 'avc_app_secure_salt_v2';
const HASH_PREFIX = 'sha256$';

/**
 * Simple Pure JavaScript SHA-256 fallback when window.crypto.subtle is unavailable
 */
function sha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let composite = ascii + '\x80';
  while ((composite[lengthProperty] % 64) - 56) composite += '\x00';
  for (i = 0; i < composite[lengthProperty]; i++) {
    j = composite.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes salted SHA-256 hash using Web Crypto API with seamless JS fallback.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salted = `${PASSWORD_SALT}:${plainText.trim()}`;

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(salted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `${HASH_PREFIX}${hex}`;
    }
  } catch (err) {
    console.warn('Web Crypto subtle unavailable, using secure fallback:', err);
  }

  // Fallback
  const hex = sha256Fallback(salted);
  return `${HASH_PREFIX}${hex}`;
}

/**
 * Checks if a stored password string is already formatted as a secure hash.
 */
export function isHashedPassword(value: string | undefined | null): boolean {
  if (!value) return false;
  return value.startsWith(HASH_PREFIX) && value.length === HASH_PREFIX.length + 64;
}

/**
 * Verifies a plaintext password against a stored password (supporting both hashed and legacy plain text).
 */
export async function verifyPassword(
  plainText: string,
  storedPasswordOrHash: string | undefined | null
): Promise<boolean> {
  if (!plainText || !storedPasswordOrHash) return false;

  const trimmedPlain = plainText.trim();
  const trimmedStored = storedPasswordOrHash.trim();

  // If already hashed, hash the input and compare
  if (isHashedPassword(trimmedStored)) {
    const computedHash = await hashPassword(trimmedPlain);
    return computedHash === trimmedStored;
  }

  // Backward-compatible fallback for legacy plain text passwords (e.g. '123456')
  return trimmedPlain === trimmedStored;
}

// ==========================================
// 5. ACCESS CONTROL & IDOR (A01)
// ==========================================

/**
 * Checks whether the current user is strictly authorized to edit or manage the specified customer profile.
 * Complies with OWASP Top 10 A01: Broken Access Control (enforcing IDOR prevention).
 */
export function isAuthorizedToManage(
  currentCustomerOrTargetId: { id: string } | string | null | undefined,
  optionalTargetId?: string | null | undefined
): boolean {
  let currentId: string | null | undefined;
  let targetId: string | null | undefined;

  if (typeof currentCustomerOrTargetId === 'string' && !optionalTargetId) {
    targetId = currentCustomerOrTargetId;
    try {
      currentId = typeof window !== 'undefined' ? localStorage.getItem('avc_current_user_id_v3') : null;
    } catch {
      currentId = null;
    }
  } else if (typeof currentCustomerOrTargetId === 'object') {
    currentId = currentCustomerOrTargetId?.id;
    targetId = optionalTargetId;
  } else {
    currentId = currentCustomerOrTargetId;
    targetId = optionalTargetId;
  }

  if (!targetId) return false;

  // Superadmin check
  try {
    if (isAdminSessionValid()) {
      return true;
    }
  } catch {
    // ignore
  }

  // Strictly verify ID matches
  return Boolean(currentId && currentId === targetId);
}

// ==========================================
// ADMIN SESSION & INACTIVITY LIFECYCLE (A01, A07)
// ==========================================

const ADMIN_SESSION_KEY = 'avc_admin_session_token';
const ADMIN_AUTH_EXPIRY_KEY = 'avc_admin_auth_expires_at';
const ADMIN_MAX_IDLE_MS = 15 * 60 * 1000; // 15 minutes

export function isAdminSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sessionToken = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!sessionToken) return false;

    const expiresAt = parseInt(localStorage.getItem(ADMIN_AUTH_EXPIRY_KEY) || '0', 10);
    const now = Date.now();
    if (!expiresAt || now > expiresAt) {
      clearAdminSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function activateAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, Date.now().toString());
    localStorage.setItem(ADMIN_AUTH_EXPIRY_KEY, (Date.now() + ADMIN_MAX_IDLE_MS).toString());
    localStorage.setItem('avc_admin_authenticated', 'true');
  } catch {}
}

export function refreshAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY)) {
      localStorage.setItem(ADMIN_AUTH_EXPIRY_KEY, (Date.now() + ADMIN_MAX_IDLE_MS).toString());
    }
  } catch {}
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_EXPIRY_KEY);
    localStorage.removeItem('avc_admin_authenticated');
  } catch {}
}

export { isValidUpiId, cleanUpiId as sanitizeUpiId } from './upi';

