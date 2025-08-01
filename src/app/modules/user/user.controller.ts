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

export const  UserController  ={
    createUser
}