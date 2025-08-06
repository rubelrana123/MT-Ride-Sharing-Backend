// import AppError from "../../errorHelpers/appError";
import { Types } from "mongoose";
import { IRide } from "./ride.interface";
import { Ride } from "./ride.model";
import AppError from "../../errorHelpers/appError";
 
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
export const getMyRide = async (userId : string) => {
   
  const ride = await Ride.find({rider : userId});
  return ride;
};
export const updateRideStatus = async (rideId : string, status : boolean) => { 
      const isRideExist = await Ride.findOne({_id : rideId});
      if (!isRideExist) {
        throw new AppError(409, "Ride not Exist");
      }
     const updatedBlockedUser = await Ride.findByIdAndUpdate({_id : rideId},{status : status}, { new: true })
      return updatedBlockedUser
    }
export const RideServices = {
  createRide,
  getMyRide,
  updateRideStatus
};
