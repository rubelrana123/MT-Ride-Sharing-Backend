import AppError from "../../errorHelpers/appError";
import { RideStatus } from "../ride/ride.interface";
import { Ride } from "../ride/ride.model";
import { UserRole } from "../user/user.interface";
import { User } from "../user/user.model";

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



export const AnalyticsService = {
    adminDashboardStats
}