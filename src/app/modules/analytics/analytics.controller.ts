import { JwtPayload } from "jsonwebtoken";
import { TRequest, TResponse } from "../../types/global";
import { catchAsync } from "../../utils/catchAsync";
import { AnalyticsService } from "./analytics.service";
import { sendResponse } from "../../utils/sendRespnse";

 

const adminDashboardStats = catchAsync( async (req: TRequest, res: TResponse) => {
    const decodedToken = req.user as JwtPayload;

    const result = await AnalyticsService.adminDashboardStats(decodedToken.userId);



    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Dasboard Stats has been retrive successfully",
        data: result
    })
})




export const AnalyticController = {
    adminDashboardStats
}