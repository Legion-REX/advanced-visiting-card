import { MiniWebsiteThemeId } from '../types';

export interface MiniWebsiteTheme {
  id: MiniWebsiteThemeId;
  name: string;
  tagline: string;
  badge: string;
  previewColors: string[];
  pageBg: string;
  pageBgDark: string;
  orbColor1: string;
  orbColor2: string;
  orbColor3: string;
  cardBorder: string;
  cardBorderDark: string;
  bannerGradient: string;
  accentText: string;
  accentTextDark: string;
  accentBadge: string;
  primaryBtn: string;
  iconBg: string;
  iconText: string;
  glowColor: string;
}

export const MINI_WEBSITE_THEMES: Record<MiniWebsiteThemeId, MiniWebsiteTheme> = {
  'royal-indigo': {
    id: 'royal-indigo',
    name: 'Executive Royal',
    tagline: 'Prestigious sapphire and royal indigo frosted glass for corporate executives & tech leaders',
    badge: 'Corporate & Tech',
    previewColors: ['#4f46e5', '#3b82f6', '#1e1b4b'],
    pageBg: 'from-slate-100 via-indigo-50/50 to-blue-100/50',
    pageBgDark: 'dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/60',
    orbColor1: 'rgba(99, 102, 241, 0.28)',
    orbColor2: 'rgba(59, 130, 246, 0.24)',
    orbColor3: 'rgba(139, 92, 246, 0.22)',
    cardBorder: 'border-indigo-200/60',
    cardBorderDark: 'dark:border-indigo-500/20',
    bannerGradient: 'from-indigo-950 via-slate-950 to-blue-950',
    accentText: 'text-indigo-600',
    accentTextDark: 'dark:text-indigo-400',
    accentBadge: 'bg-indigo-500/15 border-indigo-300/50 text-indigo-700 dark:text-indigo-300',
    primaryBtn: 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25',
    iconBg: 'bg-indigo-500/15 border-indigo-500/30',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    glowColor: 'rgba(79, 70, 229, 0.25)',
  },
  'emerald-luxe': {
    id: 'emerald-luxe',
    name: 'Emerald Luxe',
    tagline: 'Deep imperial emerald and luminous jade for health, clinics, real estate & eco leaders',
    badge: 'Medical & Property',
    previewColors: ['#059669', '#10b981', '#064e3b'],
    pageBg: 'from-emerald-50/70 via-teal-50/40 to-slate-100',
    pageBgDark: 'dark:from-slate-950 dark:via-emerald-950/40 dark:to-slate-900',
    orbColor1: 'rgba(16, 185, 129, 0.28)',
    orbColor2: 'rgba(20, 184, 166, 0.24)',
    orbColor3: 'rgba(5, 150, 105, 0.22)',
    cardBorder: 'border-emerald-200/60',
    cardBorderDark: 'dark:border-emerald-500/20',
    bannerGradient: 'from-emerald-950 via-slate-950 to-teal-950',
    accentText: 'text-emerald-600',
    accentTextDark: 'dark:text-emerald-400',
    accentBadge: 'bg-emerald-500/15 border-emerald-300/50 text-emerald-700 dark:text-emerald-300',
    primaryBtn: 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  'rose-gold': {
    id: 'rose-gold',
    name: 'Rose Gold & Champagne',
    tagline: 'Shimmering blush champagne and rose gold for boutiques, fashion, salons & jewelry',
    badge: 'Fashion & Salon',
    previewColors: ['#e11d48', '#fb7185', '#be185d'],
    pageBg: 'from-rose-50/80 via-amber-50/40 to-pink-100/50',
    pageBgDark: 'dark:from-slate-950 dark:via-rose-950/40 dark:to-slate-900',
    orbColor1: 'rgba(244, 63, 94, 0.28)',
    orbColor2: 'rgba(251, 113, 133, 0.24)',
    orbColor3: 'rgba(245, 158, 11, 0.22)',
    cardBorder: 'border-rose-200/60',
    cardBorderDark: 'dark:border-rose-500/20',
    bannerGradient: 'from-rose-950 via-slate-950 to-pink-950',
    accentText: 'text-rose-600',
    accentTextDark: 'dark:text-rose-400',
    accentBadge: 'bg-rose-500/15 border-rose-300/50 text-rose-700 dark:text-rose-300',
    primaryBtn: 'bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-500/25',
    iconBg: 'bg-rose-500/15 border-rose-500/30',
    iconText: 'text-rose-600 dark:text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.25)',
  },
  'obsidian-noir': {
    id: 'obsidian-noir',
    name: 'Obsidian Noir & Platinum',
    tagline: 'Smoked glass, titanium graphite and platinum chrome for barbershops, lawyers & architects',
    badge: 'Barber & Executive',
    previewColors: ['#0f172a', '#334155', '#94a3b8'],
    pageBg: 'from-slate-200/90 via-zinc-100 to-slate-300/70',
    pageBgDark: 'dark:from-black dark:via-zinc-950 dark:to-slate-950',
    orbColor1: 'rgba(148, 163, 184, 0.25)',
    orbColor2: 'rgba(51, 65, 85, 0.35)',
    orbColor3: 'rgba(100, 116, 139, 0.22)',
    cardBorder: 'border-slate-300/70',
    cardBorderDark: 'dark:border-slate-700/60',
    bannerGradient: 'from-black via-zinc-900 to-slate-900',
    accentText: 'text-slate-800',
    accentTextDark: 'dark:text-slate-200',
    accentBadge: 'bg-slate-500/15 border-slate-400/40 text-slate-800 dark:text-slate-200',
    primaryBtn: 'bg-gradient-to-r from-zinc-800 via-slate-900 to-black hover:from-zinc-700 hover:to-slate-800 text-white border border-white/20 shadow-lg shadow-slate-900/30',
    iconBg: 'bg-slate-500/15 border-slate-500/30',
    iconText: 'text-slate-700 dark:text-slate-300',
    glowColor: 'rgba(15, 23, 42, 0.3)',
  },
  'sunset-amber': {
    id: 'sunset-amber',
    name: 'Sunset Amber & Coral',
    tagline: 'Radiant golden terracotta and warm amber coral for creative agencies, dining & designers',
    badge: 'Creative & Cafe',
    previewColors: ['#ea580c', '#f59e0b', '#d97706'],
    pageBg: 'from-amber-50/80 via-orange-50/40 to-yellow-50/60',
    pageBgDark: 'dark:from-slate-950 dark:via-amber-950/40 dark:to-slate-900',
    orbColor1: 'rgba(234, 88, 12, 0.28)',
    orbColor2: 'rgba(245, 158, 11, 0.24)',
    orbColor3: 'rgba(225, 29, 72, 0.22)',
    cardBorder: 'border-amber-200/60',
    cardBorderDark: 'dark:border-amber-500/20',
    bannerGradient: 'from-amber-950 via-slate-950 to-orange-950',
    accentText: 'text-amber-600',
    accentTextDark: 'dark:text-amber-400',
    accentBadge: 'bg-amber-500/15 border-amber-300/50 text-amber-700 dark:text-amber-300',
    primaryBtn: 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    glowColor: 'rgba(234, 88, 12, 0.25)',
  },
};

export const THEME_LIST = Object.values(MINI_WEBSITE_THEMES);

export function getMiniWebsiteTheme(themeId?: MiniWebsiteThemeId): MiniWebsiteTheme {
  if (themeId && MINI_WEBSITE_THEMES[themeId]) {
    return MINI_WEBSITE_THEMES[themeId];
  }
  return MINI_WEBSITE_THEMES['royal-indigo'];
}
