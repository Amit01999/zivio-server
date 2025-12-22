import mongoose, { Schema, Document } from 'mongoose';
import { Message as MessageType } from '../types/schema.js';

interface IMessage extends Omit<MessageType, 'id' | 'createdAt'>, Document {}

const messageSchema = new Schema<IMessage>(
  {
    fromUserId: { type: String, required: true },
    toUserId: { type: String, required: true },
    listingId: { type: String },
    text: { type: String, required: true },
    attachments: [{ type: String }],
    read: { type: Boolean, default: false }
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

messageSchema.index({ fromUserId: 1 });
messageSchema.index({ toUserId: 1 });
messageSchema.index({ listingId: 1 });

export const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
