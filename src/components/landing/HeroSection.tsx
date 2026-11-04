import React from 'react';
import { Customer } from '../../types';
import { formatCardLocation } from '../../utils/address';
import {
  Sparkles,
  ArrowRight,
  UserPlus,
  Phone,
  MessageCircle,
  QrCode,
  CheckCircle,
  ShieldCheck,
  Star,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface HeroSectionProps {
  onOpenSignUp: () => void;
  onOpenLogin: () => void;
  sampleCustomer: Customer;
  onSelectSampleCustomer: (customer: Customer) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenSignUp,
  onOpenLogin,
  sampleCustomer,
  onSelectSampleCustomer,
}) => {
  return (
    <section id="home" className="relative pt-12 pb-20 px-4 sm:px-8 overflow-hidden">
      {/* Subtle glass background glow orbs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Core Value Proposition & Headings */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BIO Website & Digital Mini Card Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Turn Every Handshake into a{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Permanent Client.
            </span>
          </h1>

          {/* Strategic Context Quote & Problem/Solution Statement */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
            Paper business cards get lost or thrown away in days. Elevate your local business with a fast, interactive digital card & mini website. Features 1-tap contact saving (.VCF), instant WhatsApp ordering, Google Map navigation, and showcase catalogues.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={onOpenSignUp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl glass-btn-primary text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2"
            >
              <span>Create Your Mini Website</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl glass-card text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-white/60 dark:border-white/10"
            >
              <span>Sign In to Your Card</span>
            </button>
          </div>

          {/* Quick Trust Verification Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-white/50 dark:border-white/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Direct .VCF Contact Download</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-white/50 dark:border-white/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>1-Tap WhatsApp & Call</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-white/50 dark:border-white/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>QR Code Ready</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Glassmorphism Mini Website Preview Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm">
            
            {/* Decorative background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

            {/* Mobile-Frame Card Mockup */}
            <div className="relative glass-panel rounded-3xl p-5 shadow-2xl border border-white/60 dark:border-white/15 text-left">
              
              {/* Card Header Strip */}
              <div className="relative h-32 rounded-2xl overflow-hidden mb-4 bg-slate-900">
                <img
                  src={sampleCustomer.bannerUrl}
                  alt={sampleCustomer.businessName}
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2">
                  <span className="glass-panel px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-900 dark:text-white border border-white/40">
                    {sampleCustomer.businessCategory}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="p-1 rounded-full glass-panel text-slate-900 dark:text-white border border-white/40">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Profile identity */}
              <div className="relative flex items-start gap-3 -mt-10 mb-3 px-1">
                <img
                  src={sampleCustomer.avatarUrl}
                  alt={sampleCustomer.firstName}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/80 dark:ring-slate-900/80 shadow-md flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="pt-6">
                  <div className="flex items-center gap-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {sampleCustomer.firstName} {sampleCustomer.lastName}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {sampleCustomer.jobTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                    {sampleCustomer.businessName}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2 mb-2 px-1">
                "{sampleCustomer.headline}"
              </p>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-4 px-1">
                <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                <span className="truncate">{formatCardLocation(sampleCustomer.address)}</span>
              </div>

              {/* Action Buttons Mock with frosted glass */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-2 rounded-xl glass-btn-primary text-white text-center shadow-xs">
                  <UserPlus className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span className="text-[9px] font-bold block">Save</span>
                </div>
                <div className="p-2 rounded-xl glass-card text-center text-slate-800 dark:text-slate-200 border border-white/50 dark:border-white/10">
                  <Phone className="w-3.5 h-3.5 mx-auto mb-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[9px] font-bold block">Call</span>
                </div>
                <div className="p-2 rounded-xl glass-card text-center text-slate-800 dark:text-slate-200 border border-white/50 dark:border-white/10">
                  <MessageCircle className="w-3.5 h-3.5 mx-auto mb-0.5 text-green-500" />
                  <span className="text-[9px] font-bold block">WhatsApp</span>
                </div>
                <div className="p-2 rounded-xl glass-card text-center text-slate-800 dark:text-slate-200 border border-white/50 dark:border-white/10">
                  <MapPin className="w-3.5 h-3.5 mx-auto mb-0.5 text-rose-500" />
                  <span className="text-[9px] font-bold block">Map</span>
                </div>
              </div>

              {/* Sample Product item */}
              {sampleCustomer.products?.[0] && (
                <div className="p-2.5 rounded-2xl glass-card border border-white/60 dark:border-white/10 flex items-center gap-2.5 mb-4 shadow-sm">
                  <img
                    src={sampleCustomer.products[0].imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                      {sampleCustomer.products[0].title}
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {sampleCustomer.products[0].price}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive CTA to test this card */}
              <button
                type="button"
                onClick={() => onSelectSampleCustomer(sampleCustomer)}
                className="w-full py-2.5 rounded-2xl glass-btn-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>Preview Full Customer Experience</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
