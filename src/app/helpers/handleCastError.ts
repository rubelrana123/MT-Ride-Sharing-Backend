import mongoose from "mongoose";
import { TGenericErrorResponse } from "../interface/error.types";
 

  export const handleCastError = (err : mongoose.Error.CastError) : TGenericErrorResponse => {
    console.log(err)
    return {
      statusCode: 400,
      message: "invalid mongodb objectID , please provide a valid id",
    };
  };