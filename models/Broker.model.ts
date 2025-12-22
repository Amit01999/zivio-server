import mongoose, { Schema, Document } from 'mongoose';
import { Broker as BrokerType } from '../types/schema.js';

interface IBroker extends Omit<BrokerType, 'id' | 'createdAt'>, Document {}

const brokerSchema = new Schema<IBroker>(
  {
    userId: { type: String, required: true },
    agencyName: { type: String },
    licenseNo: { type: String },
    nid: { type: String },
    address: { type: String },
    description: { type: String },
    socialLinks: {
      type: {
        facebook: String,
        linkedin: String,
        website: String
      },
      default: null
    },
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 2.5 },
    totalListings: { type: Number, default: 0 },
    totalDeals: { type: Number, default: 0 }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

brokerSchema.index({ userId: 1 });

export const BrokerModel = mongoose.model<IBroker>('Broker', brokerSchema);
