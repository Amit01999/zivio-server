import {
  UserModel,
  ListingModel,
  BrokerModel,
  FavoriteModel,
  MessageModel,
  ConversationModel,
  ReviewModel,
  TransactionModel,
  ViewingRequestModel,
  PropertyInquiryModel,
  ComparisonCartModel,
  AdminSellerMessageModel
} from '../models/index.js';
import type { IStorage } from '../storage.js';
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
  PropertyInquiry,
  InsertPropertyInquiry,
  PropertyInquiryWithDetails,
  ComparisonCart,
  InsertComparisonCart,
  ComparisonCartWithListings,
  InquiryStatus,
  InquiryType,
  SearchFilters,
  PaginatedResponse,
  ListingWithBroker,
  Conversation,
  ConversationWithDetails
} from '../types/schema.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateSlug } from '../utils/slugify.js';
import { deriveCategory, getCategoryFilters, type ListingCategory } from '../utils/categoryMapping.js';

export class MongoStorageService implements IStorage {
  // Helper to transform MongoDB document to expected format
  private transformDoc<T>(doc: any): T {
    if (!doc) return doc;
    const obj = doc.toJSON ? doc.toJSON() : { ...doc };
    if (obj._id) {
      obj.id = obj._id.toString();
      delete obj._id;
    }
    delete obj.__v;
    return obj as T;
  }

  private toSafeUser(user: any): SafeUser {
    if (!user) return user;
    const transformed = this.transformDoc(user);
    const { passwordHash, ...safeUser } = transformed as any;
    return safeUser;
  }

  // ==================== USER METHODS ====================
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    return user ? this.transformDoc<User>(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({
      email: email.toLowerCase()
    }).lean();
    return user ? this.transformDoc<User>(user) : undefined;
  }

  async createUser(userData: InsertUser & { password: string }): Promise<SafeUser> {
    const hashedPassword = await hashPassword(userData.password);

    const user = await UserModel.create({
      name: userData.name,
      email: userData.email.toLowerCase(),
      phone: userData.phone || null,
      passwordHash: hashedPassword,
      role: userData.role || 'buyer',
      verified: false,
      profilePhotoUrl: userData.profilePhotoUrl || null
    });

    return this.toSafeUser(user);
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await UserModel.findOne({
      email: email.toLowerCase()
    }).lean();

    if (!user) return null;

    const transformed = this.transformDoc<User>(user);
    const isValid = await verifyPassword(password, transformed.passwordHash);
    return isValid ? transformed : null;
  }

  async getUsers(): Promise<SafeUser[]> {
    const users = await UserModel.find().lean();
    return users.map(u => this.toSafeUser(u));
  }

  async updateUser(id: string, updates: Partial<SafeUser>): Promise<SafeUser | undefined> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    return user ? this.toSafeUser(user) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  // ==================== LISTING METHODS ====================
  async getListing(id: string): Promise<Listing | undefined> {
    const listing = await ListingModel.findById(id).lean();
    return listing ? this.transformDoc<Listing>(listing) : undefined;
  }

  async getListingBySlug(slug: string): Promise<ListingWithBroker | undefined> {
    const listing = await ListingModel.findOne({ slug }).lean();
    if (!listing) return undefined;

    const transformedListing = this.transformDoc<Listing>(listing);

    let broker: (Broker & { user?: SafeUser }) | undefined;
    if (transformedListing.brokerId) {
      const brokerDoc = await BrokerModel.findById(transformedListing.brokerId).lean();
      if (brokerDoc) {
        const transformedBroker = this.transformDoc<Broker>(brokerDoc);
        const brokerUser = await UserModel.findById(transformedBroker.userId).lean();
        broker = {
          ...transformedBroker,
          user: this.toSafeUser(brokerUser)
        };
      }
    }

    const user = await UserModel.findById(transformedListing.postedBy).lean();

    return {
      ...transformedListing,
      broker,
      user: user ? this.toSafeUser(user) : undefined
    };
  }

  async getListings(filters: SearchFilters): Promise<PaginatedResponse<Listing>> {
    const query: any = { status: 'published' };

    if (filters.q) {
      query.$or = [
        { title: { $regex: filters.q, $options: 'i' } },
        { address: { $regex: filters.q, $options: 'i' } },
        { city: { $regex: filters.q, $options: 'i' } }
      ];
    }

    // Handle category filtering (derived)
    if (filters.category) {
      const categoryFilters = getCategoryFilters(filters.category as ListingCategory);
      if (categoryFilters.listingType) query.listingType = categoryFilters.listingType;
      if (categoryFilters.propertyType) query.propertyType = categoryFilters.propertyType;
    } else {
      // Individual filters if no category specified
      if (filters.listingType) query.listingType = filters.listingType;
      if (filters.propertyType) query.propertyType = filters.propertyType;
    }

    if (filters.city) query.city = filters.city;
    if (filters.area) query.area = { $regex: filters.area, $options: 'i' };

    // New filters
    if (filters.completionStatus) query.completionStatus = filters.completionStatus;
    if (filters.furnishingStatus) query.furnishingStatus = filters.furnishingStatus;

    // Price filtering: apply to numeric values (stored as strings)
    if (filters.minPrice || filters.maxPrice) {
      // Match documents where price can be converted to a number
      query.$expr = {
        $and: [
          // Check if price is a valid number (either type number or numeric string)
          ...(filters.minPrice ? [{
            $gte: [
              { $toDouble: { $ifNull: ['$price', '0'] } },
              filters.minPrice
            ]
          }] : []),
          ...(filters.maxPrice ? [{
            $lte: [
              { $toDouble: { $ifNull: ['$price', '0'] } },
              filters.maxPrice
            ]
          }] : [])
        ]
      };
    }

    if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
    if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };

    if (filters.minArea || filters.maxArea) {
      query.areaSqFt = {};
      if (filters.minArea) query.areaSqFt.$gte = filters.minArea;
      if (filters.maxArea) query.areaSqFt.$lte = filters.maxArea;
    }

    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    if (filters.isFeatured) query.isFeatured = true;
    if (filters.isVerified) query.isVerified = true;

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    let sort: any = { createdAt: -1 };
    switch (filters.sortBy) {
      case 'price_asc': sort = { price: 1 }; break;
      case 'price_desc': sort = { price: -1 }; break;
      case 'oldest': sort = { createdAt: 1 }; break;
      case 'popular': sort = { views: -1 }; break;
    }

    const [data, total] = await Promise.all([
      ListingModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      ListingModel.countDocuments(query)
    ]);

    // Add derived category to each listing
    const dataWithCategories = data.map(d => {
      const listing = this.transformDoc<Listing>(d);
      return {
        ...listing,
        category: deriveCategory({
          listingType: listing.listingType as any,
          propertyType: listing.propertyType,
          propertySubType: listing.propertySubType ?? undefined,
        })
      };
    });

    return {
      data: dataWithCategories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAdminListings(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Listing>> {
    const query: any = {};
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ListingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ListingModel.countDocuments(query)
    ]);

    return {
      data: data.map(d => this.transformDoc<Listing>(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getUserListings(userId: string): Promise<PaginatedResponse<Listing>> {
    const data = await ListingModel.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .lean();
    const total = data.length;

    return {
      data: data.map(d => this.transformDoc<Listing>(d)),
      total,
      page: 1,
      limit: total,
      totalPages: 1
    };
  }

  async createListing(data: InsertListing): Promise<Listing> {
    // Auto-compute pricePerSqft if not provided (only for numeric prices)
    let pricePerSqft = data.pricePerSqft;
    if (!pricePerSqft && data.price !== undefined && data.price !== null && data.areaSqFt && data.areaSqFt > 0) {
      const numericPrice = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
      if (!isNaN(numericPrice)) {
        pricePerSqft = Math.round(numericPrice / data.areaSqFt);
      }
    }

    const listing = await ListingModel.create({
      ...data,
      pricePerSqft,
      slug: generateSlug(data.title),
      views: 0,
      favorites: 0,
      reportCount: 0
    });

    return this.transformDoc<Listing>(listing);
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing | undefined> {
    const listing = await ListingModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    return listing ? this.transformDoc<Listing>(listing) : undefined;
  }

  async deleteListing(id: string): Promise<boolean> {
    const result = await ListingModel.findByIdAndDelete(id);
    return !!result;
  }

  async incrementListingViews(id: string): Promise<void> {
    await ListingModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  // ==================== BROKER METHODS ====================
  async getBroker(id: string): Promise<(Broker & { user?: SafeUser }) | undefined> {
    const broker = await BrokerModel.findById(id).lean();
    if (!broker) return undefined;

    const transformedBroker = this.transformDoc<Broker>(broker);
    const user = await UserModel.findById(transformedBroker.userId).lean();
    return {
      ...transformedBroker,
      user: user ? this.toSafeUser(user) : undefined
    };
  }

  async getBrokerByUserId(userId: string): Promise<Broker | undefined> {
    const broker = await BrokerModel.findOne({ userId }).lean();
    return broker ? this.transformDoc<Broker>(broker) : undefined;
  }

  async getBrokers(filters?: { city?: string; verified?: boolean }): Promise<(Broker & { user: SafeUser })[]> {
    const query: any = {};
    if (filters?.verified !== undefined) query.verified = filters.verified;

    const brokers = await BrokerModel.find(query).lean();

    const brokersWithUsers = await Promise.all(
      brokers.map(async (broker) => {
        const transformedBroker = this.transformDoc<Broker>(broker);
        const user = await UserModel.findById(transformedBroker.userId).lean();
        return {
          ...transformedBroker,
          user: this.toSafeUser(user)!
        };
      })
    );

    return brokersWithUsers;
  }

  async createBroker(data: InsertBroker): Promise<Broker> {
    const broker = await BrokerModel.create(data);
    return this.transformDoc<Broker>(broker);
  }

  async updateBroker(id: string, updates: Partial<Broker>): Promise<Broker | undefined> {
    const broker = await BrokerModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    return broker ? this.transformDoc<Broker>(broker) : undefined;
  }

  // ==================== FAVORITE METHODS ====================
  async getFavorites(userId: string): Promise<Listing[]> {
    const favorites = await FavoriteModel.find({ userId }).lean();
    const transformedFavorites = favorites.map(f => this.transformDoc<Favorite>(f));
    const listingIds = transformedFavorites.map(f => f.listingId);

    const listings = await ListingModel.find({
      _id: { $in: listingIds }
    }).lean();

    return listings.map(l => this.transformDoc<Listing>(l));
  }

  async addFavorite(userId: string, listingId: string): Promise<Favorite> {
    try {
      const favorite = await FavoriteModel.create({ userId, listingId });
      await ListingModel.findByIdAndUpdate(listingId, { $inc: { favorites: 1 } });
      return this.transformDoc<Favorite>(favorite);
    } catch (err: any) {
      // Duplicate key — already favorited, return the existing record
      if (err.code === 11000) {
        const existing = await FavoriteModel.findOne({ userId, listingId }).lean();
        return this.transformDoc<Favorite>(existing);
      }
      throw err;
    }
  }

  async removeFavorite(userId: string, listingId: string): Promise<boolean> {
    const result = await FavoriteModel.findOneAndDelete({ userId, listingId });

    if (result) {
      await ListingModel.findByIdAndUpdate(listingId, { $inc: { favorites: -1 } });
    }

    return !!result;
  }

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const favorite = await FavoriteModel.findOne({ userId, listingId });
    return !!favorite;
  }

  // ==================== MESSAGE/CONVERSATION METHODS ====================
  async getConversations(userId: string): Promise<ConversationWithDetails[]> {
    const conversations = await ConversationModel.find({
      participantIds: userId
    }).sort({ updatedAt: -1 }).lean();

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const transformedConv = this.transformDoc<Conversation>(conv);
        const otherParticipantId = transformedConv.participantIds.find((p: string) => p !== userId);
        const otherUser = otherParticipantId
          ? await UserModel.findById(otherParticipantId).lean()
          : null;

        const listing = transformedConv.listingId
          ? await ListingModel.findById(transformedConv.listingId).lean()
          : null;

        return {
          ...transformedConv,
          participants: [], // Will be populated by controller if needed
          otherUser: otherUser ? this.toSafeUser(otherUser) : undefined,
          listing: listing ? this.transformDoc<Listing>(listing) : undefined,
          unreadCount: 0 // Will be calculated by controller if needed
        } as ConversationWithDetails;
      })
    );

    return conversationsWithDetails;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    // Get conversation to find participants
    const conversation = await ConversationModel.findById(conversationId).lean();
    if (!conversation) return [];

    const [user1, user2] = conversation.participantIds;

    // Find messages between these two users
    const messages = await MessageModel.find({
      $or: [
        { fromUserId: user1, toUserId: user2 },
        { fromUserId: user2, toUserId: user1 }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    return messages.map(m => this.transformDoc<Message>(m));
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const message = await MessageModel.create(data);
    return this.transformDoc<Message>(message);
  }

  async getOrCreateConversation(
    participantIds: string[],
    listingId?: string
  ): Promise<Conversation> {
    const sortedParticipants = participantIds.sort();

    let conversation = await ConversationModel.findOne({
      participantIds: { $all: sortedParticipants, $size: sortedParticipants.length }
    }).lean();

    if (!conversation) {
      const newConv = await ConversationModel.create({
        participantIds: sortedParticipants,
        listingId: listingId || null,
        lastMessageAt: null
      });
      return this.transformDoc<Conversation>(newConv);
    }

    return this.transformDoc<Conversation>(conversation);
  }

  // ==================== REVIEW METHODS ====================
  async createReview(data: InsertReview): Promise<Review> {
    const review = await ReviewModel.create(data);

    const reviews = await ReviewModel.find({ brokerId: data.brokerId }).lean();
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await BrokerModel.findByIdAndUpdate(data.brokerId, {
      rating: avgRating,
      reviewCount: reviews.length
    });

    return this.transformDoc<Review>(review);
  }

  async getReviews(brokerId: string): Promise<Review[]> {
    const reviews = await ReviewModel.find({ brokerId })
      .sort({ createdAt: -1 })
      .lean();

    return reviews.map(r => this.transformDoc<Review>(r));
  }

  // ==================== TRANSACTION METHODS ====================
  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const transaction = await TransactionModel.create(data);
    return this.transformDoc<Transaction>(transaction);
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const transactions = await TransactionModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return transactions.map(t => this.transformDoc<Transaction>(t));
  }

  // ==================== VIEWING REQUEST METHODS ====================
  async createViewingRequest(data: InsertViewingRequest): Promise<ViewingRequest> {
    const request = await ViewingRequestModel.create(data);
    return this.transformDoc<ViewingRequest>(request);
  }

  async getViewingRequests(listingId: string): Promise<ViewingRequest[]> {
    const requests = await ViewingRequestModel.find({ listingId })
      .sort({ createdAt: -1 })
      .lean();

    return requests.map(r => this.transformDoc<ViewingRequest>(r));
  }

  // ==================== PROPERTY INQUIRY METHODS ====================
  async createPropertyInquiry(data: InsertPropertyInquiry): Promise<PropertyInquiry> {
    const inquiry = await PropertyInquiryModel.create(data);
    return this.transformDoc<PropertyInquiry>(inquiry);
  }

  async getPropertyInquiry(id: string): Promise<PropertyInquiryWithDetails | undefined> {
    const inquiry = await PropertyInquiryModel.findById(id).lean();
    if (!inquiry) return undefined;

    const transformed = this.transformDoc<PropertyInquiry>(inquiry);

    // Fetch related data
    const [property, buyer] = await Promise.all([
      ListingModel.findById(transformed.propertyId).lean(),
      UserModel.findById(transformed.buyerId).lean()
    ]);

    return {
      ...transformed,
      property: property ? this.transformDoc<Listing>(property) : undefined,
      buyer: buyer ? this.toSafeUser(buyer) : undefined
    };
  }

  async getPropertyInquiriesByListing(listingId: string): Promise<PropertyInquiryWithDetails[]> {
    const inquiries = await PropertyInquiryModel.find({ propertyId: listingId })
      .sort({ createdAt: -1 })
      .lean();

    const inquiriesWithDetails = await Promise.all(
      inquiries.map(async (inquiry) => {
        const transformed = this.transformDoc<PropertyInquiry>(inquiry);
        const buyer = await UserModel.findById(transformed.buyerId).lean();

        return {
          ...transformed,
          buyer: buyer ? this.toSafeUser(buyer) : undefined
        };
      })
    );

    return inquiriesWithDetails;
  }

  async getPropertyInquiriesByBuyer(buyerId: string): Promise<PropertyInquiryWithDetails[]> {
    const inquiries = await PropertyInquiryModel.find({ buyerId })
      .sort({ createdAt: -1 })
      .lean();

    const inquiriesWithDetails = await Promise.all(
      inquiries.map(async (inquiry) => {
        const transformed = this.transformDoc<PropertyInquiry>(inquiry);
        const property = await ListingModel.findById(transformed.propertyId).lean();

        return {
          ...transformed,
          property: property ? this.transformDoc<Listing>(property) : undefined
        };
      })
    );

    return inquiriesWithDetails;
  }

  async replyToInquiry(id: string, reply: string): Promise<PropertyInquiry> {
    const now = new Date();
    const inquiry = await PropertyInquiryModel.findByIdAndUpdate(
      id,
      {
        adminReply: reply,
        adminReplyAt: now,
        status: 'contacted',
        $push: { messages: { senderRole: 'admin', text: reply, sentAt: now } }
      },
      { new: true }
    ).lean();
    if (!inquiry) throw new Error('Inquiry not found');
    return this.transformDoc<PropertyInquiry>(inquiry);
  }

  async buyerReplyToInquiry(id: string, buyerId: string, reply: string): Promise<PropertyInquiry> {
    const inquiry = await PropertyInquiryModel.findOne({ _id: id, buyerId }).lean();
    if (!inquiry) throw new Error('Inquiry not found or access denied');

    const updated = await PropertyInquiryModel.findByIdAndUpdate(
      id,
      { $push: { messages: { senderRole: 'buyer', text: reply, sentAt: new Date() } } },
      { new: true }
    ).lean();
    if (!updated) throw new Error('Inquiry not found');
    return this.transformDoc<PropertyInquiry>(updated);
  }

  async getAllPropertyInquiries(filters?: {
    status?: InquiryStatus;
    requestType?: InquiryType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PropertyInquiryWithDetails>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.requestType) query.requestType = filters.requestType;

    const [inquiries, total] = await Promise.all([
      PropertyInquiryModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PropertyInquiryModel.countDocuments(query)
    ]);

    const inquiriesWithDetails = await Promise.all(
      inquiries.map(async (inquiry) => {
        const transformed = this.transformDoc<PropertyInquiry>(inquiry);
        const [property, buyer] = await Promise.all([
          ListingModel.findById(transformed.propertyId).lean(),
          UserModel.findById(transformed.buyerId).lean()
        ]);

        return {
          ...transformed,
          property: property ? this.transformDoc<Listing>(property) : undefined,
          buyer: buyer ? this.toSafeUser(buyer) : undefined
        };
      })
    );

    return {
      data: inquiriesWithDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updatePropertyInquiryStatus(id: string, status: InquiryStatus): Promise<PropertyInquiry | undefined> {
    const inquiry = await PropertyInquiryModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).lean();

    return inquiry ? this.transformDoc<PropertyInquiry>(inquiry) : undefined;
  }

  // ==================== COMPARISON CART METHODS ====================
  async getComparisonCart(userId: string): Promise<ComparisonCartWithListings> {
    let cart = await ComparisonCartModel.findOne({ userId }).lean();

    if (!cart) {
      const newCart = await ComparisonCartModel.create({
        userId,
        listingIds: []
      });
      cart = newCart.toObject();
    }

    const transformed = this.transformDoc<ComparisonCart>(cart);

    // Fetch all listings in cart
    const listings = await ListingModel.find({
      _id: { $in: transformed.listingIds }
    }).lean();

    return {
      ...transformed,
      listings: listings.map(l => this.transformDoc<Listing>(l))
    };
  }

  async addToComparisonCart(userId: string, listingId: string): Promise<ComparisonCart> {
    let cart = await ComparisonCartModel.findOne({ userId });

    if (!cart) {
      cart = await ComparisonCartModel.create({
        userId,
        listingIds: [listingId]
      });
    } else {
      // Check if already in cart
      if (!cart.listingIds.includes(listingId)) {
        // Check max limit (5 properties)
        if (cart.listingIds.length >= 5) {
          throw new Error('Comparison cart is full. Maximum 5 properties allowed.');
        }
        cart.listingIds.push(listingId);
        cart.updatedAt = new Date();
        await cart.save();
      }
    }

    return this.transformDoc<ComparisonCart>(cart);
  }

  async removeFromComparisonCart(userId: string, listingId: string): Promise<ComparisonCart> {
    const cart = await ComparisonCartModel.findOne({ userId });

    if (!cart) {
      throw new Error('Comparison cart not found');
    }

    cart.listingIds = cart.listingIds.filter((id: string) => id !== listingId);
    cart.updatedAt = new Date();
    await cart.save();

    return this.transformDoc<ComparisonCart>(cart);
  }

  async clearComparisonCart(userId: string): Promise<void> {
    await ComparisonCartModel.findOneAndUpdate(
      { userId },
      { listingIds: [], updatedAt: new Date() },
      { upsert: true }
    );
  }

  // ==================== STATS METHODS ====================
  async getStats(): Promise<{
    totalUsers: number;
    totalListings: number;
    pendingListings: number;
    totalRevenue: number;
    totalInquiries?: number;
    newInquiries?: number;
  }> {
    const [totalUsers, totalListings, pendingListings, transactions, totalInquiries, newInquiries] = await Promise.all([
      UserModel.countDocuments(),
      ListingModel.countDocuments({ status: 'published' }),
      ListingModel.countDocuments({ status: 'pending' }),
      TransactionModel.find({ status: 'completed' }).lean(),
      PropertyInquiryModel.countDocuments(),
      PropertyInquiryModel.countDocuments({ status: 'new' })
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalUsers,
      totalListings,
      pendingListings,
      totalRevenue,
      totalInquiries,
      newInquiries
    };
  }

  async getBuyerStats(userId: string): Promise<{
    favoritesCount: number;
    inquiriesCount: number;
    scheduledViewings: number;
    comparisonCount: number;
  }> {
    const [favoritesCount, inquiriesCount, scheduledViewings, cart] = await Promise.all([
      FavoriteModel.countDocuments({ userId }),
      PropertyInquiryModel.countDocuments({ buyerId: userId }),
      PropertyInquiryModel.countDocuments({
        buyerId: userId,
        requestType: 'viewing',
        status: { $ne: 'closed' }
      }),
      ComparisonCartModel.findOne({ userId }).lean()
    ]);

    return {
      favoritesCount,
      inquiriesCount,
      scheduledViewings,
      comparisonCount: cart?.listingIds?.length || 0
    };
  }

  async getSellerStats(userId: string): Promise<{
    totalListings: number;
    pendingListings: number;
    publishedListings: number;
    totalViews: number;
    totalInquiries: number;
  }> {
    const listings = await ListingModel.find({ postedBy: userId }).lean();
    const listingIds = listings.map(l => l._id.toString());

    const [pendingCount, publishedCount, inquiriesCount] = await Promise.all([
      ListingModel.countDocuments({ postedBy: userId, status: 'pending' }),
      ListingModel.countDocuments({ postedBy: userId, status: 'published' }),
      PropertyInquiryModel.countDocuments({ propertyId: { $in: listingIds } })
    ]);

    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);

    return {
      totalListings: listings.length,
      pendingListings: pendingCount,
      publishedListings: publishedCount,
      totalViews,
      totalInquiries: inquiriesCount
    };
  }

  async getBrokerStats(userId: string): Promise<{
    activeListings: number;
    totalViews: number;
    totalInquiries: number;
    soldRentedCount: number;
    averageViews: number;
  }> {
    const broker = await BrokerModel.findOne({ userId }).lean();
    if (!broker) {
      return {
        activeListings: 0,
        totalViews: 0,
        totalInquiries: 0,
        soldRentedCount: 0,
        averageViews: 0
      };
    }

    const brokerId = broker._id.toString();
    const listings = await ListingModel.find({ brokerId }).lean();
    const listingIds = listings.map(l => l._id.toString());

    const [activeCount, soldRentedCount, inquiriesCount] = await Promise.all([
      ListingModel.countDocuments({ brokerId, status: 'published' }),
      ListingModel.countDocuments({ brokerId, status: { $in: ['sold', 'rented'] } }),
      PropertyInquiryModel.countDocuments({ propertyId: { $in: listingIds } })
    ]);

    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const averageViews = listings.length > 0 ? Math.round(totalViews / listings.length) : 0;

    return {
      activeListings: activeCount,
      totalViews,
      totalInquiries: inquiriesCount,
      soldRentedCount,
      averageViews
    };
  }

  async getListingAnalytics(listingId: string): Promise<{
    views: number;
    inquiries: number;
    favorites: number;
  }> {
    const [listing, inquiriesCount, favoritesCount] = await Promise.all([
      ListingModel.findById(listingId).lean(),
      PropertyInquiryModel.countDocuments({ propertyId: listingId }),
      FavoriteModel.countDocuments({ listingId })
    ]);

    return {
      views: listing?.views || 0,
      inquiries: inquiriesCount,
      favorites: favoritesCount
    };
  }

  // ==================== ADMIN → SELLER MESSAGE METHODS ====================

  async sendAdminSellerMessage(data: {
    adminId: string;
    sellerId: string;
    propertyId: string;
    message: string;
    relatedInquiryId?: string;
  }): Promise<any> {
    const msg = await AdminSellerMessageModel.create(data);
    return this.transformDoc(msg);
  }

  async getSellerMessages(sellerId: string): Promise<any[]> {
    const messages = await AdminSellerMessageModel.find({ sellerId })
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(
      messages.map(async (msg) => {
        const transformed = this.transformDoc<any>(msg);
        const property = await ListingModel.findById(transformed.propertyId).lean();
        return {
          ...transformed,
          property: property ? this.transformDoc<any>(property) : undefined,
        };
      })
    );
  }

  async getAdminSentMessages(adminId: string): Promise<any[]> {
    const messages = await AdminSellerMessageModel.find({ adminId })
      .sort({ createdAt: -1 })
      .lean();

    return Promise.all(
      messages.map(async (msg) => {
        const transformed = this.transformDoc<any>(msg);
        const [property, seller] = await Promise.all([
          ListingModel.findById(transformed.propertyId).lean(),
          UserModel.findById(transformed.sellerId).lean(),
        ]);
        return {
          ...transformed,
          property: property ? this.transformDoc<any>(property) : undefined,
          seller: seller ? this.toSafeUser(seller) : undefined,
        };
      })
    );
  }

  async markSellerMessageRead(id: string, sellerId: string): Promise<any> {
    const msg = await AdminSellerMessageModel.findOneAndUpdate(
      { _id: id, sellerId },
      { read: true },
      { new: true }
    ).lean();
    return msg ? this.transformDoc<any>(msg) : null;
  }

  async getDashboardStats(): Promise<any> {
    const [
      usersByRole,
      listingsByStatus,
      inquiriesByStatus,
      recentListingsRaw,
      recentInquiriesRaw,
      recentUsersRaw,
      topByViewsRaw,
      transactionsRaw,
    ] = await Promise.all([
      UserModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      ListingModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      PropertyInquiryModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ListingModel.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title city status propertyType images createdAt price views postedBy')
        .lean(),
      PropertyInquiryModel.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('requestType status buyerId propertyId createdAt')
        .lean(),
      UserModel.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('name email role createdAt profilePhotoUrl')
        .lean(),
      ListingModel.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .select('title city views images slug')
        .lean(),
      TransactionModel.find({ status: 'completed' }).select('amount').lean(),
    ]);

    const userMap: Record<string, number> = {};
    for (const r of usersByRole) userMap[r._id as string] = r.count;

    const listingMap: Record<string, number> = {};
    for (const r of listingsByStatus) listingMap[r._id as string] = r.count;

    const inquiryMap: Record<string, number> = {};
    for (const r of inquiriesByStatus) inquiryMap[r._id as string] = r.count;

    // Top listings by inquiry count
    const topByInquiriesAgg = await PropertyInquiryModel.aggregate([
      { $group: { _id: '$propertyId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const topByInquiries = (
      await Promise.all(
        topByInquiriesAgg.map(async (item) => {
          const l = await ListingModel.findById(item._id)
            .select('title city images slug')
            .lean();
          return l ? { ...this.transformDoc<any>(l), inquiryCount: item.count } : null;
        })
      )
    ).filter(Boolean);

    // Seller performance (top 5 by listing count)
    const sellers = await UserModel.find({ role: 'seller' })
      .select('name email profilePhotoUrl')
      .lean();
    const sellerPerf = (
      await Promise.all(
        sellers.map(async (seller) => {
          const sid = seller._id.toString();
          const listingIds = (
            await ListingModel.find({ postedBy: sid }).select('_id').lean()
          ).map((l) => l._id.toString());
          const [totalListings, totalInquiries] = await Promise.all([
            listingIds.length,
            PropertyInquiryModel.countDocuments({ propertyId: { $in: listingIds } }),
          ]);
          return {
            id: sid,
            name: (seller as any).name,
            email: (seller as any).email,
            profilePhotoUrl: (seller as any).profilePhotoUrl ?? null,
            totalListings,
            totalInquiries,
          };
        })
      )
    )
      .sort((a, b) => b.totalListings - a.totalListings)
      .slice(0, 5);

    // Populate recent inquiries
    const recentInquiries = await Promise.all(
      recentInquiriesRaw.map(async (inq) => {
        const [buyer, property] = await Promise.all([
          UserModel.findById(inq.buyerId).select('name').lean(),
          ListingModel.findById(inq.propertyId).select('title city').lean(),
        ]);
        return {
          ...this.transformDoc<any>(inq),
          buyerName: (buyer as any)?.name ?? 'Unknown',
          propertyTitle: (property as any)?.title ?? 'Unknown Property',
          propertyCity: (property as any)?.city ?? '',
        };
      })
    );

    const revenue = transactionsRaw.reduce((s, t) => s + ((t as any).amount ?? 0), 0);

    return {
      users: {
        total: Object.values(userMap).reduce((s, c) => s + c, 0),
        buyers: userMap['buyer'] ?? 0,
        sellers: userMap['seller'] ?? 0,
        admins: userMap['admin'] ?? 0,
      },
      listings: {
        total: Object.values(listingMap).reduce((s, c) => s + c, 0),
        published: listingMap['published'] ?? 0,
        pending: listingMap['pending'] ?? 0,
        rejected: listingMap['rejected'] ?? 0,
        sold: listingMap['sold'] ?? 0,
        rented: listingMap['rented'] ?? 0,
      },
      inquiries: {
        total: Object.values(inquiryMap).reduce((s, c) => s + c, 0),
        new: inquiryMap['new'] ?? 0,
        contacted: inquiryMap['contacted'] ?? 0,
        closed: inquiryMap['closed'] ?? 0,
      },
      revenue,
      recentListings: recentListingsRaw.map((l) => this.transformDoc<any>(l)),
      recentInquiries,
      recentUsers: recentUsersRaw.map((u) => this.toSafeUser(u as any)),
      topListingsByViews: topByViewsRaw.map((l) => this.transformDoc<any>(l)),
      topListingsByInquiries: topByInquiries,
      sellerPerformance: sellerPerf,
    };
  }

  async getSellerListWithStats(): Promise<any[]> {
    const sellers = await UserModel.find({ role: 'seller' }).lean();

    return Promise.all(
      sellers.map(async (seller) => {
        const safeUser = this.toSafeUser(seller);
        const listingIds = await ListingModel.find({ postedBy: safeUser.id })
          .select('_id status')
          .lean();

        const ids = listingIds.map((l) => l._id.toString());
        const [activeCount, inquiryCount, unreadMessages] = await Promise.all([
          listingIds.filter((l) => l.status === 'published').length,
          PropertyInquiryModel.countDocuments({ propertyId: { $in: ids } }),
          AdminSellerMessageModel.countDocuments({ sellerId: safeUser.id, read: false }),
        ]);

        return {
          ...safeUser,
          totalListings: listingIds.length,
          activeListings: activeCount,
          totalInquiries: inquiryCount,
          unreadMessages,
        };
      })
    );
  }

  async getSellerFullProfile(sellerId: string): Promise<any | null> {
    const seller = await UserModel.findById(sellerId).lean();
    if (!seller) return null;

    const listings = await ListingModel.find({ postedBy: sellerId }).lean();
    const listingIds = listings.map((l) => l._id.toString());

    const inquiryCounts = await Promise.all(
      listingIds.map(async (id) => ({
        id,
        count: await PropertyInquiryModel.countDocuments({ propertyId: id }),
      }))
    );
    const inquiryMap: Record<string, number> = {};
    for (const ic of inquiryCounts) inquiryMap[ic.id] = ic.count;

    const totalInquiries = Object.values(inquiryMap).reduce((s, c) => s + c, 0);
    const unreadMessages = await AdminSellerMessageModel.countDocuments({ sellerId, read: false });

    return {
      ...this.toSafeUser(seller),
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === 'published').length,
      totalInquiries,
      unreadMessages,
      listings: listings.map((l) => ({
        ...this.transformDoc<any>(l),
        inquiryCount: inquiryMap[l._id.toString()] ?? 0,
      })),
    };
  }

  async getSellerConversationsForAdmin(sellerId: string): Promise<any[]> {
    const messages = await AdminSellerMessageModel.find({ sellerId })
      .sort({ createdAt: 1 })
      .lean();

    return Promise.all(
      messages.map(async (msg) => {
        const transformed = this.transformDoc<any>(msg);
        const property = await ListingModel.findById(transformed.propertyId).lean();
        return {
          ...transformed,
          property: property ? this.transformDoc<any>(property) : undefined,
        };
      })
    );
  }

  async addAdminThreadReply(messageId: string, adminId: string, text: string): Promise<any | null> {
    const msg = await AdminSellerMessageModel.findByIdAndUpdate(
      messageId,
      {
        $push: {
          thread: { senderRole: 'admin', senderId: adminId, text, sentAt: new Date() },
        },
      },
      { new: true }
    ).lean();
    return msg ? this.transformDoc<any>(msg) : null;
  }

  async addSellerThreadReply(messageId: string, sellerId: string, text: string): Promise<any | null> {
    const msg = await AdminSellerMessageModel.findOneAndUpdate(
      { _id: messageId, sellerId },
      {
        read: true,
        $push: {
          thread: { senderRole: 'seller', senderId: sellerId, text, sentAt: new Date() },
        },
      },
      { new: true }
    ).lean();
    return msg ? this.transformDoc<any>(msg) : null;
  }

  // ==================== OTP / PASSWORD RESET ====================

  async setUserResetOtp(email: string, otpHash: string, expiry: Date): Promise<boolean> {
    const result = await UserModel.updateOne(
      { email: email.toLowerCase() },
      { resetOtp: otpHash, resetOtpExpiry: expiry, resetOtpAttempts: 0 }
    );
    return result.matchedCount > 0;
  }

  async getUserByEmailWithOtp(email: string): Promise<any | null> {
    return UserModel.findOne({ email: email.toLowerCase() })
      .select('+resetOtp +resetOtpExpiry +resetOtpAttempts')
      .lean();
  }

  async incrementOtpAttempts(userId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $inc: { resetOtpAttempts: 1 } });
  }

  async clearUserResetOtp(userId: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 }
    );
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { passwordHash, resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 }
    );
  }
}

export const storage = new MongoStorageService();
