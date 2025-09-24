import { Router } from "express";
import { DriverController } from "./driver.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { driverZodSchema, updateDriveAvailityStatusZodSchema, updateDriverApplicationStatusSchema } from "./driver.validation";
 
 
 

const router = Router();
router.post("/apply-driver",checkAuth(UserRole.RIDER),validateRequest(driverZodSchema),
  DriverController.applyForDriver
);
router.get(
  "/driver-application",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  DriverController.getAllDriverApplication
);
router.get(
  "/driver",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  DriverController.getAllDriver
);
router.patch(
  "/driver-application/:applicationId/status",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateDriverApplicationStatusSchema),
  DriverController.updateDriverApplicationStatus
);
router.patch(
  "/:driverId/availability",
  checkAuth(UserRole.DRIVER),
  validateRequest(updateDriveAvailityStatusZodSchema),
  DriverController.updateDriverAvailityStatus
);
router.get(
  "/me",
  checkAuth(UserRole.DRIVER),
  DriverController.getDriverProfile
);
router.get(
  "/incoming-request",
  checkAuth(UserRole.DRIVER),
  DriverController.getIncomingRideRequest
);
export const driverRoutes = router;
