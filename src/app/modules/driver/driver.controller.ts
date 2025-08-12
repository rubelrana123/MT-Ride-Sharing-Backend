import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse"
import { DriverServices } from "./driver.service";
 

const createDriver = catchAsync(async (req: Request, res: Response) => {
    const driver = await DriverServices.createDriver(req.body)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Driver Created Successfully",
        data: driver,
    })
});

const  setApproveDriver = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const approveDriver = await DriverServices.setApproveDriver(userId)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Driver approved Successfully",
        data: approveDriver,
    })
})
export const DriverController = {
    createDriver,
    setApproveDriver
}