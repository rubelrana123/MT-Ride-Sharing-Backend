import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "./user.interface";

const router = Router();
router.post(
  "/create",
  validateRequest(createUserZodSchema),
  UserController.createUser
);
router.get(
  "/all-users",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllUsers
);
router.get("/me", checkAuth(...Object.values(UserRole)), UserController.getMe);
router.get(
  "/:userId",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getSingleUser
);
router.patch(
  "/:userId",
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateUserZodSchema),
  UserController.updateUserInfo
);
 
router.delete(
  "/:userId",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.deleteUser
);
export const userRoutes = router; 
