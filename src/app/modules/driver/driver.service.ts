import { Types } from "mongoose";
import { IDriver } from "./driver.interface";
import { Driver } from "./driver.model";
import AppError from "../../errorHelpers/appError"; // If you’re using a custom error handler

export const createDriver = async (payload: Partial<IDriver>) => {
  const {
    user,
    licenseNo,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    isApproved,
    isOnline, 
    ...rest
  } = payload;

  // Check if a driver already exists for the given user or licenseNo
  const existingDriver = await Driver.findOne({
    $or: [
      { user: new Types.ObjectId(user) },
      { licenseNo },
    ],
  });

  if (existingDriver) {
    throw new AppError(400, "Driver with this user or license number already exists.");
  }

  const driverPayload = {
    user,
    licenseNo,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleColor,
    isApproved: isApproved ?? false,
    isOnline: isOnline ?? false,
    ...rest,
  };

  const driver = await Driver.create(driverPayload);
  return driver;
};

export const DriverServices = {
  createDriver,
};
