
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  dob?: string;
  isGuest?: boolean;
  favorites?: string[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategories: string[]; // Changed from subcategory: string to support multiple
  province: string;
  canton: string;
  contactName: string;
  whatsappNumber: string;
  whatsappMessage?: string;
  imageUrl: string;
  gallery: string[];
  promoVideoUrl?: string;
  mapsUrl?: string;
  socialUrl?: string; // Kept for backward compatibility
  socialUrls?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  };
  highlights: string[];
  status: 'active' | 'suspended';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  createdAt: string;
  clicks?: number; // Added to track popularity
  subcategory?: string; // Kept for backward compatibility when reading old data
}

export interface Category {
  id: string; // The firestore document ID
  name: string;
  icon: string;
  subcategories: string[];
  translationKey: string;
  // Dynamic UI properties
  imageUrl?: string; // Replaces icon in Home carousel
  imagePosition?: string; // e.g. 'center', 'top-left'
  bgColor?: string; // Fallback or active color
  subcategoryConfig?: Record<string, {
    bgImage?: string;
    bgOpacity?: number;
    bgPosition?: string;
  }>;
  order?: number;
}

export type ViewState =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'register'
  | 'profile' // New profile view
  | 'home'
  | 'geo-select'
  | 'geo-region'
  | 'geo-province'
  | 'geo-city'
  | 'subcategory-select'
  | 'service-list'
  | 'service-detail'
  | 'admin-dashboard'
  | 'admin-create'
  | 'ai-chat'
  | 'favorites'
  | 'contact-admin'
  | 'notifications'
  | 'search'
  | 'legal'
  | 'admin-advanced';

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  tags: string[];
  imageUrl?: string;
  target: 'all' | 'location';
  targetProvince?: string;
  targetCanton?: string;
  scheduledTime: string;
  createdAt: string;
  active: boolean;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  expiresAt?: string; // ISO Date string for auto-expiration
}

export interface RegionTheme {
  imageUrl: string;
  // Header
  headerBgColor: string;
  headerTextColor: string;
  // Buttons (Back/Admin)
  navButtonBgColor: string;
  navButtonIconColor: string;
  // General/Accents
  accentColor: string; // For "COSTA", "SIERRA" titles
  arrowColor: string; // Floating chevron
  // List/Cards
  cardGradientStart: string;
  cardGradientEnd: string;
  cardTextColor: string; // Province/City names
  cardIconColor: string;
  cardIconBgColor: string;
  themeBg?: string;
}

export type RegionConfig = Record<string, RegionTheme>;
