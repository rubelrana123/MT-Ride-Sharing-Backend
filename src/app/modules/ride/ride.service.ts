 
import { IRide } from "./ride.interface";
import { Ride } from "./ride.model";
import AppError from "../../errorHelpers/appError";
import { User } from "../user/user.model";
import { QueryBuilder } from "../../utils/queryBuilder";
import { rideSearchableFields } from "./ride.constant";
import { cancelledRideToday } from "../../utils/cancelledRideToday";
import { calculateFare } from "../../utils/calculateFare";
import { calculateDistanceInKm } from "../../utils/calculateDistanceInKm";
 
const requestRide = async (payload: Partial<IRide>, userId: string) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  const todaysCancelledCount = await cancelledRideToday(userId);

  if (todaysCancelledCount >= 3) {
    throw new AppError(
     400,
      "You cannot request a ride today as you have cancelled 3 rides already."
    );
  }

  const lat1 = payload.pickupLoc?.coordinates[0] as number;
  const long1 = payload.pickupLoc?.coordinates[1] as number;
  const lat2 = payload.destLoc?.coordinates[0] as number;
  const long2 = payload.destLoc?.coordinates[1] as number;

  const distance = calculateDistanceInKm(lat1, long1, lat2, long2);
  const totalFare = calculateFare(distance);

  const rideData = {
    ...payload,
    rider: userId,
    distance :  distance.toFixed(2) + "km",
    fare: totalFare,
  };

  const rideRequested = await Ride.create(rideData);

  return rideRequested;
};

 const getAllRides = async (userId: string, query: Record<string, string>) => {
  const isUserExist = await User.findById(userId);

  // check user is exist or not
  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  // check user are valid or not
  if (isUserExist._id.toString() !== userId) {
    throw new AppError(
      401,
      "You are not authorized for this action"
    );
  }

    //   Create a QueryBuilder instance with the User model and the query
    const queryBuilder = new QueryBuilder(Ride.find(), query);
  
    //   Apply filters, search, sort, fields, and pagination using the QueryBuilder methods
    const users = queryBuilder
      .search(rideSearchableFields)
      .filter()
      .sort()
      .fields()
      .paginate()
      .populate("rider", "-password")
      .populate("driver", "-password");
  
  
      
    //  Execute the query and get the data and metadata
    const [data, meta] = await Promise.all([
      users.build().select("-password -auths"),
      queryBuilder.getMeta(),
    ]);
  

  // const allRides = await Ride.find().populate("rider", "-password").populate("driver", "-password");


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
  requestRide,
  getAllRides,
  getMyRide,
  updateRideStatus
};
