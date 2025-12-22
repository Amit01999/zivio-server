import mongoose, { Schema, Document } from 'mongoose';
import { ViewingRequest as ViewingRequestType } from '../types/schema.js';

interface IViewingRequest extends Omit<ViewingRequestType, 'id' | 'createdAt'>, Document {}

const viewingRequestSchema = new Schema<IViewingRequest>(
  {
    listingId: { type: String, required: true },
    userId: { type: String, required: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    }
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

viewingRequestSchema.index({ listingId: 1 });
viewingRequestSchema.index({ userId: 1 });

export const ViewingRequestModel = mongoose.model<IViewingRequest>('ViewingRequest', viewingRequestSchema);
