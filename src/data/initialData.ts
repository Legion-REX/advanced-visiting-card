import { Customer, Inquiry } from '../types';

/**
 * Dedicated Testing Profile for Live Addons & Feature Verification.
 * All other dummy profiles are removed as requested.
 * Testing Credentials:
 *   Email: test@biowebsite.com (or demo@biowebsite.com)
 *   Phone: +91 98201 54321 (or 9820154321)
 *   Password: 123456
 */
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'test-profile-01',
    slug: 'royal-salon',
    aliases: ['demo', 'demo-business', 'royal-salon', 'test'],
    firstName: 'Rajesh',
    lastName: 'Sharma',
    email: 'test@biowebsite.com',
    phone: '+91 98201 54321',
    password: '123456',
    businessName: 'Rajesh Royal Men’s Salon & Grooming',
    businessCategory: 'Barber Shop',
    jobTitle: 'Master Grooming Specialist & Founder',
    headline: 'Precision Haircuts, Beard Sculpting, Facials & Royal Grooming',
    bio: 'With over 14 years of professional grooming expertise, Rajesh Royal Salon provides world-class hair styling, beard sculpting, organic charcoal facials, and traditional hot towel grooming in Mumbai.',
    address: {
      shopNumber: 'Shop No. 14, Ground Floor, Royal Arcade',
      areaLocality: 'LBS Marg, Kurla West',
      landmark: 'Opposite Phoenix Marketcity Mall Gate 2',
      pincode: '400070',
      city: 'Mumbai',
      state: 'Maharashtra',
      googleMapsUrl: 'https://maps.google.com/?q=Phoenix+Marketcity+Mumbai',
    },
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80',
    whatsappNumber: '+919820154321',
    websiteUrl: 'https://royalsalon.in',
    upiId: 'rajeshroyalsalon@okaxis',
    businessHours: 'Mon - Sun: 9:00 AM - 9:30 PM',
    themeId: 'royal-indigo',
    planTier: '499_1yr',
    status: 'active',
    isPaid: true,
    paymentAmount: 499,
    paymentMethod: 'Razorpay',
    paidAt: '2026-09-22T00:00:00.000Z',
    createdAt: '2026-08-12T10:30:00.000Z',
    viewCount: 428,
    inquiriesCount: 19,
    products: [
      {
        id: 'prod-1',
        title: 'Executive Royal Cut & Beard Sculpt',
        description: 'Bespoke precision scissor cut, hot steam lavender towel, beard shaping with straight razor finish and revitalizing balm.',
        price: '₹499',
        priceType: 'fixed',
        imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
        ctaText: 'Book Chair',
        category: 'Services',
      },
      {
        id: 'prod-2',
        title: 'Ayurvedic Sandalwood Beard Oil (50ml)',
        description: 'Hand-crafted cold-pressed argan and jojoba oils infused with wild Mysore sandalwood to nourish follicles.',
        price: '₹349',
        priceType: 'fixed',
        imageUrl: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=600&auto=format&fit=crop&q=80',
        ctaText: 'Reserve Bottle',
        category: 'Products',
      },
      {
        id: 'prod-3',
        title: 'Father & Son Royal Grooming Package',
        description: 'Dual bespoke cuts paired with classic herbal shampooing, pomade styling and relaxing scalp massage.',
        price: '₹899',
        priceType: 'fixed',
        imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
        ctaText: 'Book Combo',
        category: 'Packages',
      },
    ],
    socials: {
      instagram: 'https://instagram.com/rajeshroyalsalon',
      facebook: 'https://facebook.com/rajeshroyalsalon',
      youtube: 'https://youtube.com',
      website: 'https://royalsalon.in',
      twitter: 'https://x.com',
    },
    socialAccounts: [
      {
        id: 'soc-rs-1',
        platform: 'instagram',
        title: 'Instagram',
        handleOrUsername: '@rajesh_royalsalon',
        url: 'https://instagram.com/rajeshroyalsalon',
        description: 'Daily haircut & beard transformation reels, celebrity styles & tips.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        followerCount: '18.4K followers',
        badgeText: 'Follow on Instagram',
        verified: true,
      },
      {
        id: 'soc-rs-2',
        platform: 'youtube',
        title: 'YouTube',
        handleOrUsername: '@RoyalSalonMumbai',
        url: 'https://youtube.com',
        description: 'Barbering masterclasses, skin fade tutorials & salon walkthroughs.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop&q=80',
        followerCount: '5.2K subscribers',
        badgeText: 'Subscribe',
        verified: true,
      },
      {
        id: 'soc-rs-3',
        platform: 'facebook',
        title: 'Facebook',
        handleOrUsername: 'facebook.com/rajeshroyalsalon',
        url: 'https://facebook.com/rajeshroyalsalon',
        description: 'Customer community reviews, festive offers & client gallery.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        followerCount: '9.1K likes',
        badgeText: 'Like Page',
        verified: false,
      },
      {
        id: 'soc-rs-4',
        platform: 'whatsapp_channel',
        title: 'WhatsApp Channel',
        handleOrUsername: 'Royal Grooming Club',
        url: 'https://whatsapp.com/channel/0029VaRoyal123',
        description: 'Instant weekend slot openings & VIP grooming product flash discounts.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80',
        followerCount: '1.8K members',
        badgeText: 'Join Channel',
        verified: true,
      },
    ],
    testimonials: [
      {
        id: 'test-1',
        author: 'Rohan Mehta',
        role: 'Marketing Director',
        company: 'Apex Media Mumbai',
        content: 'Rajesh is hands down the finest master barber in Mumbai. The hot towel beard sculpt is an absolute gamechanger before important client meetings.',
        rating: 5,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'test-2',
        author: 'Arjun Kapoor',
        role: 'Tech Lead',
        company: 'Fintech Solutions',
        content: 'I share Rajesh’s digital mini card with all my colleagues looking for a top-tier haircut. 1-tap WhatsApp booking is completely seamless.',
        rating: 5,
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      },
    ],
  },
];

/**
 * Dedicated Static Dummy Demo Profile
 * Always used for public demo previews so that real customer profiles
 * registered via Super Admin or local storage are never leaked or used as demo.
 */
export const DEMO_DUMMY_CUSTOMER: Customer = {
  ...INITIAL_CUSTOMERS[0],
  id: 'demo-dummy-card',
  slug: 'demo',
  status: 'active',
  isPaid: true,
};

export const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 'inq-01',
    customerId: 'test-profile-01',
    customerBusinessName: 'Rajesh Royal Men’s Salon & Grooming',
    senderName: 'Rahul Joshi',
    senderEmail: 'rahul.joshi@gmail.com',
    senderPhone: '+91 99887 76655',
    message: 'Hello Rajesh, we would like to book wedding grooming and styling for 5 guests this Saturday. Are appointment slots available?',
    serviceInterested: 'Executive Royal Cut & Beard Sculpt',
    createdAt: '2026-09-13T09:45:00.000Z',
    status: 'new',
  },
];
