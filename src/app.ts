import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import { router } from "./app/routes";
import "./app/config/passport";
import expressSession from "express-session";
import passport from "passport";
import { notFoundError } from "./app/middlewares/notFound";
import { globalErrorHandler } from "./app/middlewares/globalError";
import { envVars } from "./app/config/env";

const app: Application = express();
app.use(cors({
  origin:"http://localhost:5173", // your frontend
  credentials: true, // must be true if using cookies or sessions
}));

app.use(cookieParser());
app.use(express.json());

// ✅ Then session & passport
app.use(expressSession({
  secret: envVars.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// app.use(expressSession({
//   secret: envVars.EXPRESS_SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     httpOnly: true,
//     secure: false, // true if HTTPS
//     sameSite: "lax", // or "none" if cross-site and using HTTPS
//   }
// }));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/v1/", router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to myTrip ride sharing System Backend",
  });
});

app.use(globalErrorHandler);
app.use(notFoundError);

export default app;
