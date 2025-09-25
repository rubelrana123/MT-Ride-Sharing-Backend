 import { sendResponse } from "../../utils/sendRespnse"
import { catchAsync } from "../../utils/catchAsync"
import { UserServices } from "./user.service"
import { TRequest, TResponse } from "../../types/global"
import { JwtPayload } from "jsonwebtoken"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Function to create a new user
const createUser = catchAsync(
  async (req: TRequest, res: TResponse) => {
    // logic for creating a user goes here
    const payload = req.body;
    const user = await UserServices.createUser(payload);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: `${user?.role === "RIDER" ? "Rider" : "Driver"} account has been created successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user?.picture,
        phoneNumber: user?.phone,
        address: user.address,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        isDeleted: user.isDeleted,
      },
    });
  }
);

// const createUser = catchAsync(async (req: TRequest, res: TResponse, next: TNext) => {
//     const user = await UserServices.createUser(req.body)
//     sendResponse(res, {
//         success: true,
//         statusCode: 200,
//         message: "User Created Successfully",
//         data: user,
//     })
// })

const getMe = catchAsync(
  async (req: TRequest, res: TResponse) => {
    // logic for getting a single user goes here
    const decodedToken = req.user as JwtPayload

    const user = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    });
  }
);
// Function to get all users

const getAllUsers = catchAsync(
  async (req: TRequest, res: TResponse) => {
    //  logic for getting all users goes here
    const query = req.query;
    const users = await UserServices.getAllUsers(
      query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Users retrieved successfully",
      data: users.data,
      meta: users.meta,
    });
  }
);

// only admin can access this endpoint
const getSingleUser = catchAsync(
  async (req: TRequest, res: TResponse) => {
   
    const { userId } = req.params;

    const user = await UserServices.getSingleUser(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  }
);
//block a user by admin / super admin
const deleteUser = catchAsync(async (req: TRequest, res: TResponse) => {
    const userId = req.params.userId;
    const deletedUser = await UserServices.deleteUser(userId)
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "User delete Successfully",
        data: deletedUser,
    })
});

// Function to update user information
const updateUserInfo = catchAsync(
  async (req: TRequest, res: TResponse ) => {
    // logic for updating user info goes here
    const { userId } = req.params;
    const payload = req.body;
    const decodedToken = req.user as JwtPayload


    const updatedUser = await UserServices.updateUserInfo(userId, payload, decodedToken);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User has been updated successfully",
      data: updatedUser,
    });
  }
);


// only admin can access this endpoint
const updateUserStatus = catchAsync(
  async (req: TRequest, res: TResponse) => {
    const payload = req.body;
    const decodedToken = req.user as JwtPayload;
    console.log(decodedToken, "decodedToken", payload, "payload", req.params);
    const user = await UserServices.updateUserStatus(
      payload.userId,
      payload.isActive,
      decodedToken
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Rider status updated successfully",
      data: user,
    });
  }
);
export const  UserController  ={
    createUser,
    getMe,
    getAllUsers,
    getSingleUser,
    deleteUser,
    updateUserInfo,
    updateUserStatus
}