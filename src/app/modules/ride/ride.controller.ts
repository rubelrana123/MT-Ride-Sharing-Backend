import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse"
import { RideServices } from "./ride.service"
import { JwtPayload } from "jsonwebtoken";
import {   TRequest, TResponse } from "../../types/global";

const requestRide = catchAsync(async (req: Request, res: Response) => {
    const rideData = req.body;
    const decodedToken = req.user as JwtPayload
    const result = await RideServices.requestRide(rideData, decodedToken.userId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Your ride request successfully",
      data: result,
    });
  }
);

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
    const rideId = req.params.rideId;
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
  async (req: TRequest, res: TResponse ) => {
    const query = req.query as Record<string, string>;
    const decodedToken = req.user as JwtPayload
    const result = await RideServices.getAllRides(decodedToken.userId, query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All Ride has been retrive successfully",
      data: result.data,
      meta: result.meta
    });
  }
);

export const RideController = {
    requestRide,
    getAllRides,
    getMyRide,
    updateRideStatus
}