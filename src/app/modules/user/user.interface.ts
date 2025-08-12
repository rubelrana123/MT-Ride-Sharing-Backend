import { Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  RIDER = "RIDER",
  DRIVER = "DRIVER",
}
export enum IsActive {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
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
  isActive?: IsActive;
  isVerified?: boolean;
  isDeleted?: boolean;
  auths: IAuthProvider[];
}

/* 

*/