import mongoose, { Schema, Document } from 'mongoose';
import { Favorite as FavoriteType } from '../types/schema.js';

interface IFavorite extends Omit<FavoriteType, 'id' | 'createdAt'>, Document {}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: String, required: true },
    listingId: { type: String, required: true }
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

favoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<IFavorite>('Favorite', favoriteSchema);
