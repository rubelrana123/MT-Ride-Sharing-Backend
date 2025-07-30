import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";

const app = express() 
app.use(cookieParser())
app.use(express.json())
app.use(cors())

app.get("/api/v1", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to myTrip ride sharing System Backend"
    })
})



export default app;