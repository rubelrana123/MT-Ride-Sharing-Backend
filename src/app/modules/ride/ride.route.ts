import { Router } from "express";
import { RideController } from "./ride.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
 
/* 

Follow RESTful route conventions:
POST /rides/request, PATCH /rides/:id/status, GET /rides/me
PATCH /drivers/approve/:id, PATCH /users/block/:id*/
const router = Router();
router.post("/request", RideController.createRide);
router.get("/me",
    checkAuth(...Object.values(UserRole)),
       RideController.getMyRide);
router.patch("/:id/status", RideController.updateRideStatus);
router.patch("/:id/cancel", RideController.updateRideStatus);



export const rideRoutes = router;
