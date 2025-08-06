/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse";

import { createUserToken } from "../../utils/userToken";
import { setAuthCookie } from "../../utils/setCookies";
import AppError from "../../errorHelpers/appError";
import passport from "passport";
import { AuthServices } from "./auth.service";

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

export const authControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
};
