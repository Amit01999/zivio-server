import mongoose, { Schema, Document } from 'mongoose';
import { Review as ReviewType } from '../types/schema.js';

interface IReview extends Omit<ReviewType, 'id' | 'createdAt'>, Document {}

const reviewSchema = new Schema<IReview>(
  {
    brokerId: { type: String, required: true },
    reviewerId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }
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

reviewSchema.index({ brokerId: 1 });

export const ReviewModel = mongoose.model<IReview>('Review', reviewSchema);
