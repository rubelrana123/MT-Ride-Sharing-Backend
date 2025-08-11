import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/appError";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userToken";
import { User } from "../user/user.model";
import bcrypt from "bcryptjs";
const getNewAccessToken = async (refreshToken: string) => {
const newAccessToken =await createNewAccessTokenWithRefreshToken(refreshToken as string)
  return { accessToken : newAccessToken };
};
// This function handles changing the user's password.
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  if (!isUserExist.password) {
    throw new AppError(
      400,
      "You haven't set a password yet. Please set a password first."
    );
  }

  if (isUserExist._id.toString() !== userId) {
    throw new AppError(
      401,
      "You are not authorized to change this password"
    );
  }

  const isOldPasswordMatch = await bcrypt.compare(
    oldPassword,
    isUserExist.password as string
  );

  if (!isOldPasswordMatch) {
    throw new AppError(403, "Old password is incorrect");
  }

  isUserExist.password = await bcrypt.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  await isUserExist.save();

  return true;
};

// This function handles resetting the user's password.
const resetPassword = async (oldPassword : string, newPassword : string, decodedToken : JwtPayload) => {

  const isUserExist = await User.findById(decodedToken.userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }
  const isOldPasswordMatch =  await bcrypt.compare(
    oldPassword as string,
    isUserExist.password as string
  );

  if (!isOldPasswordMatch) {
    throw new AppError(401, "Old password does not match")
    
  }
  isUserExist.password = await bcrypt.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND));
  isUserExist.save()
 
  
};
export const AuthServices = {
    getNewAccessToken,
    changePassword,
    resetPassword
}