import mongoose, { Schema, Document } from 'mongoose';
import { PropertyInquiry as PropertyInquiryType } from '../types/schema.js';

interface IPropertyInquiry extends Omit<PropertyInquiryType, 'id' | 'createdAt' | 'updatedAt'>, Document {}

const propertyInquirySchema = new Schema<IPropertyInquiry>(
  {
    requestType: {
      type: String,
      enum: ['viewing', 'buy', 'meeting'],
      required: true
    },
    propertyId: { type: String, required: true },
    buyerId: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new'
    },
    metadata: {
      type: {
        preferredDate: Date,
        preferredTime: String,
        contactPhone: String
      },
      default: null
    }
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
      }
    }
  }
);

// Indexes for efficient queries
propertyInquirySchema.index({ propertyId: 1 });
propertyInquirySchema.index({ buyerId: 1 });
propertyInquirySchema.index({ status: 1 });
propertyInquirySchema.index({ createdAt: -1 });
propertyInquirySchema.index({ requestType: 1 });

// Compound indexes for common queries
propertyInquirySchema.index({ propertyId: 1, status: 1 });
propertyInquirySchema.index({ buyerId: 1, status: 1 });

export const PropertyInquiryModel = mongoose.model<IPropertyInquiry>('PropertyInquiry', propertyInquirySchema);
