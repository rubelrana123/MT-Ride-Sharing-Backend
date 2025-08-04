import { Types } from "mongoose";
import { IUser } from "../user/user.interface";

export interface IDriver extends IUser {
  _id: Types.ObjectId; // Primary key
  user: Types.ObjectId; // Reference to User model (one-to-one)
  licenseNo: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  isApproved: boolean;
  isOnline: boolean; 
}
