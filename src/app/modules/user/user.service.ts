import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/appError";
import { QueryBuilder } from "../../utils/queryBuilder";
import { userSearchableFields } from "./user.constants";
import { IAuthProvider,  IUser, UserRole } from "./user.interface";
import { User } from "./user.model";
import bcrypt from "bcryptjs";
import { Availability, DriverStatus } from "../driver/driver.interface";
import mongoose from "mongoose";
import { envVars } from "../../config/env";
import { Driver } from "../driver/driver.model";


const createUser = async (payload: Partial<IUser>) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { name, email, password, role, licenseNumber, vehicleInfo } = payload;
    console.log(payload,"payload create user");
    const isUserExist = await User.findOne({ email });

    //   Check if user already exists
    if (isUserExist) {
      throw new AppError(
        409,
        "User already exists with this email"
      );
    }

    //  password hashing
    const hashPassword = await bcrypt.hash(
      password as string,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    //   Create auth provider object with credentials
    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: email as string,
    };

    //   Create user with the provided details
    //   Note: The password is hashed before saving to the database
    const user = await User.create(
      [
        {
          name,
          email,
          role,
          password: hashPassword,
          auths: [authProvider],
        },
      ],
      { session }
    );
    console.log(user,"here create user")
    if (role === UserRole.DRIVER) {
      const driverData = {
        driver: user[0]?._id,
        vehicleInfo: {
          vehicleType: vehicleInfo?.vehicleType,
          model: vehicleInfo?.model,
          plate: vehicleInfo?.plate,
        },
        licenseNumber: licenseNumber,
        availability: Availability.ONLINE,
        driverStatus: DriverStatus.APPROVED,
      };
    console.log(driverData,"here create driverData")

     const res =  await Driver.create([driverData], { session });
     console.log(res,"driver res")
    }

    await session.commitTransaction();
    session.endSession();

    return user[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
// export const createUser = async (payload: Partial<IUser>) => {
//   const { email, password, ...rest } = payload;
//   const isUserExist = await User.findOne({ email });
//   if (isUserExist) {
//     throw new AppError(409, "User Already Exist");
//   }
//   const hashUserPassword = await bcryptjs.hash(password as string, 10);
//   const authProvider: IAuthProvider = {
//     provider: "credentials",
//     providerId: email as string,
//   };

//   const userPayload = {
//     email,
//     password: hashUserPassword,
//     auths: [authProvider],
//     ...rest,
//   };
//   const user = await User.create(userPayload);
//   return user;
// };


const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user._id.toString() !== userId) {
    throw new AppError(403, "You are not authorized to perform this action");
  }

  return user;
};
// Function to get all users with pagination, filtering, searching, and sorting
const getAllUsers = async (query: Record<string, string>) => {
  //   Create a QueryBuilder instance with the User model and the query
  const queryBuilder = new QueryBuilder(User.find({ isDeleted: { $ne: true }, UserRole: { $ne: "admin" } }), query);

  //http://localhost:5000/api/v1/user/all-users?isVerified=true&sort=1&fields=name,phone&limit=2&page=1
  const users = queryBuilder
    .search(userSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  //  Execute the query and get the data and metadata
  const [data, meta] = await Promise.all([
    users.build().select("-password -auths"),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};
// Function to get a single user by ID
//  only admin can access this endpoint
const getSingleUser = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return user;
};

// Function to update user information
// It uses the User model to find the user by ID and update the provided fields
const updateUserInfo = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role === UserRole.RIDER && decodedToken.role === UserRole.DRIVER) {
    if (decodedToken.userId !== userId) {
      throw new AppError(
        401,
        "You are not authorized for this action"
      );
    }
  }

  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  if (payload.email) {
    throw new AppError(400, "Email cannot be updated");
  }

  if (payload.role) {
    if (decodedToken.role === UserRole.RIDER && decodedToken.role === UserRole.DRIVER) {
      throw new AppError(
        401,
        "You are not authorized for this action"
      );
    }

    const isSelf = isUserExist.email === decodedToken.email;
    const tryingToDowngradeSelf =
      payload.role === UserRole.RIDER || payload.role === UserRole.DRIVER;

    if (isSelf && decodedToken.role === UserRole.ADMIN && tryingToDowngradeSelf) {
      throw new AppError(
        403,
        "You cann't chang your own role"
      );
    }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === UserRole.RIDER && decodedToken.role === UserRole.DRIVER) {
      throw new AppError(
        401,
        "You are not authorized for this action"
      );
    }
  }


  if (isUserExist?.role === UserRole.DRIVER) {
    const driverData = {
      vehicleInfo: {
        vehicleType: payload?.vehicleInfo?.vehicleType,
        model: payload?.vehicleInfo?.model,
        plate: payload?.vehicleInfo?.plate,
      },
      licenseNumber: payload?.licenseNumber,
    };


   await Driver.findOneAndUpdate( { driver: userId }, driverData );
  }

  const updateUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return updateUser;
};


// const updateUserInfo = async (
//   userId: string,
//   payload: Partial<IUser>,
//   decodedToken: JwtPayload
// ) => {
//   if (
//     decodedToken.UserRole === UserRole.RIDER &&
//     decodedToken.role === UserRole.DRIVER
//   ) {
//     if (decodedToken.userId !== userId) {
//       throw new AppError(401, "You are not authorized for this action");
//     }
//   }

//   const isUserExist = await User.findById(userId);

//   if (!isUserExist) {
//     throw new AppError(404, "User not found");
//   }

//   if (payload.email) {
//     throw new AppError(400, "Email cannot be updated");
//   }
//   if (payload.password) {
//     throw new AppError(400, "password cannot be updated here");
//   }
//   if (payload.role) {
//     if (
//       decodedToken.role === UserRole.RIDER &&
//       decodedToken.role === UserRole.DRIVER
//     ) {
//       throw new AppError(401, "You are not authorized for this action");
//     }

//     const isSelf = isUserExist.email === decodedToken.email;
//     const tryingToDowngradeSelf =
//       payload.role === UserRole.RIDER || payload.role === UserRole.DRIVER;

//     if (
//       isSelf &&
//       decodedToken.role === UserRole.ADMIN &&
//       tryingToDowngradeSelf
//     ) {
//       throw new AppError(403, "You cann't chang your own role");
//     }
//   }

//   if (payload.isActive || payload.isDeleted || payload.isVerified) {
//     if (
//       decodedToken.role === UserRole.RIDER &&
//       decodedToken.User === UserRole.DRIVER
//     ) {
//       throw new AppError(401, "You are not authorized for this action");
//     }
//   }

//   const updateUser = await User.findByIdAndUpdate(userId, payload, {
//     new: true,
//     runValidators: true,
//   });

//   return updateUser;
// };

 
const updateUserStatus = async (
  userId: string,
  status: string,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role !== UserRole.ADMIN) {
    throw new AppError(
      401,
      "You are not authorized for this acton"
    );
  }

  const isUserExist = await User.findById(userId).select("-password");
  if (!isUserExist) {
    throw new AppError(404, "User not found");
  }

  const updateUser = await User.findByIdAndUpdate(
    userId,
    { isActive: status },
    {
      new: true,
      runValidators: true,
    }
  );

  return updateUser;
};
 export const deleteUser = async (userId: string) => {
  const isUserExist = await User.findOne({ _id: userId });
  if (!isUserExist) {
    throw new AppError(409, "User not Exist");
  }
  const deletedUser = await User.findByIdAndUpdate(
    { _id: userId },
    { isDeleted: true },
    { new: true }
  );
  return deletedUser;
};
export const UserServices = {
  createUser,
  getMe,
  getAllUsers,
  getSingleUser,
  updateUserInfo,
 updateUserStatus,
 deleteUser
  
};
