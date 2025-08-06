import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalError";
import "./app/config/passport";
import  expressSession  from "express-session";
import passport from "passport";
import { notFoundError } from "./app/middlewares/notFound";

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(expressSession({
    secret : "Your Secret",
    resave : false,
    saveUninitialized : false

}))
app.use(cors())
app.use(passport.initialize());
app.use(passport.session())
app.use("/api/v1/", router)
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to myTrip ride sharing System Backend"
    })
});
app.use(globalErrorHandler);
app.use(notFoundError);
export default app;