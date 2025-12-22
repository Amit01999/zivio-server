import type {
  User,
  SafeUser,
  InsertUser,
  Listing,
  InsertListing,
  Broker,
  InsertBroker,
  Favorite,
  InsertFavorite,
  Message,
  InsertMessage,
  Review,
  InsertReview,
  Transaction,
  InsertTransaction,
  ViewingRequest,
  InsertViewingRequest,
  SearchFilters,
  PaginatedResponse,
  ListingWithBroker,
  Conversation,
  ConversationWithDetails
} from './types/schema';

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser & { password: string }): Promise<SafeUser>;
  validatePassword(email: string, password: string): Promise<User | null>;
  getUsers(): Promise<SafeUser[]>;

  // Listing methods
  getListing(id: string): Promise<Listing | undefined>;
  getListingBySlug(slug: string): Promise<ListingWithBroker | undefined>;
  getListings(filters: SearchFilters): Promise<PaginatedResponse<Listing>>;
  getUserListings(userId: string): Promise<PaginatedResponse<Listing>>;
  createListing(data: InsertListing): Promise<Listing>;
  updateListing(id: string, updates: Partial<Listing>): Promise<Listing | undefined>;
  deleteListing(id: string): Promise<boolean>;
  incrementListingViews(id: string): Promise<void>;

  // Broker methods
  getBroker(id: string): Promise<(Broker & { user?: SafeUser }) | undefined>;
  getBrokerByUserId(userId: string): Promise<Broker | undefined>;
  getBrokers(filters?: { city?: string; verified?: boolean }): Promise<(Broker & { user: SafeUser })[]>;
  createBroker(data: InsertBroker): Promise<Broker>;
  updateBroker(id: string, updates: Partial<Broker>): Promise<Broker | undefined>;

  // Favorite methods
  getFavorites(userId: string): Promise<Listing[]>;
  addFavorite(userId: string, listingId: string): Promise<Favorite>;
  removeFavorite(userId: string, listingId: string): Promise<boolean>;
  isFavorited(userId: string, listingId: string): Promise<boolean>;

  // Message/Conversation methods
  getConversations(userId: string): Promise<ConversationWithDetails[]>;
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  getOrCreateConversation(participantIds: string[], listingId?: string): Promise<Conversation>;

  // Review methods
  createReview(data: InsertReview): Promise<Review>;
  getReviews(brokerId: string): Promise<Review[]>;

  // Transaction methods
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: string): Promise<Transaction[]>;

  // Viewing request methods
  createViewingRequest(data: InsertViewingRequest): Promise<ViewingRequest>;
  getViewingRequests(listingId: string): Promise<ViewingRequest[]>;

  // Stats methods
  getStats(): Promise<{
    totalUsers: number;
    totalListings: number;
    pendingListings: number;
    totalRevenue: number;
  }>;
}
