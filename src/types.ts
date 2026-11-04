/**
 * Core Type Definitions for Advanced Visiting Card (Mini Website)
 */

export type BusinessCategory =
  | "Barber Shop"
  | "Men's Clothing Shop"
  | "Women's Clothing Shop"
  | "Doctor / Clinic"
  | "Real Estate Consultant"
  | "Financial Consultant"
  | "Legal Services"
  | "Fitness & Wellness Coach"
  | "Restaurant & Cafe"
  | "Freelance Designer / Developer"
  | "Automobile & Detailing"
  | "General Service Provider"
  | "Other"
  | (string & {});

export interface Address {
  shopNumber: string;
  areaLocality: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  googleMapsUrl?: string;
}

export type SocialPlatform =
  | 'instagram'
  | 'linkedin'
  | 'facebook'
  | 'youtube'
  | 'twitter'
  | 'whatsapp_channel'
  | 'telegram'
  | 'threads'
  | 'github'
  | 'pinterest'
  | 'website'
  | 'google_reviews'
  | 'other';

export interface SocialAccountItem {
  id: string;
  platform: SocialPlatform;
  title: string;
  handleOrUsername: string;
  url: string;
  description?: string;
  thumbnailUrl?: string;
  followerCount?: string;
  badgeText?: string;
  verified?: boolean;
}

export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  twitter?: string;
  website?: string;
  github?: string;
}

export interface ProductService {
  id: string;
  title: string;
  description: string;
  price: string;
  priceType: 'fixed' | 'starting_at' | 'contact';
  imageUrl: string;
  imageUrl2?: string;
  ctaText: string;
  category?: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company?: string;
  content: string;
  rating: number; // 1 to 5
  avatarUrl?: string;
}

export type MiniWebsiteThemeId =
  | 'royal-indigo'     // Executive Royal (Midnight Indigo & Sapphire)
  | 'emerald-luxe'    // Emerald Luxe (Imperial Emerald & Mint Jade)
  | 'rose-gold'       // Rose Gold & Champagne (Luxury Blush & Warm Amber)
  | 'obsidian-noir'   // Obsidian Noir (Titanium Charcoal & Pure Platinum)
  | 'sunset-amber';   // Sunset Amber & Coral (Warm Golden Terracotta)

export interface Customer {
  id: string;
  slug?: string; // Custom shop handle/subdomain (e.g. 'sharma-sweets')
  aliases?: string[]; // Alternative handles/slugs (e.g. ['jack7jones', 'jack-7-jones', 'j-7-jones'])
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  businessName: string;
  businessCategory: BusinessCategory;
  jobTitle: string;
  headline: string;
  bio: string;
  address: Address;
  avatarUrl: string;
  logoUrl?: string;
  bannerUrl?: string;
  whatsappNumber: string;
  websiteUrl?: string;
  businessHours: string;
  products: ProductService[];
  socials: SocialLinks;
  socialAccounts?: SocialAccountItem[];
  testimonials: Testimonial[];
  themeId?: MiniWebsiteThemeId;
  paymentQrUrl?: string;
  upiId?: string;
  planTier?: '499_1yr' | '999_3yr';
  status: 'active' | 'inactive';
  isPaid: boolean;
  paymentAmount?: number;
  paidAt?: string;
  planExpiresAt?: string;
  paymentMethod?: string;
  referredBy?: string;
  createdAt: string;
  updatedAt?: string;
  viewCount: number;
  inquiriesCount: number;
  inquiries?: Inquiry[];
}

export interface Inquiry {
  id: string;
  customerId: string;
  customerBusinessName?: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  serviceInterested?: string;
  createdAt: string;
  status: 'new' | 'contacted';
}

export type AppView =
  | 'landing'
  | 'auth'
  | 'customer-portal'
  | 'public-card'
  | 'admin';
