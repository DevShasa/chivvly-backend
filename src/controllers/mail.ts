import generateDataTransferObject from "@utils/generateDto";
import { SendMailWithContent } from "@utils/postmark/actions";
import { tMailWithContent } from "@validators/mail";
import { RequestHandler } from "express";
import { captureException } from "@sentry/node";


export const mailWithContent: RequestHandler = async (req, res) => {
    await tMailWithContent.parseAsync(req.body).then((mail)=>{
        SendMailWithContent(mail.to, mail.subject, mail.html, mail.text).then(()=>{
            res.status(200).send(generateDataTransferObject(null, "Mail sent successfully", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured sending the mail", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })
}

export const mailWithTemplate: RequestHandler = async (req, res) => {
    await tMailWithContent.parseAsync(req.body).then((mail)=>{
        SendMailWithContent(mail.to, mail.subject, mail.html, mail.text).then(()=>{
            res.status(200).send(generateDataTransferObject(null, "Mail sent successfully", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured sending the mail", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })
}