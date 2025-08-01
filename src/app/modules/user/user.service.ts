import AppError from "../../errorHelpers/appError";
import { IAuthProvider, IUser } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
export const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;
  const isUserExist =await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(409, "User Already Exist");
  }
  const hashUserPassword = await bcryptjs.hash(password as string, 10);
  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
  };

  const userPayload = {
    email,
    password: hashUserPassword,
    auths: [authProvider],
    ...rest,
  };
  const user = await User.create(userPayload);
  return user;
};

export const UserServices = {
  createUser,
};
