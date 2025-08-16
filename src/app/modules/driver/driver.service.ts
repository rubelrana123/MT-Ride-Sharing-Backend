 
import { Driver } from "./driver.model";
import AppError from "../../errorHelpers/appError"; 
import { IUser, UserRole } from "../user/user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../user/user.model";
import { QueryBuilder } from "../../utils/queryBuilder";
import { driverSearchFields } from "./driver.constant";
import { Availability, DriverStatus } from "./driver.interface";
import mongoose from "mongoose";

const applyForDriver = async (
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role !== UserRole.RIDER) {
    throw new AppError(
      401,
      "You are not authorized to apply for driver"
    );
  }

  const isUserExist = await User.findById(decodedToken.userId);

  // checking is user exist or not
  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  // checking authorized user or not
  if (isUserExist._id.toString() !== decodedToken.userId) {
    throw new AppError(
      401,
      "Youre not authorized to perform this action"
    );
  }

  // checking address provided or not
  if (!isUserExist.address) {
    throw new AppError(
      400,
      "Please update your address before applying as a driver."
    );
  }

  // checking user already submit a driver application
  const isApplicationExist = await Driver.findOne({
    driver: decodedToken.userId,
  });
  if (isApplicationExist) {
    throw new AppError(
      400,
      "You have already submitted a driver application"
    );
  }

  // checking user alreay are in driver role
  if (isUserExist.role === UserRole.DRIVER) {
    throw new AppError(
      400,
      "You have already registred as drive"
    );
  }

  // create new driver application
  const driver = await Driver.create({
    ...payload,
    driver: decodedToken.userId,
  });

  return driver;
};

const getAllDriverApplication = async (
  userId: string,
  query: Record<string, string>
) => {
  const isUserExist = await User.findById(userId);

  // checking is user exist or not
  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  // checking authorized user or not
  if (isUserExist._id.toString() !== userId) {
    throw new AppError(
      401,
      "Youre not authorized to perform this action"
    );
  }

  const queryBuilder = new QueryBuilder(Driver.find(), query);

  const driverApplication = queryBuilder
    .search(driverSearchFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    driverApplication.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getAllDriver = async (userId: string, query: Record<string, string>) => {
  const isUserExist = await User.findById(userId);

  // checking is user exist or not
  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  // checking authorized user or not
  if (isUserExist._id.toString() !== userId) {
    throw new AppError(
      401,
      "You're not authorized to perform this action"
    );
  }

  const queryBuilder = new QueryBuilder(Driver.find(), query);

  const driverApplication = queryBuilder
    .search(driverSearchFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    driverApplication.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};
// update driver application status by admin
const updateDriverApplicationStatus = async (
  applicationId: string,
  payload: string
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const isApplicationExist = await Driver.findById(applicationId);

    if (!isApplicationExist) {
      throw new AppError(404, "This Application not found");
    }

    if (isApplicationExist.driverStatus === DriverStatus.APPROVED) {
      throw new AppError(
        400,
        "This application already has been approved"
      );
    }

    const isUserExist = await User.findById(isApplicationExist.driver);

    if (!isUserExist) {
      throw new AppError(404, "User not found");
    }

    // update role on User collection
    await User.findByIdAndUpdate(
      isApplicationExist.driver,
      {
        role: UserRole.DRIVER,
      },
      { runValidators: true, session }
    );

    const updateApplication = await Driver.findByIdAndUpdate(
      applicationId,
      {
        driverStatus: payload,
      },
      { new: true, runValidators: true, session }
    );

    const driverData = {
      driver: updateApplication?.driver,
      vehicleInfo: {
        vehicleType: updateApplication?.vehicleInfo?.vehicleType,
        model: updateApplication?.vehicleInfo?.model,
        plate: updateApplication?.vehicleInfo?.plate,
      },
      licenseNumber: updateApplication?.licenseNumber,
      availability: updateApplication?.availability,
      driverStatus: updateApplication?.driverStatus,
    };

    const updateApplicationStatus = await Driver.create([driverData], {
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return updateApplicationStatus;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateDriverAvailityStatus = async (
  driverId: string,
  decodedToken: JwtPayload,
  availability: Availability
) => {
  const isDriverExist = await Driver.findById(driverId);

  // checking is driver exist or not
  if (!isDriverExist) {
    throw new AppError(
      403,
      "You are not registered as a driver. Please apply to become a driver first."
    );
  }

  // prevent unauthorized user
  if (isDriverExist.driver.toString() !== decodedToken.userId) {
    throw new AppError(
      401,
      "Youre not authorized to perform this action"
    );
  }

  if (isDriverExist.availability === availability) {
    throw new AppError(
      400,
      `Your availability status is already set to '${isDriverExist.availability}'.`
    );
  }

  const updateAvailability = await Driver.findByIdAndUpdate(
    driverId,
    { availability: availability },
    { new: true, runValidators: true }
  );

  return updateAvailability;
};
export const DriverServices = {
  applyForDriver,
  getAllDriverApplication,
  getAllDriver,
  updateDriverApplicationStatus,
  updateDriverAvailityStatus
};
