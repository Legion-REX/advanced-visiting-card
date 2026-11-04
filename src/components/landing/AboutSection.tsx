import React from 'react';
import {
  Users,
  Target,
  PhoneCall,
  MapPin,
  Sparkles,
  Scissors,
  Shirt,
  Briefcase,
  Stethoscope,
  Building,
  Utensils,
  Car,
  ShoppingBag,
  Sparkle
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  const targetIndustries = [
    { icon: Scissors, label: 'Barber Shops & Grooming' },
    { icon: Sparkles, label: 'Beauty Parlours & Salons' },
    { icon: ShoppingBag, label: "Women's Boutiques & Ethnic" },
    { icon: Shirt, label: "Men's Clothing & Tailoring" },
    { icon: Sparkle, label: "Children's Clothing & Kids Wear" },
    { icon: Stethoscope, label: 'Doctors, Clinics & Labs' },
    { icon: Utensils, label: 'Restaurants, Cafes & Sweets' },
    { icon: Briefcase, label: 'Consultants, CAs & Legal' },
    { icon: Car, label: 'Automotive & Detailing' },
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-8 border-t border-slate-200/60 dark:border-slate-800 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Mission & Strategic Context */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>Our Mission & Company Background</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bridging Physical Handshakes with Modern Digital Conversion
          </h2>

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              At <strong>BIO Website</strong>, we recognized a massive gap in how modern business happens. While millions of enterprise tools exist for purely online commerce, service providers and business owners who meet customers face-to-face or speak with them over the phone were still relying on static paper business cards.
            </p>
            <p>
              Paper cards can’t show your newest clothing arrivals, can’t trigger a one-tap WhatsApp chat, and cannot provide live GPS directions to your storefront.
            </p>
            <p>
              We built the <strong>Strategic Mini Website</strong> platform to empower boutique owners, master barbers, tailored fashion couturiers, certified consultants, and sales specialists with a digital presence that takes less than two minutes to launch and transforms casual conversations into paid client bookings.
            </p>
          </div>

          {/* Industry Pills */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-3">
              Engineered for 95+ Retail & High-Touch Service Industries:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {targetIndustries.map((ind, i) => {
                const Icon = ind.icon;
                return (
                  <div
                    key={i}
                    className="glass-card px-3 py-2 rounded-2xl flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 border border-white/60 dark:border-white/10 hover:shadow-md transition-all"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{ind.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Advantage Matrix */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-white/10 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>The Strategic Advantage of a Mini Website</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl glass-card border border-white/40 dark:border-white/10 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Traditional Paper Cards</span>
                  <span className="text-rose-500 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10">Low Conversion</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Easily lost in wallets, contains static phone numbers, no product images, no customer reviews, and no way to update when hours change.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-white/40 dark:border-white/10 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Bulky Corporate Websites</span>
                  <span className="text-amber-500 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10">Overly Complex</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Costs thousands of dollars, requires monthly maintenance, slow to load on mobile, and hides critical contact buttons behind deep submenus.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-500/10 dark:bg-indigo-950/40 space-y-1 shadow-sm">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>BIO Website (Smart Mini Card)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">Optimal 100% Mobile</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-[11px]">
                  Instant vCard download straight to phone contacts, WhatsApp direct chat, GPS directions, live product showcases, and verified testimonials in one fast glassmorphism link.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
