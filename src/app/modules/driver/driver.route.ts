import { Router } from "express";
import { DriverController } from "./driver.controller";
 
 

const router = Router();
router.post("/create", DriverController.createDriver);
router.patch("/approve/:id", DriverController.setApproveDriver);


export const driverRoutes = router;
