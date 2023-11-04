import stripeClient from "@utils/stripe";
import { RequestHandler } from "express";



export const parseEvent: RequestHandler = (req, res, next)=> {

    if(process.env.APP_ENV === "dev"){
        // console.log(req.body)
        next();
    }else {
        const sig = req.headers["stripe-signature"] as string;

        let event;

        try {
            event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
            req.body = event;
            next();
        } catch (err: unknown) {
            res.status(400).send(`Webhook Error: ${(err as {message: string}).message}`);

        }
    }


    
}