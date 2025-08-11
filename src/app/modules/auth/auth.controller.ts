/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse";

import { createUserToken } from "../../utils/userToken";
import { setAuthCookie } from "../../utils/setCookies";
import AppError from "../../errorHelpers/appError";
import passport from "passport";
import { AuthServices } from "./auth.service";
import { JwtPayload } from "jsonwebtoken";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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

const getNewAccessToken = catchAsync(async (req: Request, res: Response) => {
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

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User logout successfully",
    data: null,
  });
});

// This function handles changing the user's password.
const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const decodedToken = req.user as JwtPayload;

    await AuthServices.changePassword(
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

// This function handles resetting the user's password.
const resetPassword = catchAsync(async(req: Request, res: Response ) => {
   const decodedToken = req.user;
   const newPassword = req.body.newPassword;
   const oldPassword = req.body.oldPassword;

   await AuthServices.resetPassword(oldPassword, newPassword, decodedToken as JwtPayload)
     sendResponse(res, {
        success : true,
        statusCode : 200,
        message : "Reset password successfully",
        data :  null,  
     })

})
export const authControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  changePassword,
  resetPassword
};
