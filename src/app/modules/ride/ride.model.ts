import { Schema, model } from "mongoose";
import { IRide, RideStatus } from "./ride.interface";


const rideLocSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);
const rideSchema = new Schema<IRide>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    pickupLoc: {
      type: rideLocSchema,
      required: true,
    },
    destLoc: {
      type: rideLocSchema,
      required: true,
    },
    distance :  {
      type: String,
      required: true,
    },
    rideType: {
      type: String,
      required: true,
    },
    fare: {
      type: String,
      required: true,
    },
    rideStatus: {
       type: String,
      enum: Object.values(RideStatus),
      default: RideStatus.REQUESTED,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    rejectedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    pickedupAt: {
      type: Date,
    },
    inTransitAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    }, 
  },
  {
     timestamps: true,
    versionKey: false
  }
);
rideSchema.index({ pickupLoc: "2dsphere" });
rideSchema.index({ destLoc: "2dsphere" });

export const Ride = model<IRide>("Ride", rideSchema);
