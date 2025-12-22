import mongoose, { Schema, Document } from 'mongoose';
import { ComparisonCart as ComparisonCartType } from '../types/schema.js';

interface IComparisonCart extends Omit<ComparisonCartType, 'id' | 'createdAt' | 'updatedAt'>, Document {}

const comparisonCartSchema = new Schema<IComparisonCart>(
  {
    userId: { type: String, required: true, unique: true },
    listingIds: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr: string[]) {
          return arr.length <= 5;
        },
        message: 'Comparison cart cannot contain more than 5 properties'
      }
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

// Index on userId for fast lookups (unique ensures one cart per user)
comparisonCartSchema.index({ userId: 1 });

export const ComparisonCartModel = mongoose.model<IComparisonCart>('ComparisonCart', comparisonCartSchema);
