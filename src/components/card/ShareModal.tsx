import React, { useState } from 'react';
import { Customer } from '../../types';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { formatShareLocation } from '../../utils/address';
import { launchWhatsAppUrl } from '../../utils/whatsapp';
import html2canvas from 'html2canvas';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  cardUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  customer,
  cardUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'qr' | 'poster'>('quick');
  const [inactiveNotice, setInactiveNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isActive = customer.status === 'active';

  const showInactiveAlert = (msg?: string) => {
    setInactiveNotice(msg || 'Card is pending admin activation. Sharing, link copying, and downloads are disabled until activated by Admin.');
    setTimeout(() => setInactiveNotice(null), 3500);
  };

  const shareText = `*${customer.businessName}*\n${customer.firstName} ${customer.lastName} | ${customer.jobTitle}\n\n"${customer.headline}"\n\n📍 ${formatShareLocation(customer.address)}\n📱 Contact: ${customer.phone}\n\n*Tap the link below to view my complete profile & services:*\n${cardUrl}`;

  const handleCopy = async () => {
    if (!isActive) {
      showInactiveAlert('Card is pending admin activation. Link copying is disabled until activated by Admin.');
      return;
    }
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    if (!isActive) {
      showInactiveAlert('Card is pending admin activation. WhatsApp sharing is disabled until activated by Admin.');
      return;
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    launchWhatsAppUrl(waUrl);
  };

  const handleNativeShare = async () => {
    if (!isActive) {
      showInactiveAlert('Card is pending admin activation. Sharing is disabled until activated by Admin.');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${customer.businessName} - ${customer.firstName} ${customer.lastName}`,
          text: shareText,
          url: cardUrl,
        });
      } catch {
        // User dismissed or aborted
      }
    }
  };

  const handleDownloadPoster = async () => {
    if (!isActive) {
      showInactiveAlert('Card is pending admin activation. Poster download is disabled until activated by Admin.');
      return;
    }
    setIsGeneratingImage(true);
    try {
      const captureElem = document.getElementById('share-capture-card');
      if (captureElem) {
        const canvas = await html2canvas(captureElem, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          backgroundColor: '#0F172A',
        });
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        const cleanName = `${customer.firstName}_${customer.lastName}_Digital_Card`.replace(/\s+/g, '_');
        a.download = `${cleanName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to generate poster:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel max-w-md w-full rounded-3xl p-5 sm:p-6 relative shadow-2xl border border-white/60 dark:border-white/15 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/40 dark:border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={customer.avatarUrl || customer.logoUrl}
              alt={customer.businessName}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {customer.businessName}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Digital Visiting Card & Mini Website
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inactiveNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/95 text-slate-950 text-xs font-bold shadow-xl border border-amber-400 animate-in fade-in">
            ⚠️ {inactiveNotice}
          </div>
        )}

        {!isActive && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-[11px] font-medium flex items-center gap-2">
            <span className="text-sm">⏳</span>
            <span>
              <strong>Pending Admin Activation:</strong> All share links, WhatsApp, and downloads are locked until activated by the Admin.
            </span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 pt-3 pb-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'quick'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            Share & Link
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'qr'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            QR Code
          </button>
          <button
            onClick={() => setActiveTab('poster')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === 'poster'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            Card Poster
          </button>
        </div>

        {/* Content Body */}
        <div className="py-3 overflow-y-auto space-y-4">
          {activeTab === 'quick' && (
            <div className="space-y-3">
              {/* WhatsApp 1-tap button */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Share Instantly on WhatsApp</span>
              </button>

              {/* Copy URL Box */}
              <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Public Card Link:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={cardUrl}
                    className="flex-1 glass-input text-xs font-mono truncate py-1.5 px-2.5"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Download Image Poster Button */}
              <button
                onClick={handleDownloadPoster}
                disabled={isGeneratingImage}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-xs shadow flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Generating Image...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Download PNG Visiting Card Poster</span>
                  </>
                )}
              </button>

              {/* Native System Share if supported */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 rounded-2xl glass-card border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>More Sharing Options (Other Apps)</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center">
              <QRCodeDisplay
                url={cardUrl}
                title={customer.businessName}
                subtitle="Scan with smartphone camera to open and save this digital card."
                size={200}
                isActive={isActive}
              />
            </div>
          )}

          {activeTab === 'poster' && (
            <div className="space-y-3 text-center">
              <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs border border-white/10 space-y-2">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
                <h4 className="font-bold text-sm">HD Visiting Card Poster</h4>
                <p className="text-slate-400 text-[11px]">
                  Generates an optimized high-resolution graphic card of your shop with QR code, headline, and contacts ready to upload to WhatsApp Status or Instagram story.
                </p>
                <button
                  onClick={handleDownloadPoster}
                  disabled={isGeneratingImage}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 mt-2 active:scale-98 transition-all"
                >
                  {isGeneratingImage ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating HD Poster...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PNG Poster (Free)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom indicator */}
        <div className="pt-2 border-t border-white/40 dark:border-white/10 text-center">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Card is Live & Accessible Worldwide
          </span>
        </div>
      </div>
    </div>
  );
};
