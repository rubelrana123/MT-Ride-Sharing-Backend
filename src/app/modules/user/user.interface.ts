import { Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  RIDER = "RIDER",
  DRIVER = "DRIVER",
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}
export interface IUser {
  _id?: Types.ObjectId; 
   name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string;
  address?: string;
  role: UserRole;
  auths: IAuthProvider[];
  isVerified?: boolean;
  isDeleted?: boolean;
  isBlocked?: boolean;
}
