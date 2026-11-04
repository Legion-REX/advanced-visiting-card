import { Customer, Inquiry, Testimonial } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_INQUIRIES } from '../data/initialData';
import { sanitizeTestimonialInput, sanitizeInquiryInput } from './security';

const CUSTOMERS_KEY = 'avc_customers_v3';
const CURRENT_USER_KEY = 'avc_current_user_id_v3';
const INQUIRIES_KEY = 'avc_inquiries_v2';
const THEME_KEY = 'avc_theme_v1';

// ============================================================================
// INTEGRATION POINTS ARCHITECTURE COMMENTS
// ============================================================================
// 1. FUTURE BACKEND API INTEGRATION POINT:
//    Replace the localStorage accessors below with asynchronous calls to your
//    Express / Node / Python / Go REST or GraphQL backend:
//    - GET    /api/v1/customers
//    - POST   /api/v1/customers (sign-up)
//    - PUT    /api/v1/customers/:id (profile update)
//    - DELETE /api/v1/customers/:id (super admin delete)
//    - POST   /api/v1/inquiries (contact form dispatch)
//
// 2. FUTURE AUTHENTICATION INTEGRATION POINT:
//    Integrate Firebase Auth, Supabase Auth, Auth0, or JWT sessions.
//    Replace `getCurrentUser()` and `setCurrentUser()` with:
//    `const { user, signIn, signOut } = useAuth();`
//
// 3. FUTURE FILE STORAGE INTEGRATION POINT:
//    When uploading profile pictures, business logos, product photos, or brand banners:
//    Replace data URIs / Unsplash URLs with direct pre-signed URL uploads to
//    Amazon S3, Google Cloud Storage, or Cloudinary:
//    `const uploadedUrl = await uploadToS3(file);`
//
// 4. FUTURE ANALYTICS INTEGRATION POINT:
//    Hook into customer view counts, vCard downloads, and contact clicks:
//    `analytics.track('vcard_downloaded', { customerId, businessCategory });`
//    `analytics.track('whatsapp_clicked', { customerId });`
//
// 5. FUTURE CUSTOM DOMAINS INTEGRATION POINT:
//    Support personalized domain names (e.g., card.johnsbarbershop.com):
//    Map CNAME records through Cloudflare for SaaS or Vercel Domain API.
// ============================================================================

const LEGACY_PRUNE_IDS = new Set([
  'cust-barber-01',
  'cust-men-02',
  'cust-women-03',
  'cust-advisor-04',
  'cust-pending-05',
]);

export function getStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      // Seed initial data with single testing customer
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    
    // Prune out old deleted demo accounts to keep Super Admin clean
    let filtered = parsed.filter((c: Customer) => !LEGACY_PRUNE_IDS.has(c.id));

    // Ensure the dedicated testing customer is always available
    const hasTestCustomer = filtered.some((c: Customer) => c.id === 'test-profile-01');
    if (!hasTestCustomer) {
      filtered = [INITIAL_CUSTOMERS[0], ...filtered];
    }

    // Sanitize and enforce uniform activation & payment rules across all accounts (old & new)
    const sanitized: Customer[] = filtered.map((c: Customer) => {
      const initMatch = INITIAL_CUSTOMERS.find((init) => init.id === c.id);
      const isPaid = c.isPaid === true || (typeof c.paymentAmount === 'number' && c.paymentAmount > 0);
      const paymentAmount = c.paymentAmount !== undefined ? c.paymentAmount : (isPaid ? 499 : 0);
      const status = c.status || (isPaid ? 'active' : 'inactive');

      return {
        ...c,
        isPaid,
        status,
        paymentAmount,
        paymentMethod: c.paymentMethod || (isPaid ? 'Razorpay' : undefined),
        paidAt: c.paidAt || (isPaid ? (c.createdAt || new Date().toISOString()) : undefined),
        planTier: c.planTier || '499_1yr',
        upiId: c.upiId || initMatch?.upiId || '',
        socialAccounts: Array.isArray(c.socialAccounts) ? c.socialAccounts : [],
        products: Array.isArray(c.products) ? c.products : [],
        testimonials: Array.isArray(c.testimonials) ? c.testimonials : [],
        address: c.address || {
          shopNumber: '',
          areaLocality: '',
          city: '',
          state: '',
          pincode: ''
        }
      };
    });

    // Save cleaned list if items were pruned or initialized
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch (error) {
    console.error('Failed to read customers from localStorage:', error);
    return INITIAL_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  if (!Array.isArray(customers)) {
    console.error('[STORAGE] Invalid customers payload passed to saveStoredCustomers');
    return;
  }
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    // Dispatch reactive internal event for instant cross-component synchronization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('avc_customers_updated', { detail: { count: customers.length } }));
    }
  } catch (error: any) {
    console.error('Failed to save customers to localStorage:', error);
    // Safe storage recovery for QuotaExceededError
    if (error?.name === 'QuotaExceededError' || error?.code === 22) {
      try {
        // Clear any old unused session storage to free up quota
        sessionStorage.clear();
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
      } catch (retryErr) {
        console.warn('LocalStorage quota critically full. Data maintained in memory and Cloud sync.', retryErr);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('avc_storage_quota_warning'));
        }
      }
    }
  }
}

export function addOrUpdateStoredCustomer(customer: Customer): Customer[] {
  if (!customer || !customer.id) return getStoredCustomers();
  const current = getStoredCustomers();
  const index = current.findIndex(c => c.id === customer.id);
  const nowIso = new Date().toISOString();
  
  const customerToSave: Customer = {
    ...customer,
    updatedAt: nowIso
  };

  let updated: Customer[];
  if (index >= 0) {
    // Preserve newer fields if concurrency happened
    updated = [...current];
    updated[index] = { ...updated[index], ...customerToSave };
  } else {
    updated = [customerToSave, ...current];
  }
  saveStoredCustomers(updated);
  return updated;
}

export function addTestimonialToCustomer(
  customerId: string,
  testimonial: Omit<Testimonial, 'id'>
): { updatedCustomer: Customer; allCustomers: Customer[] } | null {
  const current = getStoredCustomers();
  const index = current.findIndex(c => c.id === customerId);
  if (index === -1) return null;

  // OWASP A03: Input Sanitization against XSS & HTML Injection
  const cleanInput = sanitizeTestimonialInput(testimonial);

  const newTestimonial: Testimonial = {
    ...cleanInput,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  };

  const existingTestimonials = Array.isArray(current[index].testimonials)
    ? current[index].testimonials
    : [];

  const updatedCustomer: Customer = {
    ...current[index],
    testimonials: [newTestimonial, ...existingTestimonials],
  };

  const allCustomers = [...current];
  allCustomers[index] = updatedCustomer;
  saveStoredCustomers(allCustomers);

  return { updatedCustomer, allCustomers };
}

export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch {
    return null;
  }
}

export function setCurrentUserId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_USER_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('Failed to update current user ID:', error);
  }
}

export function getStoredInquiries(): Inquiry[] {
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    if (!raw) {
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(INITIAL_INQUIRIES));
      return INITIAL_INQUIRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.some((inq: Inquiry) => inq.senderName === 'David K.')) {
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(INITIAL_INQUIRIES));
      return INITIAL_INQUIRIES;
    }
    return parsed;
  } catch {
    return INITIAL_INQUIRIES;
  }
}

export function saveStoredInquiries(inquiries: Inquiry[]): void {
  try {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch (error) {
    console.error('Failed to save inquiries to localStorage:', error);
  }
}

export function addInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Inquiry {
  const inquiries = getStoredInquiries();
  
  // OWASP A03: Input Sanitization against XSS & HTML Injection
  const cleanInput = sanitizeInquiryInput(inquiry);

  const newInquiry: Inquiry = {
    ...cleanInput,
    id: `inq-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  
  const updated = [newInquiry, ...inquiries];
  saveStoredInquiries(updated);

  // Increment customer's inquiry count
  const customers = getStoredCustomers();
  const customerIndex = customers.findIndex(c => c.id === inquiry.customerId);
  if (customerIndex !== -1) {
    customers[customerIndex].inquiriesCount = (customers[customerIndex].inquiriesCount || 0) + 1;
    saveStoredCustomers(customers);
  }

  return newInquiry;
}

export function incrementCustomerView(customerId: string): void {
  const customers = getStoredCustomers();
  const customerIndex = customers.findIndex(c => c.id === customerId);
  if (customerIndex !== -1) {
    customers[customerIndex].viewCount = (customers[customerIndex].viewCount || 0) + 1;
    saveStoredCustomers(customers);
  }
}

export function getThemePreference(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
}
