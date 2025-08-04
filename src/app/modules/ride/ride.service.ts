// import AppError from "../../errorHelpers/appError";
import { Types } from "mongoose";
import { IRide } from "./ride.interface";
import { Ride } from "./ride.model";
 
export const createRide = async (payload: Partial<IRide>) => {
  const { distance,rider,pickupLoc,destLoc,status,...rest } = payload;
  const existingRide = await Ride.findOne({
    rider : new Types.ObjectId(rider),
    pickupLoc,
    destLoc,
    status,
  });

  if (existingRide) {
    throw new Error("Ride with the same details already exists.");
  }
  const fare = Number(distance) * 10;
  const ridePayload = {
    fare,
    rider,
    pickupLoc,
    destLoc,
    status,
    distance,
   ...rest
  };
  console.log("ridePayload", ridePayload)
  const user = await Ride.create(ridePayload);
  return user;
};

export const RideServices = {
  createRide,
};
