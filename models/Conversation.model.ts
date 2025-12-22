import mongoose, { Schema, Document } from 'mongoose';
import { Conversation as ConversationType } from '../types/schema.js';

interface IConversation extends Omit<ConversationType, 'id' | 'createdAt'>, Document {}

const conversationSchema = new Schema<IConversation>(
  {
    participantIds: [{ type: String, required: true }],
    listingId: { type: String },
    lastMessageAt: { type: Date }
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

conversationSchema.index({ participantIds: 1 });

export const ConversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);
