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
export const DriverController = {
    createDriver
}