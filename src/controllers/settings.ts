import { RequestHandler } from "express";
import prismaClient from "@prismaclient/client";
import generateDataTransferObject from "@utils/generateDto";
import { tPushTokenSchema, tSettingsSchema } from "@validators/settings";
import { isEmpty } from "lodash";
import { captureException } from "@sentry/node";


export const updateSettings:RequestHandler = async(req, res)=>{

    const user_id = req.headers.user_id as string

    tSettingsSchema.parseAsync(req.body).then((newSettings)=>{
        prismaClient.userSettings.update({
            where: {
                user_id
            },
            data: newSettings
        }).then(()=>{
            res.status(200).send(generateDataTransferObject(null, "User settings updated successfully", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured updating the user settings", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "An error occured", "error"))
    })

    
}

export const getSettings:RequestHandler = async(req, res) =>{
    const user_id = req.headers.user_id  as string 

    prismaClient.userSettings.findUnique({
        where: {
            user_id
        }
    }).then((settings)=>{
        res.status(200).send(generateDataTransferObject(settings, "User settings fetched successfully", "success"))
    }).catch((e)=>{
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching the user settings", "error"))
        captureException(e)
    })
}


export const addPushToken: RequestHandler = async(req, res) => {
    const user_id = req.headers.user_id as string

   tPushTokenSchema.required({
    token: true
   }).parseAsync(req.body).then(async ({token})=>{
    // there can only be one active push token at a time
        await prismaClient.userSettings.findFirst({
            where: {
                user_id
            }
        }).then(async (settings)=>{
            if (isEmpty(settings)) return res.status(400).send(generateDataTransferObject(null, "User settings not found", "error"))
            await prismaClient.pushToken.upsert({
                where: {
                    user_settings_id: settings?.id
                },
                create: {
                    token,
                    user_settings_id: settings?.id
                },
                update: {
                    token
                }
            }).then((token)=>{
                res.status(200).send(generateDataTransferObject(token, "Push token added successfully", "success"))
            }).catch((e)=>{
                res.status(500).send(generateDataTransferObject(e, "An error occured adding the push token", "error"))
                captureException(e)
            })
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured fetching the user settings", "error"))
            captureException(e)
        })
        
   }).catch((e)=>{
    res.status(400).send(generateDataTransferObject(e, "Invalid data", "error"))
   })

    
}
