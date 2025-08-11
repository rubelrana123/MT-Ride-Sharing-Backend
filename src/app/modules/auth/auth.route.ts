import { Router } from "express";
import { authControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { changePasswordZodSchema } from "./auth.validation";
import { UserRole } from "../user/user.interface";

const router = Router();
router.post("/login", authControllers.credentialsLogin);
router.post("/refresh-token", authControllers.getNewAccessToken);
router.post("/logout", authControllers.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(UserRole)),
  validateRequest(changePasswordZodSchema),
  authControllers.changePassword
);
router.post("/reset-password", checkAuth(...Object.values(UserRole)),  authControllers.resetPassword);
export const AuthRoutes = router;