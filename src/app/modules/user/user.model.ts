import { model, Schema } from "mongoose";
import { IAuthProvider, IsActive, IUser, UserRole } from "./user.interface";


const authProviderSchema = new Schema<IAuthProvider>({
    provider: { type: String, required: true },
    providerId: { type: String, required: true }
}, {
    versionKey: false,
    _id: false
})
const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.RIDER },
    picture: { type: String },
    phone: { type: String },
    address: { type: String },
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    auths: [authProviderSchema],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);


export const User = model<IUser>("User", userSchema)