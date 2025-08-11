import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse"
import { RideServices } from "./ride.service"
import { JwtPayload } from "jsonwebtoken";

const createRide = catchAsync(async (req: Request, res: Response) => {
    const ride = await RideServices.createRide(req.body)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Ride Created Successfully",
        data: ride,
    })
});
const getMyRide = catchAsync(async (req: Request, res: Response) => {
      const verifiedToken = req.user;
      console.log("verifiedToken", verifiedToken)
    const ride = await RideServices.getMyRide((verifiedToken as JwtPayload).userId)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Ride Created Successfully",
        data: ride,
    })
});
const  updateRideStatus = catchAsync(async (req: Request, res: Response) => {
    const rideId = req.params.id;
    const status = req.body.status;
    const updateStatus = await RideServices.updateRideStatus(rideId , status)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Ride status change Successfully",
        data: updateStatus
    })
});

const getAllRides = catchAsync(
  async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
    const decodedToken = req.user as JwtPayload
    const result = await RideServices.getAllRides(decodedToken.userId, query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All Ride has been retrive successfully",
      data: result.data,
      meta: result.meta
    })
  }
);
export const RideController = {
    createRide,
    getAllRides,
    getMyRide,
    updateRideStatus
}