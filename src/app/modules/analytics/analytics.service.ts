import { Types } from "mongoose";
import AppError from "../../errorHelpers/appError";
import { RideStatus } from "../ride/ride.interface";
import { Ride } from "../ride/ride.model";
import { UserRole } from "../user/user.interface";
import { User } from "../user/user.model";
import { startOfDay, subDays } from "date-fns";
import { Driver } from "../driver/driver.model";

const now = new Date();
const ninetyDaysAgo = startOfDay(subDays(now, 90));


const adminDashboardStats = async (userId: string) => {
    const isUserExist = await User.findById(userId);


    if (!isUserExist) {
        throw new AppError(404, "User not found")
    }

    const totalUsers = await User.countDocuments();
    const totalRiders = await User.countDocuments( { role: UserRole.RIDER } );
    const totalDrivers = await User.countDocuments( { role: UserRole.DRIVER } );


    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments( { rideStatus: RideStatus.COMPLETED } );
    const cancelledRides = await Ride.countDocuments( { rideStatus: RideStatus.CANCELLED }  );


    const earningsAgg = await Ride.aggregate([
        { $match:  { rideStatus: RideStatus.COMPLETED } },
        { $group: { _id: null, totalFare: {         $sum: {
          $toDouble: {
            $replaceAll: { input: "$fare", find: " BDT", replacement: "" }
          }
        } } } }
    ])
    const totalEarnings = earningsAgg[0]?.totalFare ?? 0;

    return {
        totalUsers: {
            totalUsers,
            totalAdmins: totalUsers - (totalRiders + totalDrivers),
            totalRiders, totalDrivers
        },
        totalRides, completedRides, cancelledRides,
        totalEarnings
    }
}

const driverDashboardStats = async (userId: string) => {
  const isUserExist = await User.findById(userId);
  // checking user perm
  if (!isUserExist) {
    throw new AppError(401, "You are not auhorized");
  }

  const driverProfile = await Driver.findOne({ driver: userId });

  if (!driverProfile) {
    throw new AppError(404, "Driver Profile Not found");
  }

  const totalCompletedRides = await Ride.countDocuments({
    driver: userId,
    rideStatus: RideStatus.COMPLETED,
  });

const driverDailyEarnings = await Ride.aggregate([
  {
    $match: {
      rideStatus: RideStatus.COMPLETED,
      updatedAt: { $gte: ninetyDaysAgo },
      driver: new Types.ObjectId(userId),
    },
  },
  // convert fare string "72 BDT" → 72
  {
    $addFields: {
      fareNumeric: {
        $toDouble: {
          $arrayElemAt: [
            { $split: ["$fare", " "] }, // split "72 BDT" → ["72", "BDT"]
            0,                         // take the first part
          ],
        },
      },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
      totalDriverEarnings: { $sum: "$fareNumeric" },
    },
  },
  {
    $sort: { _id: 1 },
  },
  {
    $project: {
      _id: 0,
      date: "$_id",
      totalDriverEarnings: 1,
    },
  },
]);

  return {
    totalEarnings: driverProfile.earnings,
    totalCompletedRides,
    driverDailyEarnings,
  };
};

export const AnalyticsService = {
    adminDashboardStats,
    driverDashboardStats
}