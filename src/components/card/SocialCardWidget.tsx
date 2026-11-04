import React from 'react';
import {
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Twitter,
  Github,
  Globe,
  ExternalLink,
  CheckCircle2,
  MessageCircle,
  Send,
  Share2,
  Pin,
  Sparkles,
  Star,
} from 'lucide-react';
import { SocialAccountItem, SocialPlatform } from '../../types';
import { SOCIAL_PLATFORMS } from '../../utils/socialHelpers';

interface SocialCardWidgetProps {
  account: SocialAccountItem;
  defaultAvatar?: string;
  onEdit?: (account: SocialAccountItem) => void;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
}

export const getSocialPlatformIcon = (platform: SocialPlatform, className = 'w-4 h-4') => {
  switch (platform) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'twitter':
      return <Twitter className={className} />;
    case 'github':
      return <Github className={className} />;
    case 'whatsapp_channel':
      return <MessageCircle className={className} />;
    case 'telegram':
      return <Send className={className} />;
    case 'pinterest':
      return <Pin className={className} />;
    case 'threads':
      return (
        <span className="font-black text-xs leading-none tracking-tighter select-none font-mono">
          @
        </span>
      );
    case 'website':
      return <Globe className={className} />;
    case 'google_reviews':
      return <Star className={className} />;
    case 'other':
    default:
      return <Globe className={className} />;
  }
};

export const SocialCardWidget: React.FC<SocialCardWidgetProps> = ({
  account,
  defaultAvatar,
  onEdit,
  onDelete,
  isEditable = false,
}) => {
  const config = SOCIAL_PLATFORMS[account.platform] || SOCIAL_PLATFORMS.other;
  const displayImage = account.thumbnailUrl || defaultAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  return (
    <div
      className={`group relative glass-card rounded-2xl p-3 sm:p-3.5 border border-white/60 dark:border-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${config.borderHover} overflow-hidden flex flex-col justify-between`}
    >
      {/* Top subtle brand gradient highlight bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start gap-3">
        {/* Profile / Account Thumbnail */}
        <div className="relative flex-shrink-0">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden ring-2 ring-white/80 dark:ring-slate-800 shadow-md group-hover:scale-103 transition-transform bg-slate-100 dark:bg-slate-800">
            <img
              src={displayImage}
              alt={account.title || account.handleOrUsername}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Platform Icon Badge pinned at bottom-right of the thumbnail */}
          <div
            className={`absolute -bottom-1.5 -right-1.5 p-1 rounded-full text-white shadow-md ring-2 ring-white dark:ring-slate-900 ${config.accentBg} flex items-center justify-center`}
            title={config.name}
          >
            {getSocialPlatformIcon(account.platform, 'w-3 h-3')}
          </div>
        </div>

        {/* Account Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
              {config.name}
            </span>
            {account.verified && (
              <span title="Verified Profile" className="text-sky-500 inline-flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 fill-sky-500 text-white dark:text-slate-900" />
              </span>
            )}
          </div>

          {/* Handle / Username */}
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5 font-mono">
            {account.handleOrUsername}
          </p>

          {/* Followers or Badge metric */}
          {account.followerCount && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span className="truncate">{account.followerCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description / Subtitle */}
      {account.description && (
        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
          {account.description}
        </p>
      )}

      {/* Bottom Action Section */}
      <div className="mt-3 pt-2.5 border-t border-white/50 dark:border-white/10 flex items-center justify-between gap-2">
        {/* If editable mode (portal) */}
        {isEditable ? (
          <div className="flex items-center gap-1.5 w-full justify-between">
            <a
              href={account.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
            >
              <span>Test Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(account)}
                  className="px-2.5 py-1 text-xs rounded-lg glass-button text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(account.id)}
                  className="p-1 text-xs rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove account"
                >
                  <span className="sr-only">Delete</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Public Mini Website View: Primary CTA button */
          <a
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 text-white shadow-sm transition-all duration-200 active:scale-98 bg-gradient-to-r ${config.gradient} hover:shadow-md hover:brightness-105`}
          >
            {getSocialPlatformIcon(account.platform, 'w-3.5 h-3.5')}
            <span>{account.badgeText || config.defaultBadge}</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>
        )}
      </div>
    </div>
  );
};
