// types/ride.interface.ts

import { Types } from "mongoose";
export type RideStatus =
  | "requested"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface IRide {
  _id: Types.ObjectId;

  rider: Types.ObjectId; // Reference to User

  driver?: Types.ObjectId; // Reference to Driver, optional at request time

  pickupLoc: string;

  destLoc: string;

  status: RideStatus;

  fare?: number;

  distance: number; // in km or miles
}
