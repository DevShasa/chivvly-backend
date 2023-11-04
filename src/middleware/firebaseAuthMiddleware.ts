import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase/firebaseConfig";
import createHttpError from "http-errors";

export const withAuth = async(req:Request, res:Response, next:NextFunction)=>{
    const app_env = process.env.APP_ENV as string
    /**
     * this header and what gets passed in can be changed to any value that will 
     * be used to determine the user type
     */
    let xUser = req.headers["x-user"] as string;
    xUser = xUser === "CUSTOMER" ? "CUSTOMER" : xUser === "HOST" ? "HOST" : "invalid"

    /**
     * error not as descriptive for security reasons
     */
    // TODO: reformat error, this seems to reveal more info about the app than is necessary
    if (xUser === "invalid") return next(createHttpError(401, "Unauthorized"));
    if(req.headers.authorization){
        try {
            const decodedtoken = await auth?.[app_env === "testing" ? "test" : xUser === "CUSTOMER" ? "customer" : "host"]?.verifyIdToken((req.headers.authorization as string)?.split(" ")?.[1] as string)
            req.headers.uid = decodedtoken?.uid
            return  next()
            
        } catch (error) { 
            return res.status(401).send("Unauthorized")
        }
    }else{
        return res.status(401).send("Unauthorized")
    }
}