import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { router } from "./app/routes";

const app = express() 
app.use(cookieParser())
app.use(express.json())
app.use(cors())
app.use("/api/v1/", router)
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to myTrip ride sharing System Backend"
    })
});

export default app;