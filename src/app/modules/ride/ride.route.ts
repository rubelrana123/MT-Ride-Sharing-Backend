import { Router } from "express";
import { RideController } from "./ride.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

/* 

Follow RESTful route conventions:
POST /rides/request, PATCH /rides/:id/status, GET /rides/me
PATCH /drivers/approve/:id, PATCH /users/block/:id*/
const router = Router();
router.post("/request", checkAuth(UserRole.RIDER), RideController.requestRide);
router.get("/",checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),RideController.getAllRides);
router.get(  "/me",checkAuth(...Object.values(UserRole)),RideController.getMyRide);
router.patch("/:rideId/status",checkAuth(UserRole.DRIVER), RideController.updateRideStatus);
router.patch("/:rideId/cancel",checkAuth(UserRole.RIDER), RideController.updateRideStatus);

export const rideRoutes = router;
