import { Schema, model } from "mongoose";
import { IRide } from "./ride.interface";

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
      type: String,
      required: true,
    },
    destLoc: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "picked_up",
        "in_transit",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },
    fare: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export const Ride = model<IRide>("Ride", rideSchema);
