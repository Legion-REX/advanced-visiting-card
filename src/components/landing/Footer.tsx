import React from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAuth, onOpenAdmin }) => {
  return (
    <footer className="glass-panel border-t border-white/60 dark:border-white/10 py-12 px-4 sm:px-8 text-xs relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              BIO Website
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Smart Bio Websites & Mini Digital Cards for sales conversion.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 dark:text-slate-400 font-medium">
          <a href="#home" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Home
          </a>
          <a href="#services" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Services
          </a>
          <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            About
          </a>
          <a href="#contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Contact
          </a>
          <button
            onClick={() => onOpenAuth('login')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Customer Login
          </button>
          <button
            onClick={() => onOpenAuth('signup')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Create Card
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px] text-center md:text-right">
          <span>© {new Date().getFullYear()} BIO Website. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
