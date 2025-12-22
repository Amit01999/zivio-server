import mongoose, { Schema, Document } from 'mongoose';
import {
  Listing as ListingType,
  propertyTypes,
  listingTypes,
  listingStatuses,
  completionStatuses,
  furnishingStatuses,
  sellerTypes,
} from '../types/schema.js';
import { deriveCategory } from '../utils/categoryMapping.js';

interface IListing
  extends Omit<ListingType, 'id' | 'createdAt' | 'updatedAt'>,
    Document {}

const listingSchema = new Schema<IListing>(
  {
    /* ================= CORE (IMPORTANT) ================= */

    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    price: { type: Schema.Types.Mixed, required: true }, // Supports both number and string (e.g., "Contact for Price")
    pricePerSqft: { type: Number },

    listingType: {
      type: String,
      enum: listingTypes,
      required: true,
    },

    propertyType: {
      type: String,
      enum: propertyTypes,
      required: true,
    },

    propertySubType: { type: String },

    address: { type: String, required: true },
    city: { type: String, required: true },
    postedBy: { type: String },

    /* ================= OPTIONAL CONTENT ================= */

    description: { type: String },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    areaSqFt: { type: Number },
    district: { type: String },
    area: { type: String },

    /* ================= PROPERTY DETAILS ================= */

    completionStatus: {
      type: String,
      enum: completionStatuses,
    },
    furnishingStatus: {
      type: String,
      enum: furnishingStatuses,
    },
    negotiable: { type: Boolean, default: false },
    unitType: { type: String },

    /* ================= BUILDING DETAILS ================= */

    floor: { type: Number },
    totalFloors: { type: Number },
    parkingCount: { type: Number },
    facing: { type: String },
    balconies: { type: Number },
    servantRoom: { type: Boolean, default: false },
    servantBathroom: { type: Boolean, default: false },

    /* ================= LOCATION ================= */

    coordinates: {
      type: {
        lat: Number,
        lng: Number,
      },
      default: null,
    },

    /* ================= MEDIA ================= */

    images: [{ type: String }],
    floorPlanUrl: { type: String },
    videoUrl: { type: String },

    /* ================= FEATURES ================= */

    amenities: [{ type: String }],

    /* ================= SECURITY & AMENITY BOOLEANS ================= */

    security24x7: { type: Boolean, default: false },
    cctv: { type: Boolean, default: false },
    generatorBackup: { type: Boolean, default: false },
    fireSafety: { type: Boolean, default: false },
    liftAvailable: { type: Boolean, default: false },

    /* ================= SELLER INFO ================= */

    sellerName: { type: String },
    sellerType: {
      type: String,
      enum: sellerTypes,
    },

    /* ================= CONTACT & COMMUNICATION ================= */

    contactPhone: { type: String },
    isPhoneHidden: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    brokerId: { type: String },

    /* ================= PLATFORM FLAGS ================= */

    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: listingStatuses,
      default: 'draft',
    },

    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ================= VIRTUAL FIELDS ================= */

// Add virtual field for derived category
listingSchema.virtual('category').get(function () {
  return deriveCategory({
    listingType: this.listingType,
    propertyType: this.propertyType,
    propertySubType: this.propertySubType ?? undefined,
  });
});

/* ================= PRE-SAVE HOOKS ================= */

// Auto-compute pricePerSqft before saving (only for numeric prices)
listingSchema.pre('save', async function () {
  if (this.areaSqFt && this.areaSqFt > 0 && !this.pricePerSqft) {
    const numericPrice = typeof this.price === 'string' ? parseFloat(this.price) : this.price;
    if (!isNaN(numericPrice)) {
      this.pricePerSqft = Math.round(numericPrice / this.areaSqFt);
    }
  }
  // No need to call next() in async middleware
});

/* ================= INDEXES ================= */

listingSchema.index({ slug: 1 });
listingSchema.index({ city: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ postedBy: 1 });
listingSchema.index({ listingType: 1 });
listingSchema.index({ propertyType: 1 });
listingSchema.index({ area: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ completionStatus: 1 });
listingSchema.index({ furnishingStatus: 1 });

export const ListingModel = mongoose.model<IListing>('Listing', listingSchema);
