import mongoose, { Schema, Document } from 'mongoose';

export interface IThreadMessage {
  senderRole: 'admin' | 'seller';
  senderId: string;
  text: string;
  sentAt: Date;
}

export interface IAdminSellerMessage extends Document {
  adminId: string;
  sellerId: string;
  propertyId: string;
  message: string;
  relatedInquiryId?: string;
  read: boolean;
  thread: IThreadMessage[];
  createdAt: Date;
}

const threadMessageSchema = new Schema<IThreadMessage>(
  {
    senderRole: { type: String, enum: ['admin', 'seller'], required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const adminSellerMessageSchema = new Schema<IAdminSellerMessage>(
  {
    adminId: { type: String, required: true },
    sellerId: { type: String, required: true },
    propertyId: { type: String, required: true },
    message: { type: String, required: true },
    relatedInquiryId: { type: String, default: null },
    read: { type: Boolean, default: false },
    thread: { type: [threadMessageSchema], default: [] },
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

adminSellerMessageSchema.index({ sellerId: 1 });
adminSellerMessageSchema.index({ propertyId: 1 });
adminSellerMessageSchema.index({ sellerId: 1, read: 1 });
adminSellerMessageSchema.index({ createdAt: -1 });

export const AdminSellerMessageModel = mongoose.model<IAdminSellerMessage>(
  'AdminSellerMessage',
  adminSellerMessageSchema
);
