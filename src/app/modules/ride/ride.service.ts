// import AppError from "../../errorHelpers/appError";
import { Types } from "mongoose";
import { IRide } from "./ride.interface";
import { Ride } from "./ride.model";
import AppError from "../../errorHelpers/appError";
import { User } from "../user/user.model";
import { QueryBuilder } from "../../utils/queryBuilder";
import { rideSearchableFields } from "./ride.constant";
 
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
const getAllRides = async (userId: string, query: Record<string, string>) => {
  const isUserExist = await User.findById(userId);

  // check user is exist or not
  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }
    //   Create a QueryBuilder instance with the User model and the query
    // const queryBuilder = new QueryBuilder(Ride.find(), query);
  
    //   Apply filters, search, sort, fields, and pagination using the QueryBuilder methods
    // const users = queryBuilder
    //   .search(rideSearchableFields)
      // .filter()
      // .sort()
      // .fields()
      // .paginate()
      // .populate("rider", "-password")
      // .populate("driver", "-password");
  
  
      
    //  Execute the query and get the data and metadata
    // const [data, meta] = await Promise.all([
    //   users.build().select("-password -auths"),
    //   queryBuilder.getMeta(),
    // ]);
  

  const allRides = await Ride.find().populate("rider", "-password").populate("driver", "-password");


  return {
    data, meta
  }
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
  getAllRides,
  getMyRide,
  updateRideStatus
};
