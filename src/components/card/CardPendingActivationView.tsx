import React, { useState } from 'react';
import { Customer } from '../../types';
import { Clock, ShieldAlert, ArrowLeft, LogIn, Sparkles, CheckCircle2, Home, UserPlus, Copy, Share2, Download, AlertTriangle } from 'lucide-react';

interface CardPendingActivationViewProps {
  customer: Customer;
  onGoHome: () => void;
  onOwnerLogin: () => void;
  onAdminActivate?: () => void;
}

export const CardPendingActivationView: React.FC<CardPendingActivationViewProps> = ({
  customer,
  onGoHome,
  onOwnerLogin,
  onAdminActivate,
}) => {
  const [justActivated, setJustActivated] = useState(false);
  const [blockedToast, setBlockedToast] = useState<string | null>(null);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('avc_admin_authenticated') === 'true';

  const showBlockedMessage = (actionName: string) => {
    setBlockedToast(`⚠️ Card Inactive: ${actionName} is disabled until activated by the Admin.`);
    setTimeout(() => {
      setBlockedToast(null);
    }, 3800);
  };

  const handleAdminActivateClick = () => {
    if (onAdminActivate) {
      setJustActivated(true);
      setTimeout(() => {
        onAdminActivate();
      }, 600);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 flex items-center justify-center relative z-20">
      {/* Top Floating Return Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={onGoHome}
          className="glass-panel px-3.5 py-2 rounded-2xl shadow-lg text-xs font-bold text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/60 dark:border-white/15 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Return Home</span>
        </button>
      </div>

      <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl text-center border border-amber-500/30 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-xl">
        {/* Glow effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Status Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <div className="absolute bottom-0 right-1/2 translate-x-8 translate-y-1">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
            <span>⏳</span>
            <span>Card Activation Pending — Please Make Payment</span>
          </span>
        </div>

        {/* Titles */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Card Activation Pending
          </h2>
          <div className="mt-1 font-bold text-sm text-indigo-600 dark:text-indigo-400">
            {customer.businessName}
          </div>
        </div>

        {/* Clear Notice */}
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/60 border border-amber-500/30 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed text-left">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Card Locked — Payment Required to Launch</span>
          </div>
          <p>
            This digital visiting card has been created but is currently <strong>not live</strong>. The card owner must complete the activation payment to launch this card for public visitors.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            Until payment is verified, public access, contact downloads (.vcf), QR scanning, and sharing features remain strictly locked.
          </p>
        </div>

        {/* Options Row (Visible but Locked as requested) */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Locked Actions (Pending Activation):
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono">0/4 Active</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. Save Contact (.vcf) button */}
            <button
              type="button"
              onClick={() => showBlockedMessage('.vcf Contact Download')}
              className="py-2 px-2.5 rounded-xl glass-card border border-amber-500/30 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
              title="Disabled until activated by Admin"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span className="truncate">Save Contact (.vcf)</span>
            </button>

            {/* 2. Copy Link button */}
            <button
              type="button"
              onClick={() => showBlockedMessage('Card Link Copy')}
              className="py-2 px-2.5 rounded-xl glass-card border border-amber-500/30 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
              title="Disabled until activated by Admin"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">Copy Card Link</span>
            </button>

            {/* 3. Share Card button */}
            <button
              type="button"
              onClick={() => showBlockedMessage('Share Modal & Actions')}
              className="py-2 px-2.5 rounded-xl glass-card border border-amber-500/30 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
              title="Disabled until activated by Admin"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">Share Profile</span>
            </button>

            {/* 4. Download QR Code button */}
            <button
              type="button"
              onClick={() => showBlockedMessage('QR Code Download')}
              className="py-2 px-2.5 rounded-xl glass-card border border-amber-500/30 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
              title="Disabled until activated by Admin"
            >
              <Download className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate">Download QR</span>
            </button>
          </div>
        </div>

        {/* Floating Blocked Toast */}
        {blockedToast && (
          <div className="py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-1.5 text-center">
            <span>🔒</span>
            <span>{blockedToast}</span>
          </div>
        )}

        {/* Owner / Visitor Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {isAdmin && onAdminActivate && (
            <button
              onClick={handleAdminActivateClick}
              disabled={justActivated}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {justActivated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Card Activated! Opening...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>⚡ Admin Quick Action: Activate Card Now</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOwnerLogin}
            className="w-full py-2.5 px-4 rounded-2xl glass-btn-primary text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Business Owner Login</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-2.5 px-4 rounded-2xl glass-card border border-white/60 dark:border-white/15 hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
