import { Router } from "express";
import { RideController } from "./ride.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const router = Router();
router.post("/request", checkAuth(UserRole.RIDER), RideController.requestRide);
router.get("/",checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),RideController.getAllRides);
router.get("/history", checkAuth(UserRole.RIDER), RideController.viewRideHistroy);
router.get("/:rideId/details", checkAuth(UserRole.ADMIN,UserRole.SUPER_ADMIN, UserRole.RIDER, UserRole.DRIVER), RideController.getRideDetails)
router.get("/earnings", checkAuth(UserRole.DRIVER), RideController.viewEarningHistory)
router.patch("/:rideId/status",checkAuth(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN), RideController.updateRideStatus);
router.patch("/:rideId/cancel", checkAuth(UserRole.RIDER), RideController.cancelRide);
router.get("/myActiveRide", checkAuth(UserRole.RIDER), RideController.getRiderActiveRide)
export const rideRoutes = router;
