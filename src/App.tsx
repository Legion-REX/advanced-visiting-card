/**
 * Advanced Visiting Card / Strategic Mini Website
 * Main Application Component
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Customer, Inquiry, AppView } from './types';
import { DEMO_DUMMY_CUSTOMER } from './data/initialData';
import {
  getStoredCustomers,
  saveStoredCustomers,
  getCurrentUserId,
  setCurrentUserId,
  getStoredInquiries,
  incrementCustomerView,
  getThemePreference,
  saveThemePreference,
} from './utils/storage';
import {
  isSupabaseConfigured,
  fetchCustomersFromSupabase,
  upsertCustomerToSupabase,
  deleteCustomerFromSupabase,
  findCustomerInSupabase,
  syncLocalCustomersToSupabase,
} from './utils/supabaseClient';
import { Navbar } from './components/landing/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { ServicesSection } from './components/landing/ServicesSection';
import { AboutSection } from './components/landing/AboutSection';
import { ContactSection } from './components/landing/ContactSection';
import { Footer } from './components/landing/Footer';
import { CustomerAuth } from './components/auth/CustomerAuth';
import { CustomerPortal } from './components/portal/CustomerPortal';
import { MiniWebsiteView } from './components/card/MiniWebsiteView';
import { CardPendingActivationView } from './components/card/CardPendingActivationView';
import { SuperAdminPanel } from './components/admin/SuperAdminPanel';
import { GlassBackgroundOrbs } from './components/common/GlassBackgroundOrbs';
import { cleanSlug, getSubdomainFromHost, isCustomerMatchingTarget } from './utils/slug';
import { isAuthorizedToManage, isAdminSessionValid } from './utils/security';
import { ArrowLeft, CreditCard, Store, Loader2, Home, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [selectedCardCustomer, setSelectedCardCustomer] = useState<Customer | null>(null);
  const [notFoundIdentifier, setNotFoundIdentifier] = useState<string | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState<boolean>(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [autoOpenPaymentForNewUser, setAutoOpenPaymentForNewUser] = useState(false);

  // Initialize theme, data, and inspect URL query params (?card=id, ?admin=true, ?login=true)
  useEffect(() => {
    // 1. Theme initialization
    const initialTheme = getThemePreference();
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Data initialization
    const storedCustomers = getStoredCustomers();
    setCustomers(storedCustomers);

    // If Supabase credentials are configured in .env / Vercel, auto-sync local cards and fetch cloud database
    if (isSupabaseConfigured) {
      syncLocalCustomersToSupabase(storedCustomers);

      fetchCustomersFromSupabase().then((cloudCustomers) => {
        if (cloudCustomers && cloudCustomers.length > 0) {
          const currentLocal = getStoredCustomers();
          const cloudMap = new Map<string, Customer>();
          cloudCustomers.forEach(c => cloudMap.set(c.id, c));
          const merged: Customer[] = [...cloudCustomers];
          currentLocal.forEach(localC => {
            if (!cloudMap.has(localC.id)) {
              merged.unshift(localC);
            }
          });
          setCustomers(merged);
          saveStoredCustomers(merged);

          // OWASP A07 & Session Resilience: Restore active user session from fresh cloud data
          const savedId = getCurrentUserId();
          if (savedId) {
            const freshCustomer = merged.find((c) => c.id === savedId);
            if (freshCustomer) {
              setCurrentCustomer(freshCustomer);
            }
          }

          // If a card was being searched, verify against fresh cloud list
          if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            const target = (p.get('card') || p.get('shop') || p.get('s') || '').trim();
            if (target) {
              const matchedCloud = merged.find((c) => isCustomerMatchingTarget(c, target));
              if (matchedCloud) {
                setSelectedCardCustomer(matchedCloud);
                setNotFoundIdentifier(null);
                setIsLoadingCard(false);
                setView('public-card');
              }
            }
          }
        }
      }).catch((err) => {
        console.warn('[SUPABASE_INIT] Bypassing cloud init, serving from instant LocalStorage:', err?.message || err);
      });
    }

    const storedInquiries = getStoredInquiries();
    setInquiries(storedInquiries);

    // 3. User session restoration
    const savedUserId = getCurrentUserId();
    let hasRestoredCustomer = false;
    let matchedCustomer: Customer | null = null;
    if (savedUserId) {
      const matched = storedCustomers.find((c) => c.id === savedUserId);
      if (matched) {
        matchedCustomer = matched;
        setCurrentCustomer(matched);
        hasRestoredCustomer = true;
      }
    }

    // 4. Subdomain, Slug, and URL Query Parameters routing
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cardParam = params.get('card') || params.get('shop') || params.get('s');
      const adminParam = params.get('admin');
      const loginParam = params.get('login');
      const refParam = params.get('ref');

      // Check subdomain from hostname (e.g. shopname.yourdomain.com)
      const detectedSubdomain = getSubdomainFromHost(window.location.hostname);

      // Check path-based routing (e.g. /c/shopname or /shop/shopname)
      let pathSlug: string | null = null;
      const pathname = window.location.pathname;
      if (pathname.startsWith('/c/')) {
        pathSlug = pathname.replace('/c/', '').split('/')[0];
      } else if (pathname.startsWith('/shop/')) {
        pathSlug = pathname.replace('/shop/', '').split('/')[0];
      }

      const lookupTarget = (detectedSubdomain || cardParam || pathSlug || '').trim().toLowerCase();

      if (refParam) {
        sessionStorage.setItem('referral_code', refParam);
        try {
          localStorage.setItem('avc_pending_ref', refParam);
        } catch {
          // ignore storage quota errors
        }
      }

      if (lookupTarget) {
        if (lookupTarget === 'demo' || lookupTarget === 'demo-profile') {
          setSelectedCardCustomer(DEMO_DUMMY_CUSTOMER);
          setNotFoundIdentifier(null);
          setView('public-card');
          return;
        }

        const found = storedCustomers.find((c) => isCustomerMatchingTarget(c, lookupTarget));

        if (found) {
          setSelectedCardCustomer(found);
          setNotFoundIdentifier(null);
          setView('public-card');
          incrementCustomerView(found.id);
          return;
        } else if (isSupabaseConfigured) {
          // Cloud Lookup with loading indicator
          setIsLoadingCard(true);
          setView('public-card');
          findCustomerInSupabase(lookupTarget).then((cloudCustomer) => {
            setIsLoadingCard(false);
            if (cloudCustomer) {
              setSelectedCardCustomer(cloudCustomer);
              setNotFoundIdentifier(null);
              incrementCustomerView(cloudCustomer.id);
              const currentLocal = getStoredCustomers();
              const updated = [cloudCustomer, ...currentLocal.filter(c => c.id !== cloudCustomer.id)];
              setCustomers(updated);
              saveStoredCustomers(updated);
            } else {
              setNotFoundIdentifier(lookupTarget);
              setSelectedCardCustomer(null);
            }
          }).catch((err) => {
            console.warn('Cloud card lookup note:', err);
            setIsLoadingCard(false);
            setNotFoundIdentifier(lookupTarget);
            setSelectedCardCustomer(null);
          });
          return;
        } else if (detectedSubdomain || cardParam || pathSlug) {
          // Explicit card requested but not found
          setNotFoundIdentifier(lookupTarget);
          setSelectedCardCustomer(null);
          setView('public-card');
          return;
        }
      }

      if (
        adminParam === 'true' ||
        adminParam === 'secret' ||
        adminParam === 'portal' ||
        adminParam === '8287' ||
        params.has('superadmin') ||
        window.location.pathname === '/admin'
      ) {
        setView('admin');
        return;
      }

      // Check if user arrived via Supabase email confirmation link (#access_token=... or ?error=...)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=email'))) {
          // Clean the hash from the browser URL for clean UX
          window.history.replaceState(null, '', window.location.pathname);
          // Set to auth mode with a helpful success message
          setAuthMode('login');
          setView('auth');
        }
      }

      if (loginParam === 'true') {
        setAuthMode('login');
        setView('auth');
        return;
      }

      // If user is already authenticated and no override param is present, restore view
      if (hasRestoredCustomer) {
        if (matchedCustomer && (matchedCustomer.id === 'test-profile-01' || matchedCustomer.email.toLowerCase() === 'test@biowebsite.com' || matchedCustomer.email.toLowerCase() === 'demo@biowebsite.com')) {
          setSelectedCardCustomer(matchedCustomer);
          setNotFoundIdentifier(null);
          setView('public-card');
        } else {
          setView('customer-portal');
        }
      }
    }

    // Secret shortcut for Platform Super Admin: Ctrl + Alt + A (or Cmd + Alt + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setView('admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Synchronize state changes to localStorage and Supabase Cloud
  const handleUpdateCustomer = (updated: Customer) => {
    const isAdmin = isAdminSessionValid();
    const isOwner = currentCustomer && currentCustomer.id === updated.id;

    // Check if this update is strictly a testimonial submission from a visitor/peer
    const currentList = getStoredCustomers();
    const existing = currentList.find((c) => c.id === updated.id);
    const isTestimonialOnlyUpdate =
      existing &&
      (updated.testimonials?.length || 0) > (existing.testimonials?.length || 0) &&
      updated.firstName === existing.firstName &&
      updated.lastName === existing.lastName &&
      updated.businessName === existing.businessName;

    // OWASP A01: Broken Access Control check (IDOR prevention)
    if (!isOwner && !isAdmin && !isTestimonialOnlyUpdate && currentCustomer) {
      console.warn('[SECURITY] Blocked unauthorized update: customer ID mismatch.');
      return;
    }

    const index = currentList.findIndex((c) => c.id === updated.id);
    let updatedList: Customer[];
    if (index >= 0) {
      updatedList = currentList.map((c) => (c.id === updated.id ? updated : c));
    } else {
      updatedList = [updated, ...currentList];
    }

    setCustomers(updatedList);
    saveStoredCustomers(updatedList);

    if (isSupabaseConfigured) {
      upsertCustomerToSupabase(updated);
    }

    if (currentCustomer && currentCustomer.id === updated.id) {
      setCurrentCustomer(updated);
      setCurrentUserId(updated.id);
    }
    if (selectedCardCustomer && selectedCardCustomer.id === updated.id) {
      setSelectedCardCustomer(updated);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    // OWASP A01: Broken Access Control check
    const isAdmin = isAdminSessionValid();
    if (currentCustomer && currentCustomer.id !== customerId && !isAdmin) {
      console.warn('[SECURITY] Blocked unauthorized customer deletion attempt.');
      return;
    }

    const filtered = customers.filter((c) => c.id !== customerId);
    setCustomers(filtered);
    saveStoredCustomers(filtered);

    if (isSupabaseConfigured) {
      deleteCustomerFromSupabase(customerId);
    }

    if (currentCustomer && currentCustomer.id === customerId) {
      setCurrentCustomer(null);
      setCurrentUserId(null);
    }
    if (selectedCardCustomer && selectedCardCustomer.id === customerId) {
      setSelectedCardCustomer(null);
      setView('landing');
    }
  };

  // Synchronize theme to document element class whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Secret Owner shortcut to access Super Admin without public buttons (Ctrl+Shift+A or Alt+A or hash #admin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        setView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#owner') {
        setView('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (window.location.hash === '#admin' || window.location.hash === '#owner') {
      setView('admin');
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    saveThemePreference(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (customer: Customer) => {
    setCurrentCustomer(customer);
    setCurrentUserId(customer.id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    // For test/demo profile login, display the completed finished card directly (no edit mode)
    // as specifically requested: "demo profile m sirf card banne ke baad kesa dikhega vo show hona chahiye naki edit mode"
    if (customer.id === 'test-profile-01' || customer.email.toLowerCase() === 'test@biowebsite.com' || customer.email.toLowerCase() === 'demo@biowebsite.com') {
      setSelectedCardCustomer(customer);
      setNotFoundIdentifier(null);
      setView('public-card');
      return;
    }
    setView('customer-portal');
  };

  const handleSignUpSuccess = (newCustomer: Customer) => {
    const currentStored = getStoredCustomers();
    const updatedList = [newCustomer, ...currentStored.filter(c => c.id !== newCustomer.id)];
    setCustomers(updatedList);
    saveStoredCustomers(updatedList);

    if (isSupabaseConfigured) {
      upsertCustomerToSupabase(newCustomer);
    }

    setCurrentCustomer(newCustomer);
    setCurrentUserId(newCustomer.id);
    setAutoOpenPaymentForNewUser(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setView('customer-portal');
  };

  const handleLogout = () => {
    setCurrentCustomer(null);
    setCurrentUserId(null);
    setAutoOpenPaymentForNewUser(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setView('landing');
  };

  const isRefreshingRef = useRef(false);

  // Stable customer refresh handler that prevents infinite render loops and UI freezes
  const handleRefreshCustomers = useCallback(() => {
    const currentLocal = getStoredCustomers();

    setCustomers((prevCustomers) => {
      if (prevCustomers.length === currentLocal.length) {
        const hasDiff = prevCustomers.some((prev, i) => {
          const loc = currentLocal[i];
          return (
            !loc ||
            prev.id !== loc.id ||
            prev.isPaid !== loc.isPaid ||
            prev.status !== loc.status ||
            prev.paymentAmount !== loc.paymentAmount ||
            prev.updatedAt !== loc.updatedAt
          );
        });
        if (!hasDiff) return prevCustomers; // Skip re-render if data is identical
      }
      return currentLocal;
    });

    if (isSupabaseConfigured && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      fetchCustomersFromSupabase()
        .then((cloudCustomers) => {
          if (cloudCustomers && cloudCustomers.length > 0) {
            const localNow = getStoredCustomers();
            const cloudMap = new Map<string, Customer>();
            cloudCustomers.forEach((c) => cloudMap.set(c.id, c));
            const merged: Customer[] = [...cloudCustomers];
            localNow.forEach((localC) => {
              if (!cloudMap.has(localC.id)) {
                merged.unshift(localC);
              }
            });

            setCustomers((prev) => {
              if (prev.length === merged.length) {
                const hasDiff = prev.some(
                  (p, i) =>
                    p.id !== merged[i]?.id ||
                    p.isPaid !== merged[i]?.isPaid ||
                    p.status !== merged[i]?.status ||
                    p.paymentAmount !== merged[i]?.paymentAmount
                );
                if (!hasDiff) return prev;
              }
              saveStoredCustomers(merged);
              return merged;
            });
          }
        })
        .catch((err) => console.warn('Supabase fetch note:', err))
        .finally(() => {
          isRefreshingRef.current = false;
        });
    }
  }, []);

  // Navigation Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    setView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSampleCustomer = (customer: Customer) => {
    setSelectedCardCustomer(customer);
    setView('public-card');
    if (customer.id !== DEMO_DUMMY_CUSTOMER.id) {
      incrementCustomerView(customer.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated static dummy demo customer (never picks last registered admin user)
  const sampleCustomer = DEMO_DUMMY_CUSTOMER;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Dynamic Ambient Glassmorphism Floating Mesh Orbs */}
      <GlassBackgroundOrbs />

      {/* Content wrapper with relative z-10 for backdrop filter optics */}
      <div className="relative z-10">
        {/* 1. PUBLIC WEBSITE (LANDING PAGE) */}
        {view === 'landing' && (
          <div className="flex flex-col min-h-screen">
            <Navbar
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenAuth={handleOpenAuth}
              onOpenAdmin={handleOpenAdmin}
            />

            <main className="flex-1">
              {sampleCustomer && (
                <HeroSection
                  sampleCustomer={sampleCustomer}
                  onOpenSignUp={() => handleOpenAuth('signup')}
                  onOpenLogin={() => handleOpenAuth('login')}
                  onSelectSampleCustomer={handleSelectSampleCustomer}
                />
              )}
              <ServicesSection />
              <AboutSection />
              <ContactSection />
            </main>

            <Footer
              onOpenAuth={handleOpenAuth}
              onOpenAdmin={handleOpenAdmin}
            />
          </div>
        )}

        {/* 2. CUSTOMER SIGN-UP / LOGIN AREA */}
        {view === 'auth' && (
          <CustomerAuth
            customers={customers}
            initialMode={authMode}
            onLoginSuccess={handleLoginSuccess}
            onSignUpSuccess={handleSignUpSuccess}
            onBackToHome={() => setView('landing')}
          />
        )}

        {/* 3. CUSTOMER PORTAL / DASHBOARD */}
        {view === 'customer-portal' && currentCustomer && (
          <CustomerPortal
            customer={currentCustomer}
            allCustomers={customers}
            inquiries={inquiries}
            onUpdateCustomer={handleUpdateCustomer}
            onLogout={handleLogout}
            autoOpenPaymentModal={autoOpenPaymentForNewUser}
            onViewStandaloneCard={() => {
              setSelectedCardCustomer(currentCustomer);
              setNotFoundIdentifier(null);
              setView('public-card');
              if (typeof window !== 'undefined') {
                const slug = currentCustomer.slug || cleanSlug(currentCustomer.businessName) || currentCustomer.id;
                window.history.pushState(null, '', `/?card=${slug}`);
              }
            }}
          />
        )}

        {/* 4a. LOADING DIGITAL CARD FROM CLOUD */}
        {view === 'public-card' && isLoadingCard && (
          <div className="min-h-screen py-20 px-4 flex items-center justify-center relative z-20">
            <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center border border-white/60 dark:border-white/15 shadow-2xl space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Loading Visiting Card...
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connecting to live cloud database to retrieve profile
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4b. PUBLIC MINI-WEBSITE PAGE (Personal Visiting Card View) */}
        {view === 'public-card' && !isLoadingCard && selectedCardCustomer && (
          (selectedCardCustomer.status !== 'active' || !selectedCardCustomer.isPaid) &&
          !(currentCustomer && currentCustomer.id === selectedCardCustomer.id) &&
          !isAdminSessionValid() ? (
            <CardPendingActivationView
              customer={selectedCardCustomer}
              onGoHome={() => {
                setView('landing');
                window.history.replaceState(null, '', '/');
              }}
              onOwnerLogin={() => {
                setAuthMode('login');
                setView('auth');
                window.history.replaceState(null, '', '/');
              }}
              onAdminActivate={() => {
                const updated = {
                  ...selectedCardCustomer,
                  status: 'active' as const,
                  isPaid: true,
                  paymentAmount: selectedCardCustomer.paymentAmount || (selectedCardCustomer.planTier === '999_3yr' ? 999 : 499),
                  paidAt: selectedCardCustomer.paidAt || new Date().toISOString(),
                  paymentMethod: selectedCardCustomer.paymentMethod || 'UPI',
                };
                handleUpdateCustomer(updated);
                setSelectedCardCustomer(updated);
              }}
            />
          ) : (
            <div className="relative">
              {/* Dedicated QC Testing Control Header for test-profile-01 */}
              {(selectedCardCustomer.id === 'test-profile-01' ||
                currentCustomer?.id === 'test-profile-01' ||
                selectedCardCustomer.id === DEMO_DUMMY_CUSTOMER.id) && (
                <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 font-bold px-4 py-2 shadow-lg border-b border-amber-600/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide">
                      Module 2 QC Testing Mode
                    </span>
                    <span className="text-slate-900 font-extrabold truncate max-w-xs sm:max-w-md">
                      {selectedCardCustomer.businessName} (Finished Card View - Read Only)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setView('landing');
                        if (typeof window !== 'undefined') window.history.replaceState(null, '', '/');
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Home className="w-3.5 h-3.5 text-amber-400" />
                      <span>Back to Home</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setAuthMode('login');
                        setView('auth');
                        if (typeof window !== 'undefined') window.history.replaceState(null, '', '/');
                      }}
                      className="px-3 py-1 rounded-xl bg-white/95 hover:bg-white text-slate-950 font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Log Out Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Navigation Header back to portal or home (only if QC banner is NOT shown) */}
              {selectedCardCustomer.id !== 'test-profile-01' &&
                currentCustomer?.id !== 'test-profile-01' &&
                selectedCardCustomer.id !== DEMO_DUMMY_CUSTOMER.id && (
                  <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.history.replaceState(null, '', window.location.pathname);
                        }
                        if (currentCustomer && currentCustomer.id === selectedCardCustomer.id) {
                          setView('customer-portal');
                        } else if (currentCustomer) {
                          setView('customer-portal');
                        } else {
                          setView('landing');
                        }
                      }}
                      className="glass-panel px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 border border-white/60 dark:border-white/15 backdrop-blur-md cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {currentCustomer && currentCustomer.id === selectedCardCustomer.id
                          ? 'Back to Dashboard'
                          : currentCustomer
                          ? 'My Dashboard'
                          : 'Back to Home'}
                      </span>
                    </button>
                  </div>
                )}

              <MiniWebsiteView
                customer={selectedCardCustomer}
                standalone={true}
                isOwnerPreview={false}
                isDemo={selectedCardCustomer.id === DEMO_DUMMY_CUSTOMER.id || selectedCardCustomer.id === 'test-profile-01'}
                onUpdateCustomer={
                  selectedCardCustomer.id === DEMO_DUMMY_CUSTOMER.id || selectedCardCustomer.id === 'test-profile-01'
                    ? undefined
                    : handleUpdateCustomer
                }
                onBackToPortal={() => {
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', window.location.pathname);
                  }
                  if (
                    selectedCardCustomer.id === DEMO_DUMMY_CUSTOMER.id ||
                    selectedCardCustomer.id === 'test-profile-01' ||
                    currentCustomer?.id === 'test-profile-01' ||
                    currentCustomer?.email.toLowerCase() === 'test@biowebsite.com'
                  ) {
                    handleLogout();
                    setView('landing');
                  } else if (currentCustomer) {
                    setView('customer-portal');
                  } else {
                    setView('landing');
                  }
                }}
              />
            </div>
          )
        )}

        {/* 4c. CARD NOT FOUND / SHOP SUBDOMAIN NOT REGISTERED */}
        {view === 'public-card' && !isLoadingCard && !selectedCardCustomer && notFoundIdentifier && (
          <div className="min-h-screen py-20 px-4 flex items-center justify-center relative z-20">
            <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center border border-white/60 dark:border-white/15 shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Shop Profile Not Found
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No active digital visiting card is linked with handle:
                </p>
                <div className="mt-2 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 inline-block border border-slate-200 dark:border-slate-700">
                  {notFoundIdentifier}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you the owner of this business? You can claim this shop name and create your mini website in under 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (notFoundIdentifier) {
                      setIsLoadingCard(true);
                      findCustomerInSupabase(notFoundIdentifier, 2).then((cloudCustomer) => {
                        setIsLoadingCard(false);
                        if (cloudCustomer) {
                          setSelectedCardCustomer(cloudCustomer);
                          setNotFoundIdentifier(null);
                        }
                      }).catch(() => setIsLoadingCard(false));
                    }
                  }}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl glass-card border border-indigo-500/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Again</span>
                </button>
                <button
                  onClick={() => {
                    setNotFoundIdentifier(null);
                    setView('landing');
                    window.history.replaceState(null, '', '/');
                  }}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl glass-card border border-white/60 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/80 transition-all cursor-pointer"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => {
                    setNotFoundIdentifier(null);
                    setAuthMode('signup');
                    setView('auth');
                    window.history.replaceState(null, '', '/');
                  }}
                  className="w-full sm:flex-1 py-2.5 px-3 rounded-xl glass-btn-primary text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Create Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. SUPER ADMIN PANEL */}
        {view === 'admin' && (
          <SuperAdminPanel
            customers={customers}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onRefreshCustomers={handleRefreshCustomers}
            onViewCustomerCard={(customer) => {
              setSelectedCardCustomer(customer);
              setView('public-card');
            }}
            onClose={() => setView('landing')}
          />
        )}
      </div>
    </div>
  );
}
