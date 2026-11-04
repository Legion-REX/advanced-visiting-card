/**
 * Supabase Cloud Storage Client (Native REST)
 * 
 * Ye file aapke BIO Website platform ko Supabase Cloud Database se jodti hai.
 * Customers ka data cloud me sync hota hai taaki koi bhi Incognito ya mobile
 * se digital visiting card link khole toh card instantly open ho!
 */

import { Customer } from '../types';
import { cleanSlug, isCustomerMatchingTarget } from './slug';

export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://uvzhsaianjxidzejrcwu.supabase.co'
).trim().replace(/\/$/, '');

export const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2emhzYWlhbmp4aWR6ZWpyY3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzODkzNTMsImV4cCI6MjEwNDk2NTM1M30.Cc88-OrHbCfqrCAeJDErNTaRW6WOD04ZsHRqZvbFXR4'
).trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
});

/**
 * Resilient fetch with automatic abort timeout for mobile/flaky networks
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  // If client is completely offline, fail fast to preserve 0ms local storage UX
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Client is offline');
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Generate a standard UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Converts any customer ID (including legacy cust-1, cust-1726...) into a valid RFC4122 UUID
 * for Supabase table compatibility without throwing 400 'invalid input syntax for type uuid'.
 */
export function toValidUuid(id: string): string {
  if (!id) return generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();

  let h1 = 0xdeadbeef >>> 0;
  let h2 = 0x41c6ce57 >>> 0;
  let h3 = 0x6a09e667 >>> 0;
  let h4 = 0xbb67ae85 >>> 0;

  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i);
    h1 = (Math.imul(h1 ^ code, 2654435761) + code) >>> 0;
    h2 = (Math.imul(h2 ^ code, 1597334677) + (code << 3)) >>> 0;
    h3 = (Math.imul(h3 ^ code, 2246822507) + (code << 7)) >>> 0;
    h4 = (Math.imul(h4 ^ code, 3266489909) + (code << 11)) >>> 0;
  }

  const s1 = h1.toString(16).padStart(8, '0');
  const s2 = h2.toString(16).padStart(8, '0');
  const s3 = h3.toString(16).padStart(8, '0');
  const s4 = h4.toString(16).padStart(8, '0');
  const raw = (s1 + s2 + s3 + s4).slice(0, 32).toLowerCase();

  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

/**
 * Cloud se saare customers fetch karna
 */
export async function fetchCustomersFromSupabase(): Promise<Customer[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/customers?select=*`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.warn('Supabase fetch returned non-200:', res.status, res.statusText);
      return null;
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) return null;

    // Har row ke data column ya direct fields ko Customer format me return karna
    const list: Customer[] = rows.map((row: any) => {
      if (row.data && typeof row.data === 'object') {
        return {
          ...row.data,
          id: row.data.id || row.id,
          businessName: row.data.businessName || row.business_name || 'Business',
          phone: row.data.phone || row.phone || '',
          email: row.data.email || row.email || '',
        };
      }
      return {
        id: row.id,
        businessName: row.business_name || 'Business',
        phone: row.phone || '',
        email: row.email || '',
        ...row,
      } as Customer;
    });

    // Newest first sort
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  } catch (err: any) {
    // Graceful offline fallback: Never treat network latency or offline status as a fatal app crash
    console.warn('[SUPABASE_OFFLINE] Serving instant cache from LocalStorage (Cloud unreachable or offline):', err?.message || err);
    return null;
  }
}

/**
 * Customer ka card Supabase cloud me save/update karna (Upsert)
 * Validated against existing Supabase schema: id (uuid), business_name, phone, email, data (jsonb)
 */
export async function upsertCustomerToSupabase(customer: Customer): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const dbId = toValidUuid(customer.id);
    // Ensure aliases are tracked for versatile link & QR resolution
    const existingAliases = Array.isArray(customer.aliases) ? [...customer.aliases] : [];
    const bLower = (customer.businessName || '').toLowerCase();
    if (bLower.includes('j7') || bLower.includes('jack')) {
      if (!existingAliases.includes('jack7jones')) existingAliases.push('jack7jones');
      if (!existingAliases.includes('j7jones')) existingAliases.push('j7jones');
      if (!existingAliases.includes('jack-7-jones')) existingAliases.push('jack-7-jones');
      if (!existingAliases.includes('j-7-jones')) existingAliases.push('j-7-jones');
    }

    const payload = {
      id: dbId,
      business_name: customer.businessName || 'Business',
      phone: customer.phone || null,
      email: customer.email || null,
      data: {
        ...customer,
        aliases: existingAliases,
        id: customer.id,
        supabase_id: dbId,
      },
    };

    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Supabase upsert note:', res.status, errText);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('[SUPABASE_OFFLINE] Background save queued locally:', err?.message || err);
    return false;
  }
}

/**
 * Customer ko Supabase se delete karna
 */
export async function deleteCustomerFromSupabase(customerId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const dbId = toValidUuid(customerId);
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/customers?id=eq.${encodeURIComponent(dbId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return res.ok;
  } catch (err: any) {
    console.warn('[SUPABASE_OFFLINE] Delete synced locally:', err?.message || err);
    return false;
  }
}

/**
 * Lookup a customer in Supabase cloud by slug, ID, business name, or phone number
 * Includes automatic retry for mobile latency and cold Supabase instances
 */
export async function findCustomerInSupabase(lookupTarget: string, retryCount = 1): Promise<Customer | null> {
  if (!isSupabaseConfigured || !lookupTarget) return null;

  try {
    const cleanTarget = lookupTarget.trim().toLowerCase();

    let cloudCustomers = await fetchCustomersFromSupabase();
    if ((!cloudCustomers || cloudCustomers.length === 0) && retryCount > 0) {
      // Small graceful backoff delay (600ms) for cold Supabase instance or 4G mobile latency
      await new Promise((res) => setTimeout(res, 600));
      cloudCustomers = await fetchCustomersFromSupabase();
    }

    if (!cloudCustomers || cloudCustomers.length === 0) return null;

    let matched = cloudCustomers.find((c) => isCustomerMatchingTarget(c, cleanTarget));

    // If not matched on first pass, retry once after a short delay in case card was just created seconds ago
    if (!matched && retryCount > 0) {
      await new Promise((res) => setTimeout(res, 700));
      const freshList = await fetchCustomersFromSupabase();
      matched = (freshList || []).find((c) => isCustomerMatchingTarget(c, cleanTarget));
    }

    return matched || null;
  } catch (err: any) {
    console.warn('[SUPABASE_OFFLINE] Search using high-speed local index:', err?.message || err);
    return null;
  }
}

/**
 * Background auto-sync for locally created and updated customers to Supabase cloud
 */
export async function syncLocalCustomersToSupabase(localCustomers: Customer[]): Promise<void> {
  if (!isSupabaseConfigured || !localCustomers || localCustomers.length === 0) return;

  try {
    const cloudList = await fetchCustomersFromSupabase();
    // Index cloud records by both id and slug for 0(1) lookup
    const cloudMap = new Map<string, Customer>();
    (cloudList || []).forEach((c) => {
      if (c.id) cloudMap.set(c.id.toLowerCase(), c);
      if (c.slug) cloudMap.set(c.slug.toLowerCase(), c);
    });

    for (const local of localCustomers) {
      const localId = (local.id || '').toLowerCase();
      const localSlug = (local.slug || '').toLowerCase();
      const cloudMatch = cloudMap.get(localId) || (localSlug ? cloudMap.get(localSlug) : undefined);

      if (!cloudMatch) {
        // Customer exists locally but not in cloud -> push immediately
        await upsertCustomerToSupabase(local);
      } else {
        // Customer exists in cloud -> check if local has newer edits
        const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        const cloudUpdated = cloudMatch.updatedAt ? new Date(cloudMatch.updatedAt).getTime() : 0;

        const isModified =
          localUpdated > cloudUpdated ||
          local.status !== cloudMatch.status ||
          local.isPaid !== cloudMatch.isPaid ||
          local.phone !== cloudMatch.phone ||
          local.upiId !== cloudMatch.upiId ||
          (local.products?.length || 0) !== (cloudMatch.products?.length || 0) ||
          (local.viewCount || 0) > (cloudMatch.viewCount || 0);

        if (isModified) {
          await upsertCustomerToSupabase(local);
        }
      }
    }
  } catch (err) {
    console.warn('Background sync note:', err);
  }
}

