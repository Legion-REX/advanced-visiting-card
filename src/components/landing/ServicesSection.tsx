import React from 'react';
import {
  CreditCard,
  UserPlus,
  PackageCheck,
  QrCode,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Share2,
  TrendingUp,
  Clock
} from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: CreditCard,
      title: 'Digital Visiting Card (Glassmorphism)',
      description:
        'A sleek, mobile-first single link that replaces outdated paper cards with interactive phone, WhatsApp, email, and social connections.',
      highlight: 'Mobile-Optimized',
    },
    {
      icon: UserPlus,
      title: '1-Tap Save Contact (.vcf vCard)',
      description:
        'Clients download a standard vCard file with one tap, saving your full name, shop number, address, and numbers straight into iOS/Android contacts.',
      highlight: 'Zero Typos',
    },
    {
      icon: PackageCheck,
      title: 'Interactive Products & Services Portfolio',
      description:
        'Showcase your signature haircuts, bespoke clothing collections, consulting packages, or medical solutions with pricing and instant WhatsApp ordering.',
      highlight: 'Conversion-Focused',
    },
    {
      icon: QrCode,
      title: 'Instant QR Code Generator',
      description:
        'Generate and download crisp high-resolution QR codes to print on reception counters, billing receipts, storefront windows, and packaging.',
      highlight: 'Scan & Connect',
    },
    {
      icon: MessageSquare,
      title: 'Lead Capture & Inquiry System',
      description:
        'Prospective clients can submit direct inquiries for quotes or appointments with service preferences directly delivered to your dashboard.',
      highlight: 'Direct Inquiries',
    },
    {
      icon: ShieldCheck,
      title: 'Social Links & Verified Trust Hub',
      description:
        'Consolidate Instagram, LinkedIn, YouTube, X, Google Maps directions, and 5-star customer reviews into a single high-trust destination.',
      highlight: 'Reputation Builder',
    },
  ];

  return (
    <section id="services" className="py-20 px-4 sm:px-8 border-t border-slate-200/60 dark:border-slate-800 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Built For In-Person & Telephonic Conversions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything You Need in a Strategic Mini Website
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Engineered to help business owners, service providers, and sales professionals close deals faster and keep prospective clients engaged.
          </p>
        </div>

        {/* Services Grid (Frosted Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, index) => {
            const Icon = svc.icon;
            return (
              <div
                key={index}
                className="glass-card p-6 rounded-3xl border border-white/60 dark:border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3.5 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full glass-badge border border-indigo-200/50 dark:border-indigo-800/40">
                      {svc.highlight}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {svc.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/40 dark:border-white/10 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Explore capability</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion callout bar */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 text-center md:text-left relative z-10">
            <div className="p-3.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl hidden sm:block border border-emerald-500/20 backdrop-blur-md">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Why Business Cards Fail & Mini Websites Convert
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                88% of paper business cards are tossed in the trash within a week. A glassmorphism mini website lives permanently in your client's phone browser and contact book with zero friction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-white/40 dark:border-white/10">
              <Share2 className="w-4 h-4 text-indigo-500" />
              <span>1-Tap WhatsApp Share</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-white/40 dark:border-white/10">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Live in 2 Mins</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
