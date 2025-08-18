import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
 
import { UserRole } from "../user/user.interface";
import { AnalyticController } from "./analytics.controller";

 

const router = Router();



router.get("/stats", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), AnalyticController.adminDashboardStats)



export const AnalyticsRoutes = router;