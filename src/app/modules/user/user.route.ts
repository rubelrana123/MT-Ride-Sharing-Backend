import { Router } from "express";
import { UserController } from "./user.controller";

const router = Router();
router.post("/create", UserController.createUser);
router.patch("/block/:id", UserController.setBlockedUser);


export const userRoutes = router;
