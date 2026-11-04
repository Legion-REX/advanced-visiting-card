import { SocialPlatform, SocialAccountItem, SocialLinks, Customer } from '../types';

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  defaultBadge: string;
  brandColor: string;
  accentBg: string;
  gradient: string;
  borderHover: string;
  urlPrefix: string;
  placeholderHandle: string;
  placeholderUrl: string;
  defaultDescription: string;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    defaultBadge: 'Follow',
    brandColor: '#E1306C',
    accentBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    gradient: 'from-amber-500 via-rose-500 to-fuchsia-600',
    borderHover: 'hover:border-rose-400/60 hover:shadow-rose-500/10',
    urlPrefix: 'https://instagram.com/',
    placeholderHandle: '@rajesh_royalsalon',
    placeholderUrl: 'https://instagram.com/rajesh_royalsalon',
    defaultDescription: 'Follow for daily style transformations & customer reels',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    defaultBadge: 'Connect',
    brandColor: '#0A66C2',
    accentBg: 'bg-[#0A66C2]',
    gradient: 'from-blue-600 to-cyan-600',
    borderHover: 'hover:border-blue-400/60 hover:shadow-blue-500/10',
    urlPrefix: 'https://linkedin.com/in/',
    placeholderHandle: 'in/rajesh-sharma-kurla',
    placeholderUrl: 'https://linkedin.com/in/rajesh-sharma-kurla',
    defaultDescription: 'Connect for professional consulting, updates & industry network',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    defaultBadge: 'Like & Follow',
    brandColor: '#1877F2',
    accentBg: 'bg-[#1877F2]',
    gradient: 'from-blue-600 to-indigo-700',
    borderHover: 'hover:border-indigo-400/60 hover:shadow-indigo-500/10',
    urlPrefix: 'https://facebook.com/',
    placeholderHandle: 'facebook.com/rajeshroyalsalon',
    placeholderUrl: 'https://facebook.com/rajeshroyalsalon',
    defaultDescription: 'Official business page with festive offers, client reviews & gallery',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    defaultBadge: 'Subscribe',
    brandColor: '#FF0000',
    accentBg: 'bg-[#FF0000]',
    gradient: 'from-red-600 to-rose-700',
    borderHover: 'hover:border-red-400/60 hover:shadow-red-500/10',
    urlPrefix: 'https://youtube.com/@',
    placeholderHandle: '@RoyalSalonMumbai',
    placeholderUrl: 'https://youtube.com/@RoyalSalonMumbai',
    defaultDescription: 'Watch full styling tutorials, store walkthroughs & client showcases',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    defaultBadge: 'Follow on X',
    brandColor: '#000000',
    accentBg: 'bg-black',
    gradient: 'from-slate-900 to-slate-700',
    borderHover: 'hover:border-slate-400/60 hover:shadow-slate-500/10',
    urlPrefix: 'https://x.com/',
    placeholderHandle: '@royalsalon_in',
    placeholderUrl: 'https://x.com/royalsalon_in',
    defaultDescription: 'Real-time announcements, festive schedules & trend opinions',
  },
  whatsapp_channel: {
    id: 'whatsapp_channel',
    name: 'WhatsApp Channel',
    defaultBadge: 'Join Channel',
    brandColor: '#25D366',
    accentBg: 'bg-[#25D366]',
    gradient: 'from-emerald-500 to-teal-600',
    borderHover: 'hover:border-emerald-400/60 hover:shadow-emerald-500/10',
    urlPrefix: 'https://whatsapp.com/channel/',
    placeholderHandle: 'Royal Grooming Club',
    placeholderUrl: 'https://whatsapp.com/channel/0029VaRoyal123',
    defaultDescription: 'Get exclusive VIP broadcast deals & instant slot availability',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    defaultBadge: 'Join Group',
    brandColor: '#229ED9',
    accentBg: 'bg-[#229ED9]',
    gradient: 'from-sky-500 to-blue-600',
    borderHover: 'hover:border-sky-400/60 hover:shadow-sky-500/10',
    urlPrefix: 'https://t.me/',
    placeholderHandle: 't.me/royalsalonmumbai',
    placeholderUrl: 'https://t.me/royalsalonmumbai',
    defaultDescription: 'Join our customer community for early access to discounts',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    defaultBadge: 'Follow',
    brandColor: '#000000',
    accentBg: 'bg-black',
    gradient: 'from-zinc-900 to-zinc-700',
    borderHover: 'hover:border-zinc-400/60 hover:shadow-zinc-500/10',
    urlPrefix: 'https://threads.net/@',
    placeholderHandle: '@rajesh_royalsalon',
    placeholderUrl: 'https://threads.net/@rajesh_royalsalon',
    defaultDescription: 'Daily short thoughts, behind-the-scenes & quick Q&A',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    defaultBadge: 'View Repos',
    brandColor: '#24292E',
    accentBg: 'bg-[#24292E]',
    gradient: 'from-slate-800 to-slate-950',
    borderHover: 'hover:border-slate-400/60 hover:shadow-slate-500/10',
    urlPrefix: 'https://github.com/',
    placeholderHandle: 'rajesh-dev',
    placeholderUrl: 'https://github.com/rajesh-dev',
    defaultDescription: 'Open-source projects, tools & digital design repositories',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    defaultBadge: 'Save Pins',
    brandColor: '#E60023',
    accentBg: 'bg-[#E60023]',
    gradient: 'from-rose-600 to-red-700',
    borderHover: 'hover:border-rose-400/60 hover:shadow-rose-500/10',
    urlPrefix: 'https://pinterest.com/',
    placeholderHandle: 'rajeshroyalsalon',
    placeholderUrl: 'https://pinterest.com/rajeshroyalsalon',
    defaultDescription: 'Moodboards, lookbooks, hairstyle inspirations & outfit styling',
  },
  website: {
    id: 'website',
    name: 'Official Website',
    defaultBadge: 'Visit Site',
    brandColor: '#6366F1',
    accentBg: 'bg-indigo-600',
    gradient: 'from-indigo-600 to-purple-600',
    borderHover: 'hover:border-indigo-400/60 hover:shadow-indigo-500/10',
    urlPrefix: 'https://',
    placeholderHandle: 'royalsalon.in',
    placeholderUrl: 'https://royalsalon.in',
    defaultDescription: 'Full brand portfolio, booking system & verified services',
  },
  google_reviews: {
    id: 'google_reviews',
    name: 'Google Reviews',
    defaultBadge: 'Leave a Review',
    brandColor: '#EA4335',
    accentBg: 'bg-[#EA4335]',
    gradient: 'from-red-500 to-red-600',
    borderHover: 'hover:border-red-400/60 hover:shadow-red-500/10',
    urlPrefix: 'https://g.page/r/',
    placeholderHandle: 'g.page/r/your-id',
    placeholderUrl: 'https://g.page/r/your-id/review',
    defaultDescription: 'Rate our services and share your experience on Google',
  },
  other: {
    id: 'other',
    name: 'Custom Link / Social',
    defaultBadge: 'Explore',
    brandColor: '#8B5CF6',
    accentBg: 'bg-purple-600',
    gradient: 'from-violet-600 to-fuchsia-600',
    borderHover: 'hover:border-purple-400/60 hover:shadow-purple-500/10',
    urlPrefix: 'https://',
    placeholderHandle: 'My Link',
    placeholderUrl: 'https://linktr.ee/rajeshroyalsalon',
    defaultDescription: 'Custom social link, portfolio showcase or digital catalog',
  },
};

/**
 * Ensures customer has an active list of SocialAccountItem thumbnails.
 * Converts legacy customer.socials into visual thumbnail cards if socialAccounts is not populated.
 */
export function getCustomerSocialAccounts(customer: Customer): SocialAccountItem[] {
  if (customer.socialAccounts && customer.socialAccounts.length > 0) {
    return customer.socialAccounts;
  }

  const generated: SocialAccountItem[] = [];
  const socials = customer.socials || {};

  if (socials.instagram) {
    const handle = extractHandle(socials.instagram, 'instagram');
    generated.push({
      id: 'soc-ig-def',
      platform: 'instagram',
      title: 'Instagram',
      handleOrUsername: handle,
      url: socials.instagram,
      description: 'Follow for styling transformations, behind the scenes & reels',
      thumbnailUrl: customer.avatarUrl,
      followerCount: '12.8K followers',
      badgeText: 'Follow',
      verified: true,
    });
  }

  if (socials.linkedin) {
    const handle = extractHandle(socials.linkedin, 'linkedin');
    generated.push({
      id: 'soc-li-def',
      platform: 'linkedin',
      title: 'LinkedIn',
      handleOrUsername: handle,
      url: socials.linkedin,
      description: 'Connect with our leadership for business partnerships & inquiries',
      thumbnailUrl: customer.avatarUrl,
      followerCount: '500+ connections',
      badgeText: 'Connect',
      verified: true,
    });
  }

  if (socials.facebook) {
    const handle = extractHandle(socials.facebook, 'facebook');
    generated.push({
      id: 'soc-fb-def',
      platform: 'facebook',
      title: 'Facebook',
      handleOrUsername: handle,
      url: socials.facebook,
      description: 'Official community page with customer reviews & photo gallery',
      thumbnailUrl: customer.logoUrl || customer.avatarUrl,
      followerCount: '8.4K likes',
      badgeText: 'Like & Follow',
      verified: false,
    });
  }

  if (socials.youtube) {
    generated.push({
      id: 'soc-yt-def',
      platform: 'youtube',
      title: 'YouTube',
      handleOrUsername: `@${customer.businessName.replace(/[^a-zA-Z0-9]/g, '')}`,
      url: socials.youtube,
      description: 'Watch tutorials, customer reviews & service overviews',
      thumbnailUrl: customer.bannerUrl || customer.avatarUrl,
      followerCount: '3.2K subscribers',
      badgeText: 'Subscribe',
      verified: true,
    });
  }

  if (socials.twitter) {
    const handle = extractHandle(socials.twitter, 'twitter');
    generated.push({
      id: 'soc-tw-def',
      platform: 'twitter',
      title: 'X (Twitter)',
      handleOrUsername: handle,
      url: socials.twitter,
      description: 'Live updates, industry insights & customer announcements',
      thumbnailUrl: customer.avatarUrl,
      followerCount: '2.1K followers',
      badgeText: 'Follow on X',
      verified: false,
    });
  }

  return generated;
}

/**
 * Extracts clean handle from URL or returns clean username
 */
export function extractHandle(urlOrHandle: string, platform: SocialPlatform): string {
  if (!urlOrHandle) return '';
  const clean = urlOrHandle.trim().replace(/^@/, '');

  let urlCandidate = clean;
  if (/^(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\//i.test(clean) && !clean.startsWith('http')) {
    urlCandidate = `https://${clean}`;
  }

  try {
    if (urlCandidate.startsWith('http://') || urlCandidate.startsWith('https://')) {
      const parsedUrl = new URL(urlCandidate);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        if (platform === 'linkedin' && segments[0] === 'in' && segments[1]) {
          return `in/${segments[1]}`;
        }
        return `@${segments[segments.length - 1]}`;
      }
    }
  } catch {
    // If not a valid URL, treat as raw handle
  }
  return clean.startsWith('@') ? clean : `@${clean}`;
}

/**
 * Formats full URL from handle if not starting with http
 */
export function buildProfileUrl(handleOrUrl: string, platform: SocialPlatform): string {
  const trimmed = handleOrUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const domainPatterns: Record<string, RegExp> = {
    instagram: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i,
    linkedin: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\//i,
    facebook: /^(?:https?:\/\/)?(?:www\.)?facebook\.com\//i,
    youtube: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\//i,
    twitter: /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\//i,
    telegram: /^(?:https?:\/\/)?(?:www\.)?t\.me\//i,
    threads: /^(?:https?:\/\/)?(?:www\.)?threads\.net\//i,
    github: /^(?:https?:\/\/)?(?:www\.)?github\.com\//i,
    pinterest: /^(?:https?:\/\/)?(?:www\.)?pinterest\.com\//i,
  };

  const pattern = domainPatterns[platform];
  if (pattern && pattern.test(trimmed)) {
    const stripped = trimmed.replace(pattern, '').replace(/^@/, '');
    const prefix = SOCIAL_PLATFORMS[platform]?.urlPrefix || 'https://';
    return `${prefix}${stripped}`;
  }

  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }

  const cleanHandle = trimmed.replace(/^@/, '');
  const prefix = SOCIAL_PLATFORMS[platform]?.urlPrefix || 'https://';
  return `${prefix}${cleanHandle}`;
}
