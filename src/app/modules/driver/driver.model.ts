import { Schema, model } from "mongoose";
import { IDriver } from "./driver.interface";
 

const driverSchema = new Schema<IDriver>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One-to-one
    },
    licenseNo: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleMake: {
      type: String,
      required: true,
    },
    vehicleModel: {
      type: String,
      required: true,
    },
    vehicleYear: {
      type: Number,
      required: true,
    },
    vehicleColor: {
      type: String,
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

export const Driver = model<IDriver>("Driver", driverSchema);
