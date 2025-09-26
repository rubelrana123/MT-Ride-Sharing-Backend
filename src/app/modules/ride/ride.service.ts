 
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
import { DriverActiveRide, rideStatusFlow } from "./ride.status";
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
  const totalFare = calculateFare(distance);

  const rideData = {
    ...payload,
    rider: userId,
    distance :  distance.toFixed(2) + " " + "km",
    fare: totalFare + " "  + "BDT",
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
        pickupCoordinates: "$pickupLoc",
        destinationCoordinates: "$destLoc",
        pickupAddress: 1, // must be stored in ride collection
        destinationAddress: 1, // must be stored in ride collection

        rider: {
          _id: "$riderInfo._id",
          name: "$riderInfo.name",
          phoneNumber: "$riderInfo.phone", // ✅ your users collection uses "phone"
          email: "$riderInfo.email",
          role:  "$riderInfo.role" , // convert to "rider"
        },

        driver: {
          $cond: {
            if: { $ifNull: ["$driverUserInfo", false] },
            then: {
              _id: "$driverUserInfo._id",
              name: "$driverUserInfo.name",
              phoneNumber: "$driverUserInfo.phone", // ✅ match users collection
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
  // 1 Start a MongoDB session and transaction.
  const session = await Ride.startSession();

  try {
    session.startTransaction();
    // 2 Check if the user exists. If not, throw an error.
    const isUserExist = await User.findById(userId);
    if (!isUserExist) {
      throw new AppError(404, "User not found");
    }

    //3. Validate that the user ID matches the one provided (authorization check).
    if (isUserExist._id.toString() !== userId) {
      throw new AppError(
        401,
        "You are not authorized for this action"
      );
    }
  //  4. Check if the ride exists. If not, throw an error.
    const isRideExist = await Ride.findById(rideId);
    if (!isRideExist) {
      throw new AppError(404, "Ride not found");
    }
   //5. Find the driver record associated with the user ID.
    const isDriverExist = await Driver.findOne({ driver: userId });

    //6. Verify the driver’s status (cannot be PENDING, REJECTED, or SUSPEND).
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

    //7. Ensure the driver is not OFFLINE.
    if (isDriverExist && isDriverExist.availability === Availability.OFFLINE) {
      throw new AppError(
        400,
        `You cann't update ride status. Because your are offline`
      );
    }

    if (
      RideStatus.REJECTED === newStatus ||
      RideStatus.ACCEPTED === newStatus
    ) {
      //8 Check if the driver already has an active ride with a non-completed status
      const isDriverHaveActiveRide = await Ride.findOne({
        driver: userId,
        rideStatus: { $in: DriverActiveRide }, // accepted, rejected, in-transmit
      });

     
      if (isDriverHaveActiveRide) {
        throw new AppError(
          400,
          `You already have an active ride in progress`
        );
      }
    }

    // prevent ride cancell by driver
    if (RideStatus.CANCELLED === newStatus) {
      throw new AppError(400, "You cann't cancel any ride");
    }

    // check if rider already cancelled
    if (isRideExist.rideStatus === RideStatus.CANCELLED) {
      throw new AppError(
        400,
        `This ride has already been '${isRideExist.rideStatus}' by the rider.`
      );
    }

    // Check that the requested status transition is valid using rideStatusFlow.
    if (!rideStatusFlow[isRideExist.rideStatus].includes(newStatus)) {
      throw new AppError(
        400,
        `Invalid status transition from '${isRideExist.rideStatus}' to '${newStatus}'.`
      );
    }

    //  Prepare an update object and get the current timestamp in Dhaka timezone.
    let updateRideData;
    const nowInDhaka = dayjs().tz("Asia/Dhaka").format();

    // . Handle ACCEPTED and REJECTED: assign driver, update status, record timestamp.
    if (RideStatus.REJECTED === newStatus) {
      updateRideData = {
        driver: userId,
        rideStatus: newStatus,
        acceptedAt: nowInDhaka,
      };
    }
    if (RideStatus.ACCEPTED === newStatus) {
      updateRideData = {
        driver: userId,
        rideStatus: newStatus,
        acceptedAt: nowInDhaka,
      };
    }

    // If the ride is already accepted, verify that the current user is the assigned driver
    if (isRideExist.rideStatus === RideStatus.ACCEPTED) {
      if ((isRideExist.driver as Types.ObjectId).toString() !== userId) {
        throw new AppError(
          
          400,
          `You are not assign to this ride`
        );
      }
    }

    // Set ride status and record timestamp (e.g., pickedUpAt, inTransitAt, completedAt) based on the new status
    switch (newStatus) {
      case RideStatus.PICKED_UP:
        updateRideData = {
          rideStatus: newStatus,
          pickedupAt: nowInDhaka,
        };
        break;
      case RideStatus.IN_TRANSIT:
        updateRideData = {
          rideStatus: newStatus,
          inTransitAt: nowInDhaka,
        };
        break;
      case RideStatus.COMPLETED:
        updateRideData = {
          rideStatus: newStatus,
          completedAt: nowInDhaka,
        };
        // driver,driverStatus ,earnings
        //On COMPLETED, update driver’s earnings (currently overwrites earnings).
        await Driver.findOneAndUpdate(
          { driver: userId },
          { earnings: isRideExist?.fare },
          { session }
        );
        break;
      default:
        break;
    }

    /*
    imagine ride
     IRide {,rider,driver?,pickupLoc,destLoc,distance ,fare,rideStatus,requestedAt,cancelledAt,
     rejectedAt,acceptedAt,completedAt,pickedupAt,inTransitAt }
      */
    //. Update the ride document in the database.
    const rideStatusUpdate = await Ride.findByIdAndUpdate(
      rideId,
      updateRideData,
      { new: true, runValidators: true, session }
    );

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
    throw new AppError(
      401,
      "You are not authorized for this action"
    );
  }

  const queryBuilder = new QueryBuilder(
    Ride.find({
      $and: [
        {
          $or: [{ rider: userId }, { driver: userId }],
        },
        {
          rideStatus: {
            $nin: ["accepted", "requested", "picked_up", "in_transit"],
          },
        },
      ],
    }),
    query
  );

  //   Apply filters, search, sort, fields, and pagination using the QueryBuilder methods
  const rides = queryBuilder
    .search(rideSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate()
    .populate("rider", "-password -auths")
    .populate("driver", "-password -auths");

  //  Execute the query and get the data and metadata
  const [data, meta] = await Promise.all([
    rides.build().select("-password -auths"),
    queryBuilder.getMeta(),
  ]);
  return { data, meta };
};

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
