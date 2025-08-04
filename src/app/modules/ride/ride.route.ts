import { Router } from "express";
import { RideController } from "./ride.controller";
 

const router = Router();
router.post("/create", RideController.createRide);

export const rideRoutes = router;
