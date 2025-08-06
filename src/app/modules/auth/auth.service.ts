import { createNewAccessTokenWithRefreshToken } from "../../utils/userToken";

const getNewAccessToken = async (refreshToken: string) => {
const newAccessToken =await createNewAccessTokenWithRefreshToken(refreshToken as string)
  return { accessToken : newAccessToken };
};
export const AuthServices = {
    getNewAccessToken
}