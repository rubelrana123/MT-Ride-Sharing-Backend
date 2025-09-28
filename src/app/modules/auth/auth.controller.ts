/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse";

import { createUserToken } from "../../utils/userToken";
import { setAuthCookie } from "../../utils/setCookies";
import AppError from "../../errorHelpers/appError";
import passport from "passport";
import { AuthServices } from "./auth.service";
import { JwtPayload } from "jsonwebtoken";
import { TNext, TRequest, TResponse } from "../../types/global";
import { envVars } from "../../config/env";

const credentialsLogin = catchAsync(
  async (req: TRequest, res: TResponse, next: TNext) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(new AppError(401, info.message));
      }
     
      const userTokens = createUserToken(user);
      const userObject = user.toObject();
      delete userObject.password;
      setAuthCookie(res, userTokens);
      sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User login successfully",
        // data : loginInfo,
        data: {
          accessToken: userTokens.accessToken,
          refreshToken: userTokens.refreshToken,
          user: userObject,
        },
      });
    })(req, res, next);
  }
);

const getNewAccessToken = catchAsync(async (req: TRequest, res: TResponse) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError(404, "refresh token not found");
  }
  const tokenInfo = await AuthServices.getNewAccessToken(
    refreshToken as string
  );
  setAuthCookie(res, tokenInfo);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "new access token retrived successfully",
    data: tokenInfo,
  });
});

// This function handles log out
const logout = catchAsync(
  async (req: TRequest, res: TResponse) => {
    res.clearCookie("accessToken", {
      httpOnly: true, // Safer from XSS
      secure: envVars.NODE_ENV === "production", // Only sends over HTTPS on production
      sameSite: "none",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true, // Safer from XSS
      secure: envVars.NODE_ENV === "production", // Only sends over HTTPS on production
      sameSite: "none",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User Logged Out Successfully",
      data: null,
    });
  }
);

// This function handles changing the user's password.
const resetPassword = catchAsync(
  async (req: TRequest, res: TResponse) => {
    const { oldPassword, newPassword } = req.body;
    const decodedToken = req.user as JwtPayload;

    await AuthServices.resetPassword(
      decodedToken.userId,
      oldPassword,
      newPassword
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Password changed successfully",
      data: null,
    });
  }
);
 
export const authControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
 
  resetPassword
};
