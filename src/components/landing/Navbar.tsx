import React, { useState } from 'react';
import {
  CreditCard,
  Sun,
  Moon,
  LogIn,
  Menu,
  X,
  Sparkles,
  Store
} from 'lucide-react';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="glass-nav sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button
          onClick={() => scrollToSection('home')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              BIO Website
            </span>
            <span className="block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              Smart Business Card & Portfolio
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 p-1 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 shadow-xs">
          <button
            onClick={() => scrollToSection('home')}
            className="px-3.5 py-1.5 rounded-xl hover:bg-white/90 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className="px-3.5 py-1.5 rounded-xl hover:bg-white/90 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="px-3.5 py-1.5 rounded-xl hover:bg-white/90 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="px-3.5 py-1.5 rounded-xl hover:bg-white/90 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            Contact
          </button>
        </div>

        {/* Right CTA Area: Dark Mode, Customer Login, Sign Up (NO public Super Admin button) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl glass-card text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all border border-slate-200/80 dark:border-white/10"
            aria-label="Toggle theme mode"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Customer Login Button */}
          <button
            onClick={() => onOpenAuth('login')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn-secondary text-slate-900 dark:text-slate-100 text-xs font-semibold"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Customer Login</span>
          </button>

          {/* Get Started / Sign Up */}
          <button
            onClick={() => onOpenAuth('signup')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl glass-btn-primary text-white text-xs font-bold active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Create Card</span>
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Open mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('home')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Contact
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('login');
              }}
              className="w-full py-2.5 rounded-xl glass-card text-center text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Customer Login
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('signup');
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-center text-xs font-bold shadow-md"
            >
              Create Mini Website
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
