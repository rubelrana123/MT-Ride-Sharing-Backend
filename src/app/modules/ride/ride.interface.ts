import { Types } from "mongoose";
//<field>: { type: <GeoJSON type> , coordinates: <coordinates> }
export interface IRideLocation {
  type: "Point";
  coordinates: [number, number];
}

export enum RideStatus {
  REQUESTED = "requested",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
  ACCEPTED = "accepted",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  COMPLETED = "completed",
}

export interface IRide {
  rider: Types.ObjectId; // Reference to User
  driver?: Types.ObjectId; // Reference to Driver, optional at request time
  pickupLoc: IRideLocation;
  destLoc: IRideLocation;
  distance : string;
  fare: number;
  status: RideStatus;
  requestedAt: Date;
  cancelledAt: Date;
  rejectedAt: Date;
  acceptedAt: Date;
  completedAt: Date;
  pickedupAt: Date;
  inTransitAt: Date;
}
