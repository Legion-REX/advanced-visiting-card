import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Clock,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { IndustrySelect } from '../common/IndustrySelect';
import { addInquiry } from '../../utils/storage';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('Barber Shop & Men\'s Grooming');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      addInquiry({
        customerId: 'platform-inquiry',
        senderName: name.trim(),
        senderEmail: email.trim(),
        senderPhone: phone.trim() || undefined,
        serviceInterested: businessType,
        message: message.trim() || `Platform inquiry for ${businessType}`,
      });
    } catch (err) {
      console.error('Failed to record inquiry:', err);
    }

    setSubmitted(true);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-8 border-t border-slate-200/60 dark:border-slate-800 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Get in Touch with our Advisory Team</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to Upgrade Your In-Person & Phone Sales?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Have questions about custom domain setups, multi-branch franchises, or enterprise sales teams? Send us an inquiry.
          </p>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Contact Info & FAQ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/60 dark:border-white/10 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Headquarters & Support
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex-shrink-0 border border-indigo-500/20">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Office Address</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Level 5, Platina Tech Park, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051, India
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex-shrink-0 border border-emerald-500/20">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Customer Inquiries Hotline</span>
                    <a href="tel:+919820188287" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      +91 98201 88287 / +91 (022) 6789 4321
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex-shrink-0 border border-blue-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Direct Email</span>
                    <a href="mailto:support@visitingcard.pro" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      support@visitingcard.pro
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Support Hours</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Monday to Saturday: 9:30 AM – 7:30 PM IST
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick FAQ Mini Card */}
            <div className="glass-card p-5 rounded-3xl border border-white/60 dark:border-white/10 text-xs space-y-2 shadow-md">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Do prospective clients need to download an app?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                No! The mini website opens instantly inside any mobile browser (Safari, Chrome) via QR code or direct link. Contact details save directly to their native phone contacts.
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/60 dark:border-white/10 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Send Us a Message
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                Fill out your details below and our team will get back to you within 2 hours.
              </p>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                      Thank You! Your Inquiry Has Been Received.
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Our product specialist will contact you shortly to help configure your digital visiting card.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <IndustrySelect
                        id="contact-industry-select"
                        label="Your Industry"
                        value={businessType}
                        onChange={setBusinessType}
                        showSearchAssistant={true}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      How Can We Help You?
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your storefront, team size, or specific features you need..."
                      className="glass-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl glass-btn-primary text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
