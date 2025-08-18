import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { rideRoutes } from "../modules/ride/ride.route";
import { driverRoutes } from "../modules/driver/driver.route";
import { AnalyticsRoutes } from "../modules/analytics/analytics.route";

export const router = Router();
const moduleRoutes = [{
    path : "/users",
    route : userRoutes
   },
   {
    path : "/rides",
    route : rideRoutes
   },
   {
    path : "/auth",
    route : AuthRoutes
   },
 {
    path : "/drivers",
    route : driverRoutes
   },
     {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
];
moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})
