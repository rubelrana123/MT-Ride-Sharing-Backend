/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGenericErrorResponse } from "../interface/error.types"

 

 export  const handlerZodError = (err: any) : TGenericErrorResponse => {
    const errorSources : any = []

    err.issues.forEach((issue: any) => {
        errorSources.push({
            path: issue.path[issue.path.length - 1],
            message: issue.message
        })
    })

    return {
        statusCode: 422,
        message: "Zod Error",
        errorSources

    }
}