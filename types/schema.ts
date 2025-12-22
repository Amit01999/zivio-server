import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User roles enum
export const userRoles = ['buyer', 'seller', 'broker', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

// Property types enum
export const propertyTypes = [
  'apartment',
  'house',
  'flat',
  'land',
  'commercial',
  'office',
  'shop',
] as const;
export type PropertyType = (typeof propertyTypes)[number];

// Listing types enum (renamed from priceTypes)
export const listingTypes = ['sale', 'rent'] as const;
export type ListingType = (typeof listingTypes)[number];

// Completion status enum
export const completionStatuses = ['ready', 'under_construction'] as const;
export type CompletionStatus = (typeof completionStatuses)[number];

// Furnishing status enum
export const furnishingStatuses = ['furnished', 'semi_furnished', 'unfurnished'] as const;
export type FurnishingStatus = (typeof furnishingStatuses)[number];

// Seller types enum
export const sellerTypes = ['owner', 'agent'] as const;
export type SellerType = (typeof sellerTypes)[number];

// Listing status enum
export const listingStatuses = [
  'draft',
  'pending',
  'published',
  'sold',
  'rented',
  'rejected',
] as const;
export type ListingStatus = (typeof listingStatuses)[number];

// Payment status enum
export const paymentStatuses = [
  'pending',
  'completed',
  'failed',
  'refunded',
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

// Bangladesh cities
export const bangladeshCities = [
  'Dhaka',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Comilla',
  'Gazipur',
  'Narayanganj',
  "Cox's Bazar",
] as const;
export type BangladeshCity = (typeof bangladeshCities)[number];

// Dhaka areas
export const dhakaAreas = [
  'Gulshan',
  'Banani',
  'Dhanmondi',
  'Uttara',
  'Bashundhara',
  'Mirpur',
  'Mohammadpur',
  'Tejgaon',
  'Motijheel',
  'Badda',
  'Baridhara',
  'Niketan',
  'Lalmatia',
  'Shantinagar',
  'Wari',
] as const;

// Common amenities
export const amenitiesList = [
  'Parking',
  'Elevator',
  'Generator',
  'Security',
  'Gym',
  'Swimming Pool',
  'Rooftop',
  'Garden',
  'Balcony',
  'AC',
  'Furnished',
  'Semi-furnished',
  'Gas',
  'Water Supply',
  'Internet',
] as const;

// ==================== USERS ====================
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<UserRole>().notNull().default('buyer'),
  verified: boolean('verified').notNull().default(false),
  profilePhotoUrl: text('profile_photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    passwordHash: true,
  })
  .extend({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'passwordHash'>;

// ==================== BROKERS ====================
export const brokers = pgTable('brokers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  agencyName: text('agency_name'),
  licenseNo: text('license_no'),
  nid: text('nid'),
  address: text('address'),
  description: text('description'),
  socialLinks: jsonb('social_links').$type<{
    facebook?: string;
    linkedin?: string;
    website?: string;
  }>(),
  verified: boolean('verified').notNull().default(false),
  rating: real('rating').default(0),
  reviewCount: integer('review_count').default(0),
  commissionRate: real('commission_rate').default(2.5),
  totalListings: integer('total_listings').default(0),
  totalDeals: integer('total_deals').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertBrokerSchema = createInsertSchema(brokers).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
  totalListings: true,
  totalDeals: true,
});

export type InsertBroker = z.infer<typeof insertBrokerSchema>;
export type Broker = typeof brokers.$inferSelect;

// ==================== LISTINGS ====================
// export const listings = pgTable("listings", {
//   id: varchar("id", { length: 36 }).primaryKey(),
//   title: text("title").notNull(),
//   slug: text("slug").notNull().unique(),
//   description: text("description"),
//   price: integer("price").notNull(),
//   priceType: text("price_type").$type<PriceType>().notNull(),
//   propertyType: text("property_type").$type<PropertyType>().notNull(),
//   bedrooms: integer("bedrooms"),
//   bathrooms: integer("bathrooms"),
//   areaSqFt: integer("area_sq_ft"),
//   address: text("address").notNull(),
//   city: text("city").notNull(),
//   district: text("district"),
//   area: text("area"),
//   coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
//   images: text("images").array(),
//   floorPlanUrl: text("floor_plan_url"),
//   videoUrl: text("video_url"),
//   amenities: text("amenities").array(),
//   postedBy: varchar("posted_by", { length: 36 }).notNull(),
//   brokerId: varchar("broker_id", { length: 36 }),
//   isFeatured: boolean("is_featured").notNull().default(false),
//   isVerified: boolean("is_verified").notNull().default(false),
//   status: text("status").$type<ListingStatus>().notNull().default("draft"),
//   views: integer("views").default(0),
//   favorites: integer("favorites").default(0),
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });

// export const insertListingSchema = createInsertSchema(listings).omit({
//   id: true,
//   slug: true,
//   createdAt: true,
//   updatedAt: true,
//   views: true,
//   favorites: true,
// });

export const listings = pgTable('listings', {
  /* ================= CORE (IMPORTANT) ================= */

  id: varchar('id', { length: 36 }).primaryKey(),

  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),

  price: text('price').notNull(), // Supports both numeric and text values (e.g., "Contact for Price")
  listingType: text('listing_type').$type<ListingType>().notNull(),
  pricePerSqft: integer('price_per_sqft'),

  propertyType: text('property_type').$type<PropertyType>().notNull(),
  propertySubType: text('property_sub_type'),

  address: text('address').notNull(),
  city: text('city').notNull(),
  postedBy: varchar('posted_by', { length: 36 }).notNull(),

  /* ================= OPTIONAL CONTENT ================= */

  description: text('description'),

  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  areaSqFt: integer('area_sq_ft'),

  district: text('district'),
  area: text('area'),

  /* ================= PROPERTY DETAILS ================= */

  completionStatus: text('completion_status').$type<CompletionStatus>(),
  furnishingStatus: text('furnishing_status').$type<FurnishingStatus>(),
  negotiable: boolean('negotiable').default(false),
  unitType: text('unit_type'),

  /* ================= BUILDING DETAILS ================= */

  floor: integer('floor'),
  totalFloors: integer('total_floors'),
  parkingCount: integer('parking_count'),
  facing: text('facing'),
  balconies: integer('balconies'),
  servantRoom: boolean('servant_room').default(false),
  servantBathroom: boolean('servant_bathroom').default(false),

  /* ================= SECURITY & AMENITY BOOLEANS ================= */

  security24x7: boolean('security_24x7').default(false),
  cctv: boolean('cctv').default(false),
  generatorBackup: boolean('generator_backup').default(false),
  fireSafety: boolean('fire_safety').default(false),
  liftAvailable: boolean('lift_available').default(false),

  /* ================= LOCATION ================= */

  coordinates: jsonb('coordinates').$type<{ lat: number; lng: number }>(),

  /* ================= MEDIA ================= */

  images: text('images').array(),
  floorPlanUrl: text('floor_plan_url'),
  videoUrl: text('video_url'),

  /* ================= FEATURES ================= */

  amenities: text('amenities').array(),

  /* ================= SELLER INFO ================= */

  sellerName: text('seller_name'),
  sellerType: text('seller_type').$type<SellerType>(),

  /* ================= CONTACT & COMMUNICATION ================= */

  contactPhone: text('contact_phone'),
  isPhoneHidden: boolean('is_phone_hidden').default(false),
  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  chatEnabled: boolean('chat_enabled').default(true),
  brokerId: varchar('broker_id', { length: 36 }),

  /* ================= PLATFORM FLAGS ================= */

  isFeatured: boolean('is_featured').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(false),

  status: text('status').$type<ListingStatus>().notNull().default('draft'),

  views: integer('views').default(0),
  favorites: integer('favorites').default(0),
  reportCount: integer('report_count').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
export const insertListingSchema = createInsertSchema(listings)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    views: true,
    favorites: true,
    reportCount: true,
  })
  .extend({
    // Override price to accept both number and string
    price: z.union([
      z.number().min(1, 'Price must be greater than 0'),
      z.string().min(1, 'Price is required')
    ]).transform((val) => {
      // Convert numbers to strings for database storage
      return typeof val === 'number' ? val.toString() : val;
    }),
  });

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// ==================== FAVORITES ====================
export const favorites = pgTable('favorites', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  listingId: varchar('listing_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// ==================== SAVED SEARCHES ====================
export const savedSearches = pgTable('saved_searches', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  name: text('name').notNull(),
  filters: jsonb('filters').$type<SearchFilters>(),
  emailAlerts: boolean('email_alerts').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
});

export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

// ==================== MESSAGES ====================
export const messages = pgTable('messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  fromUserId: varchar('from_user_id', { length: 36 }).notNull(),
  toUserId: varchar('to_user_id', { length: 36 }).notNull(),
  listingId: varchar('listing_id', { length: 36 }),
  text: text('text').notNull(),
  attachments: text('attachments').array(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// ==================== CONVERSATIONS ====================
export const conversations = pgTable('conversations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  participantIds: text('participant_ids').array().notNull(),
  listingId: varchar('listing_id', { length: 36 }),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;

// ==================== REVIEWS ====================
export const reviews = pgTable('reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  reviewerId: varchar('reviewer_id', { length: 36 }).notNull(),
  brokerId: varchar('broker_id', { length: 36 }),
  listingId: varchar('listing_id', { length: 36 }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    rating: z.number().min(1).max(5),
  });

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// ==================== TRANSACTIONS ====================
export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  listingId: varchar('listing_id', { length: 36 }),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('BDT'),
  gateway: text('gateway'),
  type: text('type').$type<'featured' | 'promotion' | 'commission'>().notNull(),
  status: text('status').$type<PaymentStatus>().notNull().default('pending'),
  paymentDetails: jsonb('payment_details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ==================== VIEWING REQUESTS ====================
export const viewingRequests = pgTable('viewing_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  listingId: varchar('listing_id', { length: 36 }).notNull(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  preferredDate: timestamp('preferred_date').notNull(),
  preferredTime: text('preferred_time'),
  message: text('message'),
  status: text('status')
    .$type<'pending' | 'confirmed' | 'cancelled' | 'completed'>()
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertViewingRequestSchema = createInsertSchema(
  viewingRequests
).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertViewingRequest = z.infer<typeof insertViewingRequestSchema>;
export type ViewingRequest = typeof viewingRequests.$inferSelect;

// ==================== PROPERTY INQUIRIES ====================
export const inquiryTypes = ['viewing', 'buy', 'meeting'] as const;
export type InquiryType = (typeof inquiryTypes)[number];

export const inquiryStatuses = ['new', 'contacted', 'closed'] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const propertyInquiries = pgTable('property_inquiries', {
  id: varchar('id', { length: 36 }).primaryKey(),
  requestType: text('request_type').$type<InquiryType>().notNull(),
  propertyId: varchar('property_id', { length: 36 }).notNull(),
  buyerId: varchar('buyer_id', { length: 36 }).notNull(),
  message: text('message'),
  status: text('status').$type<InquiryStatus>().notNull().default('new'),
  metadata: jsonb('metadata').$type<{
    preferredDate?: Date;
    preferredTime?: string;
    contactPhone?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertPropertyInquirySchema = createInsertSchema(propertyInquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyInquiry = z.infer<typeof insertPropertyInquirySchema>;
export type PropertyInquiry = typeof propertyInquiries.$inferSelect;

// ==================== COMPARISON CART ====================
export const comparisonCarts = pgTable('comparison_carts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().unique(),
  listingIds: text('listing_ids').array().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertComparisonCartSchema = createInsertSchema(comparisonCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComparisonCart = z.infer<typeof insertComparisonCartSchema>;
export type ComparisonCart = typeof comparisonCarts.$inferSelect;

// ==================== SEARCH FILTERS ====================
export interface SearchFilters {
  q?: string;
  city?: string;
  area?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  category?: string; // Derived category filter
  completionStatus?: CompletionStatus;
  furnishingStatus?: FurnishingStatus;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  isFeatured?: boolean;
  isVerified?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular';
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  radius?: number;
}

// ==================== API RESPONSE TYPES ====================
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListingWithBroker extends Listing {
  broker?: Broker & { user?: SafeUser };
  user?: SafeUser;
}

export interface ConversationWithDetails extends Conversation {
  participants: SafeUser[];
  listing?: Listing;
  lastMessage?: Message;
  unreadCount: number;
}

export interface MessageWithSender extends Message {
  sender: SafeUser;
}

export interface ReviewWithUser extends Review {
  reviewer: SafeUser;
}

export interface PropertyInquiryWithDetails extends PropertyInquiry {
  property?: Listing;
  buyer?: SafeUser;
}

export interface ComparisonCartWithListings extends ComparisonCart {
  listings: Listing[];
}

// ==================== AUTH TYPES ====================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends InsertUser {
  confirmPassword?: string;
}

// Form validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(userRoles).default('buyer'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const listingFormSchema = z.object({
  // Core
  title: z.string().min(10, 'Title must be at least 10 characters'),
  listingType: z.enum(listingTypes),
  propertyType: z.enum(propertyTypes),
  propertySubType: z.string().optional(),
  description: z.string().min(50, 'Description must be at least 50 characters').optional(),

  // Pricing
  price: z.union([
    z.number().min(1, 'Price must be greater than 0'),
    z.string().min(1, 'Price is required')
  ]),
  pricePerSqft: z.number().optional(),
  negotiable: z.boolean().optional(),

  // Property Details
  areaSqFt: z.number().min(1, 'Area is required'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  completionStatus: z.enum(completionStatuses).optional(),
  furnishingStatus: z.enum(furnishingStatuses).optional(),
  unitType: z.string().optional(),

  // Building Details
  floor: z.number().optional(),
  totalFloors: z.number().optional(),
  parkingCount: z.number().optional(),
  facing: z.string().optional(),
  balconies: z.number().optional(),
  servantRoom: z.boolean().optional(),
  servantBathroom: z.boolean().optional(),

  // Security/Amenities (Boolean)
  security24x7: z.boolean().optional(),
  cctv: z.boolean().optional(),
  generatorBackup: z.boolean().optional(),
  fireSafety: z.boolean().optional(),
  liftAvailable: z.boolean().optional(),

  // Location
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional(),
  area: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),

  // Media
  images: z.array(z.string()).min(1, 'At least one image is required'),
  floorPlanUrl: z.string().optional(),
  videoUrl: z.string().optional(),

  // Amenities
  amenities: z.array(z.string()).optional(),

  // Seller Info
  sellerName: z.string().optional(),
  sellerType: z.enum(sellerTypes).optional(),

  // Contact/Communication
  contactPhone: z.string().optional(),
  isPhoneHidden: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  chatEnabled: z.boolean().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
