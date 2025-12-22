import mongoose, { Schema, Document } from 'mongoose';
import { Transaction as TransactionType, paymentStatuses } from '../types/schema.js';

interface ITransaction extends Omit<TransactionType, 'id' | 'createdAt'>, Document {}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true },
    listingId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    gateway: { type: String },
    type: {
      type: String,
      enum: ['featured', 'promotion', 'commission'],
      required: true
    },
    status: {
      type: String,
      enum: paymentStatuses,
      default: 'pending'
    },
    paymentDetails: { type: Schema.Types.Mixed }
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

transactionSchema.index({ userId: 1 });

export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);
