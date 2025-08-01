import { model, Schema } from "mongoose";
import { IAuthProvider, IUser, UserRole } from "./user.interface";


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
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.RIDER
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],
}, {
    timestamps: true,
    versionKey: false
})


export const User = model<IUser>("User", userSchema)