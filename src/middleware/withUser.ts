import { User, UserType } from "@prisma/client";
import prismaClient from "@prismaclient/client";
import { captureException } from "@sentry/node";
import { timeSleep } from "@utils/functions";
import generateDataTransferObject from "@utils/generateDto";
import { RequestHandler } from "express";
import { isNull } from "lodash";

class UserFindDebouncer {
    check_counts: number 

    constructor(){
        this.check_counts = 0
    }

    async check(uid: string): Promise<User>{
        this.check_counts += 1

        try {
            const user = await prismaClient.user.findUnique({
                where: {
                    uid
                }
            })
    
            if(isNull(user)){
                if(this.check_counts <= 10) {
                    await timeSleep(2000)
                    return await this.check(uid)
                }
                else{
                    return Promise.reject("User not found")
                }
            }
            return user

        } 
        catch (e)
        {

            captureException(e, (context)=>context.setTag("where", "UserFindDebouncer.check")
            .setTag("uid", uid)
            .setTag("check_counts", this.check_counts.toString())
            .setExtra("error", e)
            )
            return Promise.reject({
                message: "Unknown error occured",
                error: e
            })
        }   
    }
}



export const withUser: RequestHandler = async (req, res, next) => {
    const db = new UserFindDebouncer()
    const uid = req.headers.uid as string
    await db.check(uid).then((user)=>{
        req.headers.user_id = user.id
        req.headers.user_type = user.user_type
        req.headers.role = user.is_admin ? "admin" : "user" // this will distinguish regular users from admins
        req.headers.email = user.email
        req.headers.market_id = user.market_id ?? undefined
        req.headers.sub_market_id = user.sub_market_id ?? undefined
        next()
    }).catch((e)=>{
        res.status(401).send(generateDataTransferObject(e, "User does not exist", "error"))
    })
}


export const withAdmin: RequestHandler = async (req, res, next) => {
    const role = req.headers.role as string
    if(role === "admin"){
        next()
    }
    else{
        res.status(401).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))
    }
}

export type WithUserHeaders = {
    user_id: string,
    user_type: UserType,
    role: "admin" | "user",
    email: string
    uid: string
    market_id: string 
    sub_market_id: string
}