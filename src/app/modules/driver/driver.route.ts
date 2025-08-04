import { Router } from "express";
import { DriverController } from "./driver.controller";
 
 

const router = Router();
router.post("/create", DriverController.createDriver);

export const driverRoutes = router;
