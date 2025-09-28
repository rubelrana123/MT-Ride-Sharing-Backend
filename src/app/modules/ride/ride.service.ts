/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { IRide, RideStatus } from "./ride.interface";
import { Ride } from "./ride.model";
import AppError from "../../errorHelpers/appError";
import { User } from "../user/user.model";
import { QueryBuilder } from "../../utils/queryBuilder";
import { rideSearchableFields } from "./ride.constant";
import { cancelledRideToday } from "../../utils/cancelledRideToday";
import { calculateFare } from "../../utils/calculateFare";
import { calculateDistanceInKm } from "../../utils/calculateDistanceInKm";
import { Driver } from "../driver/driver.model";
import dayjs from "dayjs";
import { ActiveRide, rideStatusFlow, statusesThatNeedVerification } from "./ride.status";
import { Availability, DriverStatus } from "../driver/driver.interface";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "../user/user.interface";
 
 
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

  const exists = await Ride.findOne({
  "pickupLoc.coordinates": [lat1, long1],
  "destLoc.coordinates": [lat2, long2]
});

if (exists) {
  throw new Error("Ride with same pickup and destination already exists");
}

  const distance = calculateDistanceInKm(lat1, long1, lat2, long2);
  const totalFare = calculateFare(distance, payload.rideType as string) ;

  const rideData = {
    ...payload,
    rider: userId,
    distance :  distance.toFixed(2) + " " + "km",
    fare: totalFare + " "  + "BDT",
  };

  const rideRequested = await Ride.create(rideData);

  return rideRequested;
};


export const getAllRides = async (userId: string, query: Record<string, string>) => {
  // 1️⃣ Check if user exists
  const isUserExist = await User.findById(userId);
  if (!isUserExist) throw new AppError(404, "User not found");

  // 2️⃣ Check authorization
  if (isUserExist._id.toString() !== userId) {
    throw new AppError(401, "You are not authorized for this action");
  }

  // 3️⃣ Extract minFare/maxFare from query
  const { minFare, maxFare, ...otherQuery } = query;

  // 4️⃣ Create QueryBuilder instance for other query params
  const queryBuilder = new QueryBuilder(Ride.find(), otherQuery);

  // 5️⃣ Apply QueryBuilder methods
  const ridesQuery = queryBuilder
    .filter()
    .search(rideSearchableFields) // add other searchable fields if needed
    .sort()
    .fields()
    .paginate()
    .populate("rider", "-password -auths")
    .populate("driver", "-password");

  // 6️⃣ Execute query
  let data = await ridesQuery.build();

  // 7️⃣ Apply minFare/maxFare filtering (controller-level)
  if (minFare || maxFare) {
    const min = minFare ? Number(minFare) : 0;
    const max = maxFare ? Number(maxFare) : Infinity;

    data = data.filter((ride: any) => {
      const numericFare = Number(ride.fare.split(" ")[0]); // "166 BDT" -> 166
      return numericFare >= min && numericFare <= max;
    });
  }

  // 8️⃣ Get metadata
  const meta = await queryBuilder.getMeta();

  return { data, meta };
};

const getRideDetails = async (rideId: string, decodedToken: JwtPayload) => {
  const { userId, role } = decodedToken;

  const ride = await Ride.aggregate([
    { $match: { _id: new Types.ObjectId(rideId) } },

    // Rider info
    {
      $lookup: {
        from: "users",
        localField: "rider",
        foreignField: "_id",
        as: "riderInfo",
      },
    },

    // Driver user info
    {
      $lookup: {
        from: "users",
        localField: "driver",
        foreignField: "_id",
        as: "driverUserInfo",
      },
    },

    // Driver vehicle info
    {
      $lookup: {
        from: "drivers",
        localField: "driver",
        foreignField: "driver",
        as: "driverVehicleInfo",
      },
    },

    { $unwind: "$riderInfo" },
    { $unwind: { path: "$driverUserInfo", preserveNullAndEmptyArrays: true } },
    {
      $unwind: { path: "$driverVehicleInfo", preserveNullAndEmptyArrays: true },
    },

    {
      $project: {
        _id: 1,
        rideStatus: 1,
        fare: 1,
        statusLogs: 1,
        commisionRate: 1,
        platformEarnings: 1,
        createdAt: 1,

        // ✅ remap fields
        pickupLoc: "$pickupLoc",
        destLoc: "$destLoc",
        pickupAddress: 1, // must be stored in ride collection
        destinationAddress: 1, // must be stored in ride collection

        rider: {
          _id: "$riderInfo._id",
          name: "$riderInfo.name",
          phone: "$riderInfo.phone", // ✅ your users collection uses "phone"
          email: "$riderInfo.email",
          role:  "$riderInfo.role" , // convert to "rider"
        },

        driver: {
          $cond: {
            if: { $ifNull: ["$driverUserInfo", false] },
            then: {
              _id: "$driverUserInfo._id",
              name: "$driverUserInfo.name",
              phone: "$driverUserInfo.phone", // ✅ match users collection
              email: "$driverUserInfo.email",
              role:  "$driverUserInfo.role" ,
              vehicleInfo: "$driverVehicleInfo.vehicleInfo",
              licenseNumber: "$driverVehicleInfo.licenseNumber",
            },
            else: null,
          },
        },
      },
    },
  ]);

  if (!ride[0]) {
    throw new AppError(404, "This ride does not exist");
  }
  console.log(ride[0], "ride details");
  const isAdmin = role === UserRole.ADMIN;
  const isRiderOfThisRide = ride[0]?.rider._id?.toString() === userId;
  const isDriverOfThisRide = ride[0]?.driver?._id?.toString() === userId;
  const isAnyDriver = role === UserRole.DRIVER;
if (!isAdmin && !isRiderOfThisRide && !isDriverOfThisRide && !isAnyDriver) {
  throw new AppError(401, "You are not authorized to view this ride's details.");
}

  // ✅ wrap response
  return {
    statusCode: 200,
    success: true,
    message: "Ride Details has been retrive successfully",
    data: ride[0],
  };
};

const updateRideStatus = async (
  userId: string,
  rideId: string,
  newStatus: RideStatus
) => {
  console.log(userId, rideId,newStatus)
  const session = await Ride.startSession();

  try {
    session.startTransaction();

    const isUserExist = await User.findById(userId);

    // check user is exist or not
    if (!isUserExist) {
      throw new AppError(404, "User not found");
    }

    // check user are valid or not
    if (isUserExist.role !== UserRole.ADMIN && isUserExist.role !== UserRole.DRIVER) {
      throw new AppError(
       401,
        "You are not authorized for this action"
      );
    }

    const isRideExist = await Ride.findById(rideId);

    // checking ride exist or not
    if (!isRideExist) {
      throw new AppError(404, "Ride not found");
    }

    const isDriverExist = await Driver.findOne({ driver: userId });

    // checking if driver status pending or rejected or suspend
    if (
      isDriverExist &&
      (isDriverExist.driverStatus === DriverStatus.PENDING ||
        isDriverExist.driverStatus === DriverStatus.REJECTED ||
        isDriverExist.driverStatus === DriverStatus.SUSPEND)
    ) {
      throw new AppError(
        400,
        `You cann't accept any ride request. Because your driving status is ${isDriverExist.driverStatus}`
      );
    }

    // checking driver is online or offline
    if (isDriverExist && isDriverExist.availability === Availability.OFFLINE) {
      throw new AppError(
        400,
        `You cann't update ride status. Because your are offline`
      );
    }

    if (RideStatus.ACCEPTED === newStatus) {
      const isDriverHaveActiveRide = await Ride.findOne({
        driver: userId,
        rideStatus: { $in: ActiveRide },
      });

      // Check if the driver already has an active ride with a non-completed status
      if (isDriverHaveActiveRide) {
        throw new AppError(
          400,
          `You already have an active ride in progress`
        );
      }
    }

    // check if rider already cancelled
    if (isRideExist.rideStatus === RideStatus.CANCELLED) {
      throw new AppError(
        400,
        `This ride has been already '${isRideExist.rideStatus}' by the rider.`
      );
    }
    // check if rider already cancelled
    if (isRideExist.rideStatus === RideStatus.REJECTED) {
      throw new AppError(
        400,
        `This ride has been already '${isRideExist.rideStatus}'`
      );
    }

    // Ensure the current ride status is allowed to transition to the requested new status
    if (isUserExist.role !== UserRole.ADMIN) {
      if (!rideStatusFlow[isRideExist.rideStatus].includes(newStatus)) {
        throw new AppError(
          400,
          `Invalid status transition from '${isRideExist.rideStatus}' to '${newStatus}'.`
        );
      }
    }

    // Checking already have any driver assign for this ride
    if (statusesThatNeedVerification.includes(newStatus)) {
      const isAssignedDriver = isRideExist.driver
        ? isRideExist.driver.toString() === userId
        : false;
      const isAdmin = isUserExist.role === UserRole.ADMIN;
      if (!isAssignedDriver && !isAdmin) {
        throw new AppError(
          401,
          `You are not assign to this ride`
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateQuery: any = {
      $set: {
        rideStatus: newStatus,
        driverName: isUserExist?.name,
      },
      $push: {
        statusLogs: [
          {
            status: newStatus,
            timeStamp: dayjs().tz("Asia/Dhaka").format(),
          },
        ],
      },
    };

    //  Assgining a driver for accpeted or rejected status
    if (
      newStatus === RideStatus.ACCEPTED ||
      newStatus === RideStatus.REJECTED ||
      newStatus === RideStatus.CANCELLED
    ) {
      updateQuery.$set.driver = userId;
    }

    // update driver earning when ride is compoeted
if (newStatus === RideStatus.COMPLETED) {
  // get numeric part of fare ("166 BDT" -> 166)
  const fareAmount = parseInt(isRideExist.fare.replace(/[^\d]/g, ""), 10) || 0;

  // fetch driver
  const driver = await Driver.findOne({ driver: isRideExist.driver });

  // get numeric part of existing earnings ("150 BDT" -> 150)
  const currentEarnings = driver?.earnings
    ? parseInt(String(driver.earnings).replace(/[^\d]/g, ""), 10)
    : 0;

  // calculate new total
  const updatedEarnings = currentEarnings + fareAmount;

  // update with formatted string (e.g., "316 BDT")
  await Driver.findOneAndUpdate(
    { driver: isRideExist.driver },
    { $set: { earnings: `${updatedEarnings} BDT` } },
    { session }
  );
}

    // updating ride status
    const rideStatusUpdate = await Ride.findByIdAndUpdate(rideId, updateQuery, {
      new: true,
      runValidators: true,
      session,
    });

    // if (
    //   rideStatusUpdate?.rideStatus === "completed" ||
    //   rideStatusUpdate?.rideStatus === "cancelled"
    // ) {
    //   io.to(rideId).emit("ride_Status_updated", {
    //     rideId,
    //     newStatus,
    //     rideDetails: rideStatusUpdate,
    //   });
    // }

    await session.commitTransaction();
    await session.endSession();

    return rideStatusUpdate;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const viewRideHistroy = async (
  userId: string,
  query: Record<string, string>
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  if (
    isUserExist._id.toString() !== userId &&
    isUserExist.role !== UserRole.RIDER &&
    isUserExist.role !== UserRole.DRIVER
  ) {
    throw new AppError(401, "You are not authorized for this action");
  }

  // Rider vs Driver আলাদা query
  let findQuery = {};

  if (isUserExist.role === UserRole.RIDER) {
    // Rider → তার সব ride (requested সহ)
    findQuery = { rider: userId };
  } else if (isUserExist.role === UserRole.DRIVER) {
    // Driver → তার সব assign করা ride
    findQuery = { driver: userId };
  }

  const queryBuilder = new QueryBuilder(Ride.find(findQuery), query);

  // Apply filters, search, sort, fields, and pagination
  const rides = queryBuilder
    .search(rideSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .populate("rider", "-password -auths")
    .populate("driver", "-password -auths");

  // Execute query & metadata একসাথে আনা
  const [data, meta] = await Promise.all([
    rides.build().select("-password -auths"),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};


// const viewRideHistroy = async (
//   userId: string,
//   query: Record<string, string>
// ) => {
//   const isUserExist = await User.findById(userId);
// console.log(userId, query, "from pservice histo")
//   if (!isUserExist) {
//     throw new AppError(404, "User not found");
//   }

//   if (
//     isUserExist._id.toString() !== userId &&
//     isUserExist.role !== UserRole.RIDER &&
//     isUserExist.role !== UserRole.DRIVER
//   ) {
//     throw new AppError(
//       401,
//       "You are not authorized for this action"
//     );
//   }

//   const queryBuilder = new QueryBuilder(
//     Ride.find({
//       $and: [
//         {
//           $or: [{ rider: userId }, { driver: userId }],
//         },
//         {
//           rideStatus: {
//             $nin: ["accepted", "requested", "picked_up", "in_transit"],
//           },
//         },
//       ],
//     }),
//     query
//   );

//   //   Apply filters, search, sort, fields, and pagination using the QueryBuilder methods
//   const rides = queryBuilder
//     .search(rideSearchableFields)
//     .filter()
//     .sort()
//     .fields()
//     .paginate()
//     .populate("rider", "-password -auths")
//     .populate("driver", "-password -auths");

//   //  Execute the query and get the data and metadata
//   const [data, meta] = await Promise.all([
//     rides.build().select("-password -auths"),
//     queryBuilder.getMeta(),
//   ]);
//   return { data, meta };
// };

// const viewRideHistroy = async (userId: string) => {
//   const isUserExist = await User.findById(userId);

//   if (!isUserExist) {
//     throw new AppError(404, "User not found");
//   }

//   if (isUserExist._id.toString() !== userId) {
//     throw new AppError(
//       401,
//       "You are not authorized for this action"
//     );
//   }

//   const rideHistroy = await Ride.find({
//     $and: [
//       { rider: userId },
//       {
//         rideStatus: { $nin: ["accepted", "picked_up", "in_transit"] },
//       },
//     ],
//   });

//   return rideHistroy;
// };
const viewEarningHistory = async (userId: string) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  if (isUserExist._id.toString() !== userId) {
    throw new AppError(
      401,
      "You are not authorized for this action"
    );
  }

  const driverRideHistroy = await Ride.find({
    driver: userId,
    rideStatus: { $in: [RideStatus.COMPLETED] },
  });

  return driverRideHistroy;
};
const cancelRide = async (
  userId: string,
  rideId: string,
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  if (isUserExist._id.toString() !== userId) {
    throw new AppError(
      401,
      "You are not authorized for this action"
    );
  }

  const isRideExist = await Ride.findById(rideId);

  if (!isRideExist) {
    throw new AppError(404, "Ride not found");
  }

  if (
    isRideExist.rideStatus === RideStatus.ACCEPTED ||
    isRideExist.rideStatus === RideStatus.COMPLETED ||
    isRideExist.rideStatus === RideStatus.PICKED_UP ||
    isRideExist.rideStatus === RideStatus.REJECTED ||
    isRideExist.rideStatus === RideStatus.IN_TRANSIT
  ) {
    throw new AppError(
      400,
      `You cann't cancel your ride. Because your ride status is ${isRideExist.rideStatus}`
    );
  }

  if (isRideExist.rideStatus === RideStatus.CANCELLED) {
    throw new AppError(
      400,
      "You already  cancelled this ride"
    );
  }

  const todaysCancelledCount = await cancelledRideToday(userId);

  if (todaysCancelledCount >= 3) {
    throw new AppError(
      400,
      "You cannot cancel this ride — your daily cancel limit (3) has been reached."
    );
  }

  const cancelledRide = await Ride.findByIdAndUpdate(
    rideId,
    { rideStatus: "cancelled", cancelledAt: Date.now() },
    { new: true, runValidators: true }
  );

  return cancelledRide;
};

// const getRiderActiveRide = async (riderId: string) => {
//   const activeRide = await Ride.findOne({
//     rider: new Types.ObjectId(riderId),
//     rideStatus: { $in: ["requested", "accepted", "picked_up", "in_transit"] },
//   }).sort({ createdAt: -1 }); // latest active ride if multiple
//   return activeRide;
// };
const getMyActiveRide = async (userId: string) => {
  const activeRideDetails = await Ride.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              { rider: new Types.ObjectId(userId) },
              { rideStatus: { $in: ["requested", "accepted", "picked_up", "in_transit"] } },
            ],
          },
          {
            $and: [
              { driver: new Types.ObjectId(userId) },
              { rideStatus: { $in: ["accepted", "picked_up", "in_transit"] } },
            ],
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "rider",
        foreignField: "_id",
        as: "riderInfo",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "driver",
        foreignField: "_id",
        as: "driverUserInfo",
      },
    },
    {
      $lookup: {
        from: "drivers",
        localField: "driver",
        foreignField: "driver",
        as: "driverVehicleInfo",
      },
    },
    { $unwind: "$riderInfo" },
    { $unwind: { path: "$driverUserInfo", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$driverVehicleInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        rideStatus: 1,
        fare: 1,
        createdAt: 1,
        pickupLoc: 1,          // ✅ correct field
        destLoc: 1,            // ✅ correct field
        distance: 1,
        rider: {
          _id: "$riderInfo._id",
          name: "$riderInfo.name",
          phoneNumber: "$riderInfo.phoneNumber",
          email: "$riderInfo.email",
          role: "$riderInfo.role",
        },
        driver: {
          $cond: {
            if: { $ifNull: ["$driverUserInfo", false] },
            then: {
              _id: "$driverUserInfo._id",
              name: "$driverUserInfo.name",
              phoneNumber: "$driverUserInfo.phoneNumber",
              email: "$driverUserInfo.email",
              role: "$driverUserInfo.role",
              vehicleInfo: "$driverVehicleInfo.vehicleInfo",
              licenseNumber: "$driverVehicleInfo.licenseNumber",
            },
            else: null,
          },
        },
      },
    },
  ]);

  if (activeRideDetails.length === 0) {
    return null;
  }

  return activeRideDetails[0];
};

export const RideServices = {
  requestRide,
  getAllRides,
  viewRideHistroy,
  getRideDetails,
  updateRideStatus,
  viewEarningHistory,
  cancelRide,
  getMyActiveRide
};
