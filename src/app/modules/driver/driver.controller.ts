 
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespnse"
import { DriverServices } from "./driver.service";
import { TRequest, TResponse } from "../../types/global";
import { JwtPayload } from "jsonwebtoken";
 

const applyForDriver = catchAsync( async (req: TRequest, res: TResponse ) => {
    const decodedToken =  req.user as JwtPayload;
    const driver = await DriverServices.applyForDriver(req.body, decodedToken);

    sendResponse(res, {
        statusCode:200,
        success: true,
        message: "Your application was successfully sent",
        data: driver
    })
});


const getAllDriverApplication = catchAsync( async (req: TRequest, res: TResponse ) => {
    const decodedToken =  req.user as JwtPayload;
    const query = req.query as Record<string, string>
    const result = await DriverServices.getAllDriverApplication(decodedToken.userId, query);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All Driver Application has been retrive successfully",
        data: result.data,
        meta: result.meta
    })
})

const getAllDriver = catchAsync( async (req: TRequest, res: TResponse) => {
    const decodedToken =  req.user as JwtPayload;
    const query = req.query as Record<string, string>


    const result = await DriverServices.getAllDriver(decodedToken.userId, query);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All Driver has been retrive successfully",
        data: result.data,
        meta: result.meta
    })
})

const updateDriverApplicationStatus = catchAsync( async (req: TRequest, res: TResponse) => {
    const { driverStatus } = req.body;
    const { applicationId } = req.params

    const updateDriver = await DriverServices.updateDriverApplicationStatus(applicationId, driverStatus);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Driver application has been approved. Please Login again to use all feature of driver role",
        data: updateDriver
    })
});

const updateDriverAvailityStatus = catchAsync( async (req: TRequest, res: TResponse) => {
    const { availability } = req.body;
    const { driverId } = req.params;
    const decodedToken = req.user as JwtPayload;

    const updateDriver = await DriverServices.updateDriverAvailityStatus(driverId, decodedToken, availability);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Driver Availability status has been updated successfully",
        data: updateDriver
    })
});
export const DriverController = {
    applyForDriver,
    getAllDriverApplication,
    getAllDriver,
    updateDriverApplicationStatus,
    updateDriverAvailityStatus
     
}