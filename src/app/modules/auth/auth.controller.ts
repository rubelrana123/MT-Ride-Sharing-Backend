/* eslint-disable @typescript-eslint/no-explicit-any */
import {  NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse";

import { createUserToken } from "../../utils/userToken";
import { setAuthCookie } from "../../utils/setCookies";
import AppError from "../../errorHelpers/appError";
import passport from "passport";



const credentialsLogin = catchAsync(async (req: Request, res: Response, next : NextFunction ) => {
       passport.authenticate("local", async (err: any, user: any, info: any) => {
        if (err) {
            return next(err);    
        }
        if (!user) { 
            return next(new AppError(401,info.message))
            
        }

    const userTokens =   createUserToken(user);
      const userObject = user.toObject();
       delete userObject.password;
      setAuthCookie(res,userTokens)
        sendResponse(res, {
        success : true,
        statusCode : 200,
        message : "User login successfully",
        // data : loginInfo,  
        data : {
            accessToken : userTokens.accessToken,
            refreshToken : userTokens.refreshToken,
            user : userObject
        }
    

     })
    })(req, res,next)
    // const loginInfo = await AuthServices.credentialsLogin(req.body)
    //   const userTokens =   createUserToken(user);
  
    // setAuthCookie(res,userTokens)
    // sendResponse(res, {
    //     success: true,
    //     statusCode: 200,
    //     message: "User Logged In Successfully",
    //     data: loginInfo,
    // })
})

export const authControllers = {
    credentialsLogin
}