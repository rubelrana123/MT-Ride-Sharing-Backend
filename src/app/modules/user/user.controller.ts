import { NextFunction, Request, Response } from "express"
import { sendResponse } from "../../utils/sendRespnse"
import { catchAsync } from "../../utils/catchAsync"
import { UserServices } from "./user.service"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User Created Successfully",
        data: user,
    })
})
const setBlockedUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const blockedUser = await UserServices.setBlockedUser(userId)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User blocked Successfully",
        data: blockedUser,
    })
})
export const  UserController  ={
    createUser,
    setBlockedUser
}