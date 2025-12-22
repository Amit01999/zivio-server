import mongoose, { Schema, Document } from 'mongoose';
import { User as UserType, userRoles } from '../types/schema.js';

interface IUser extends Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>, Document {}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: userRoles,
      default: 'buyer'
    },
    verified: { type: Boolean, default: false },
    profilePhotoUrl: { type: String, default: null }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

userSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUser>('User', userSchema);
