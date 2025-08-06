import { JwtPayload } from "jsonwebtoken"
import { envVars } from "../config/env"
import AppError from "../errorHelpers/appError"
import { IUser } from "../modules/user/user.interface"
import { User } from "../modules/user/user.model"
import { generateToken, verifyToken } from "./jwt"

export const createUserToken = (user : Partial<IUser>) => {
       const jwtPayload ={
            userId : user._id,
            email : user.email,
            role : user.role
        }
        const accessToken =generateToken (jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)
        // const accessToken = jwt.sign(jwtPayload, "secret",{
        //     expiresIn : "1d"
        // })
        const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)
      

         
        return{
            accessToken,
            refreshToken
        }
}


export const createNewAccessTokenWithRefreshToken = async (refreshToken : string) => {
     const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET
  ) as JwtPayload;

  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

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

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );
  return accessToken;

}
