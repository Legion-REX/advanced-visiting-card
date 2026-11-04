export interface IndustryGroup {
  groupName: string;
  badge?: string;
  items: string[];
}

export const INDUSTRY_GROUPS: IndustryGroup[] = [
  {
    groupName: 'Fashion, Tailoring & Apparel',
    badge: 'Popular',
    items: [
      'Barber Shop & Men\'s Grooming',
      'Beauty Parlour & Ladies Salon',
      'Women\'s Clothing & Boutique',
      'Men\'s Clothing & Tailoring',
      'Children\'s Clothing & Kids Wear (Child Cloth)',
      'Baby Care & Toddler Apparel',
      'Bridal Wear & Designer Lehenga Studio',
      'Traditional, Sarees & Ethnic Wear',
      'Western Wear, Jeans & Casuals',
      'Footwear, Shoes & Sandal Store',
      'Jewelry & Imitation Ornaments Showroom',
      'Lingerie & Innerwear Boutique',
      'Handbags, Luggage & Leather Goods',
      'Fashion Accessories & Dupatta House',
      'Fabric, Suiting-Shirting & Material',
    ],
  },
  {
    groupName: 'Personal Care, Beauty & Wellness',
    badge: 'Trending',
    items: [
      'Unisex Luxury Salon & Hair Spa',
      'Makeup Artist & Bridal Studio',
      'Nail Art, Lashes & Extensions Bar',
      'Tattoo & Body Piercing Studio',
      'Ayurvedic Spa & Wellness Center',
      'Massage & Holistic Therapy Clinic',
      'Dermatology & Aesthetic Skin Clinic',
      'Perfumes, Attar & Fragrance Store',
      'Gym & Fitness Training Center',
      'Yoga, Pilates & Meditation Studio',
    ],
  },
  {
    groupName: 'Food, Dining, Cafes & Sweets',
    items: [
      'Restaurant & Multi-Cuisine Dining',
      'Cafe, Coffee Shop & Bistro',
      'Bakery, Pastry & Cake Studio',
      'Sweet Shop & Traditional Mithai Mart',
      'Fast Food, Burgers & Pizza Outlet',
      'Street Food & Chaat Corner',
      'Juice Bar, Shakes & Organic Smoothies',
      'Ice Cream Parlour & Gelato Bar',
      'Cloud Kitchen & Daily Tiffin Service',
      'Catering & Banquet Food Services',
      'Pub, Bar, Lounge & Microbrewery',
      'Meat, Chicken & Fresh Seafood Shop',
    ],
  },
  {
    groupName: 'Grocery, Food Mart & Daily Essentials',
    items: [
      'Supermarket & Departmental Store',
      'Kirana & Neighborhood Grocery Mart',
      'Organic & Gourmet Food Store',
      'Fresh Fruits & Vegetable Vendor',
      'Dairy, Milk & Fresh Paneer Parlour',
      'Dry Fruits, Spices & Herbs Mart',
      'Paan, Cigars & Refreshment Shop',
    ],
  },
  {
    groupName: 'Healthcare, Clinics & Medicine',
    items: [
      'Doctor Clinic & General Physician',
      'Dental Clinic & Orthodontics',
      'Pharmacy, Chemist & Medical Store',
      'Eye Care, Optician & Optical Store',
      'Diagnostic Lab, Blood Test & Pathology',
      'Physiotherapy & Sports Rehab Clinic',
      'Homeopathy & Alternative Medicine Clinic',
      'Veterinary Clinic & Pet Hospital',
      'Nutritionist & Dietetics Consultant',
    ],
  },
  {
    groupName: 'Electronics, Mobile Phones & Tech',
    items: [
      'Mobile Phone & Smartphone Store',
      'Mobile Repair, Display & Accessories',
      'Computer, Laptop & Gaming PC Store',
      'Consumer Electronics & TV Showroom',
      'Home Appliances & AC Showroom',
      'Lighting, Chandeliers & Electricals',
      'CCTV, Security Systems & Smart Home Automation',
      'Audio, Speakers & Home Theater Studio',
    ],
  },
  {
    groupName: 'Home Decor, Furniture & Hardware',
    items: [
      'Furniture & Custom Woodwork Showroom',
      'Interior Designer & Architecture Firm',
      'Modular Kitchen & Wardrobe Studio',
      'Home Decor, Curtains & Bedding House',
      'Hardware, Tools & Sanitaryware Store',
      'Paints, Texture & Wallpaper Studio',
      'Tiles, Marbles & Granite Showroom',
      'Glass, Mirrors & Aluminum Fabrication',
      'Mattress & Sleep Comfort Store',
    ],
  },
  {
    groupName: 'Automobile, Bikes & Detailing',
    items: [
      'Car Showroom & Certified Pre-Owned Cars',
      'Two Wheeler & Bike Showroom',
      'Car & Bike Service Garage / Mechanic',
      'Car Wash & Ceramic Detailing Studio',
      'Auto Spare Parts & Car Accessories',
      'Tyres, Wheel Alignment & Battery Station',
      'Bicycle Sales, Gear & Repair Shop',
      'Car Rental, Cabs & Transport Services',
    ],
  },
  {
    groupName: 'Professional, Financial & Corporate',
    items: [
      'Financial Consultant & Mutual Funds Advisor',
      'Chartered Accountant (CA) & Audit Firm',
      'Tax Consultant & GST Filing Services',
      'Real Estate Consultant & Property Broker',
      'Legal Services, Advocate & Notary',
      'Insurance Advisor (Life, Health & Motor)',
      'Digital Marketing & Social Media Agency',
      'Software & Web Development Company',
      'Graphic Design, Branding & Printing Press',
      'Co-Working Space & Shared Office',
    ],
  },
  {
    groupName: 'Education, Coaching & Classes',
    items: [
      'School, College & Pre-School / Daycare',
      'Coaching Center & Competitive Exam Prep',
      'Home Tutor & Online Tutoring Services',
      'Language Classes, Spoken English & IELTS',
      'Music, Guitar & Dance Academy',
      'Martial Arts, Karate & Boxing Club',
      'Art, Painting, Calligraphy & Pottery Classes',
      'Robotics & Coding Classes for Kids',
    ],
  },
  {
    groupName: 'Events, Wedding & Entertainment',
    items: [
      'Event & Wedding Planner',
      'Photography & Cinematography Studio',
      'Banquet Hall & Marriage Resort',
      'DJ, Sound, Lighting & Stage Production',
      'Florist, Flower Shop & Stage Floral Decor',
      'Gifts, Custom Hamper & Toy Store',
      'Books, Stationery & Office Supplies',
      'Sports Equipment & Fitness Gear Shop',
    ],
  },
  {
    groupName: 'Services, Contracting & Maintenance',
    items: [
      'AC, Refrigerator & Washing Machine Repair',
      'Electrician & Electrical Contractor',
      'Plumbing & Water Solution Services',
      'Carpenter & Wood Fabrication Work',
      'Dry Cleaning, Steam Press & Laundry',
      'Deep House Cleaning & Pest Control',
      'Solar Panel & Power Inverter Solutions',
      'Pet Care, Dog Grooming & Boarding',
      'Tour Operator, Visa & Travel Agency',
      'Courier, Cargo & Logistics Services',
      'General Service Provider / Other',
    ],
  },
];

// Flat array of all unique industries for easy lookup and autocomplete
export const ALL_INDUSTRIES: string[] = INDUSTRY_GROUPS.reduce<string[]>(
  (acc, group) => [...acc, ...group.items],
  []
);

// Map legacy / short names to comprehensive names
export const normalizeIndustryName = (name?: string): string => {
  if (!name) return 'Barber Shop & Men\'s Grooming';
  
  const map: Record<string, string> = {
    'Barber Shop': 'Barber Shop & Men\'s Grooming',
    'Barber / Salon': 'Barber Shop & Men\'s Grooming',
    'Beauty Parlour': 'Beauty Parlour & Ladies Salon',
    'Women\'s Clothing Shop': 'Women\'s Clothing & Boutique',
    'Men\'s Clothing Shop': 'Men\'s Clothing & Tailoring',
    'Child Cloth': 'Children\'s Clothing & Kids Wear (Child Cloth)',
    'Children Clothing': 'Children\'s Clothing & Kids Wear (Child Cloth)',
    'Doctor / Clinic': 'Doctor Clinic & General Physician',
    'Real Estate': 'Real Estate Consultant & Property Broker',
    'Real Estate Consultant': 'Real Estate Consultant & Property Broker',
    'Financial Consultant': 'Financial Consultant & Mutual Funds Advisor',
    'Legal Services': 'Legal Services, Advocate & Notary',
    'Fitness & Wellness Coach': 'Gym & Fitness Training Center',
    'Restaurant & Cafe': 'Restaurant & Multi-Cuisine Dining',
    'Freelance Designer / Developer': 'Graphic Design, Branding & Printing Press',
    'Automobile & Detailing': 'Car Wash & Ceramic Detailing Studio',
    'General Service Provider': 'General Service Provider / Other',
    'Other': 'General Service Provider / Other',
  };

  return map[name] || name;
};

// Default high-quality photo assets based on industry keywords
export const getIndustryDefaultAssets = (industry: string) => {
  const ind = industry.toLowerCase();

  // Barber / Salon
  if (ind.includes('barber') || ind.includes('grooming')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Parlour / Ladies Salon / Spa
  if (ind.includes('parlour') || ind.includes('salon') || ind.includes('makeup') || ind.includes('spa')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Women's Clothing / Boutique / Bridal
  if (ind.includes('women') || ind.includes('boutique') || ind.includes('bridal') || ind.includes('lehenga') || ind.includes('saree')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Men's Clothing / Tailoring / Suits
  if (ind.includes('men\'s') || ind.includes('tailor') || ind.includes('suiting')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Children / Kids / Baby
  if (ind.includes('child') || ind.includes('kid') || ind.includes('baby') || ind.includes('toddler')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Food / Restaurant / Cafe / Sweets
  if (ind.includes('restaurant') || ind.includes('cafe') || ind.includes('bakery') || ind.includes('sweet') || ind.includes('food')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Healthcare / Doctor / Dental / Pharmacy
  if (ind.includes('doctor') || ind.includes('dental') || ind.includes('clinic') || ind.includes('pharmacy') || ind.includes('hospital')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Automobile / Detailing / Garage
  if (ind.includes('car') || ind.includes('auto') || ind.includes('bike') || ind.includes('wheel')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Professional / Legal / Finance / Real Estate
  if (ind.includes('financ') || ind.includes('real estate') || ind.includes('law') || ind.includes('consultant') || ind.includes('account')) {
    return {
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    };
  }

  // Default fallback
  return {
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
  };
};
