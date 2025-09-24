import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
 
import { UserRole } from "../user/user.interface";
import { AnalyticController } from "./analytics.controller";

 

const router = Router();



router.get("/stats", checkAuth(UserRole.ADMIN), AnalyticController.adminDashboardStats)
router.get("/driverStats", checkAuth(UserRole.DRIVER), AnalyticController.driverDashboardStats)

export const AnalyticsRoutes = router;