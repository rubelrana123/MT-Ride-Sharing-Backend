import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse"
import { RideServices } from "./ride.service"

const createRide = catchAsync(async (req: Request, res: Response) => {
    const ride = await RideServices.createRide(req.body)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Ride Created Successfully",
        data: ride,
    })
});
export const RideController = {
    createRide
}