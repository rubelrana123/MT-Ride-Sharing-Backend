import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/appError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../modules/user/user.model";
 

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      if (!accessToken) {
        throw new AppError(403, "No token recieved");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;
      //  check user validation
      const isUserExist = await User.findOne({ email: verifiedToken.email });
      /* 
{
verifiedToken give like this format
  "userId": "68766dd1fdb8460af07078b3",
  "email": "super@gmail.com",
  "role": "SUPER_ADMIN",
  "iat": 1752915297,
  "exp": 1753001697
}
    isVerified: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
*/
      if (!isUserExist) {
        throw new AppError(400, "User does not exist");
      }
      if (
        isUserExist.isBlocked === true 
      ) {
        throw new AppError(400, `User is  blocked`);
      }
      if (isUserExist.isDeleted) {
        throw new AppError(400, "User is deleted");
      }

      // end validation check user
      console.log("v_token", verifiedToken);
      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(403, `you are not permited to view this route !!`);
      }
      console.log("v_token next", verifiedToken);
      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
