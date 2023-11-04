import { User, tPaymentStatus } from "@prisma/client";
import prismaClient from "@prismaclient/client";
import { constructFullName } from "@utils/functions";
import { captureException } from "@sentry/node";
import generateDataTransferObject from "@utils/generateDto";
import mpesa from "@utils/mpesa";
import mtn from "@utils/mtn";
import { createCustomer, stripeEventHandler } from "@utils/stripe/actions";
import { RequestHandler } from "express";
import { isEmpty, isNull } from "lodash";
import notifications from "src/notifications";
import Stripe from "stripe";
import { z } from "zod";
import dayjs from "dayjs";


/**
 * @name updatePayment
 * @description helper function for updating a payment
 * @param stripe_payment_id 
 * @param status 
 * @returns 
 */
const updatePayment = (stripe_payment_id: string, status: tPaymentStatus): Promise<boolean> => {
    return new Promise((res, rej)=>{
        prismaClient.payment.findFirst({
            where: {
                stripe_payment_id: stripe_payment_id
            },
            include: {
                user: true,
                Reservation: true
            }
        }).then(async (data)=>{
            if(isEmpty(data)) return rej(false)
            await prismaClient.payment.update({
                where: {
                    id: data.id
                },
                data: {
                    status: status
                }
            }).then(()=>{
                if(status === "SUCCEEDED"){
                    notifications.sendPaymentSuccessfulNotification({
                        template: 'payment-successful',
                        to: data.user.email,
                        subject: "Payment successful",
                        data: {
                            amount: data?.amount?.toFixed(2),
                            date: dayjs(data?.date_time)?.format("dddd, MM DD YYYY"),
                            user_name: data?.user?.email,
                            vehicle_id: data?.Reservation?.vehicle_id
                        }
                    })
                }
                res(true)
            }).catch((e)=>{
                captureException(e)
                rej(e)
            })
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
}


/**
 * @name paymentIntentHandler 
 * @description handlers payment intent events
 * @param Stripe.Event event - the stripe event object
 * @returns void
 */
const paymentIntentHandler = (event: Stripe.Event): Promise<boolean> => {
    const object = event.data as Stripe.PaymentIntent 
    const event_type = event.type
    return new Promise((res, rej)=>{
        switch (event_type){
            case "payment_intent.succeeded":
                //update a payment
                updatePayment(object.id, "SUCCEEDED").then(res).catch(rej)
                break;
            case "payment_intent.payment_failed":
                //update a payment
                updatePayment(object.id, "FAILED").then(res).catch(rej)
                break;
                /**
                 * @todo though, not currently required, we may need to extend what events can be handled here
                 */
            default:
                rej(false)
                break;
        }
    })
    
}


/**
 * @name updatePayoutMethod
 * @description helper function for updating a payout method
 * @param stripe_account_id
 * @param {boolean} verified
 * @returns Promise<boolean>
 */
const updatePayoutMethod = (stripe_account_id: string, verified: boolean): Promise<boolean> => {
    return new Promise((res, rej)=>{
        prismaClient.payoutMethod.findFirst({
            where: {
                connected_account_id: stripe_account_id
            }
        }).then(async (data)=>{
            if(isEmpty(data)) return rej(false)
            await prismaClient.payoutMethod.update({
                where: {
                    id: data.id
                },
                data: {
                    verified
                },
                include: {
                    user: true
                }
            }).then(()=>{
                res(true)
            }).catch((e)=>{
                captureException(e)
                rej(e)
            })
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
}

/**
 * @name accountActionHandler
 * @description handles account events
 * @param event Stripe.Event - the stripe event object
 * @returns Promise<boolean>
 */
const accountActionHandler = (event: Stripe.Event): Promise<boolean> => {
    const object = event.data as Stripe.Account
    const event_type = event.type
    return new Promise((res, rej)=>{
        switch (event_type){
            case "account.updated":
                //update the host's payment status
                updatePayoutMethod(object.id, object.charges_enabled).then(res).catch(rej)
                break;
                /**
                 * @todo thoughm not currently required, we may need to extend what events can be handled here
                 */
            default:
                rej(false)
        }
    })
}



// ------------------------------- Main Web hook request handler(stripe) -------------------------------
export const stripeWebhookHandler: RequestHandler = async (req, res) => {
    const event = req.body as Stripe.Event
    // return a 200 response to the webhook
    res.sendStatus(200)

    stripeEventHandler(event, ['payment_intent.succeeded', 'payment_intent.payment_failed'], paymentIntentHandler).
    eventHander(event, ['account.updated'], accountActionHandler)
    /**
     * @todo though, not currently required, other stripe events can be chained here
     */
}



// ------------------------------- Web hook request handler(Mpesa Express) -------------------------------

export const mpesaExpressWebhookRequestHandler: RequestHandler = async (req, res) => {
    res.sendStatus(200)
    // the mpesa client handles the request
    mpesa.expressPaymentRequestCallback(req.body)
}

export const mpesaPayoutWebhookRequestHandler: RequestHandler = async (req, res) => {
    res.sendStatus(200)
    // the mpesa client handles the request
    mpesa.payoutRequestCallback(req.body)
}

// ------------------------------- Web hook request handler(MTN MoMo) -------------------------------

export const mtnRequestToPayWebhookRequestHandler: RequestHandler = async (req, res) => {
    res.sendStatus(200)

    mtn.sendMTNPaymentRequestToCustomerCallback(req.body)
}

export const mtnPayoutToHostWebhookRequestHandler: RequestHandler = async (req, res) => {
    res.sendStatus(200)

    mtn.sendMTNPayoutToHostCallback(req.body)
}



// --------------------------------- Webhook request handler for firebase user creation ------------------------------
export const firebaseUserCreationWebhookRequestHandler: RequestHandler = async (req, res) => {
    const parsed = z.object({
        uid: z.string(),
        email: z.string(),
        handle: z.string(),
        fname: z.string().nullable().optional(),
        lname: z.string().nullable().optional(),
        profile_pic_url: z.string().nullable().optional(),
        user_type: z.enum(["HOST", "CUSTOMER"])
    }).safeParse(req.body)

    if(!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request body", "error"))


    const user = await prismaClient.user.findFirst({
        where: {
            email: parsed.data.email
        }
    })

    if(!isNull(user)) return res.status(200).send(generateDataTransferObject(user, "User already exists", "success"))

    try {
        let customer_id = undefined
        const data = parsed.data

        if (data.user_type === "CUSTOMER") {
            try {
                const customer = await createCustomer({
                    email: data.email,
                    name: constructFullName(data as User),
                    uid: data.uid
                })
                customer_id = customer.id
            } catch (e) {
                captureException(e)
                return res.status(500).send(generateDataTransferObject(e, "An error occured creating the user", "error"))
            }
            
        }

        if(data.user_type === "HOST") {
            // if the user is an admin, we need to confirm they don't already exist
            const host = await prismaClient.user.findFirst({
                where: {
                    uid: data.uid
                }
            })

            if(isNull(host)){
                // create one
                const user = await prismaClient.user.create({
                    data: {
                        ...data,
                        user_settings: {
                            create: {
                                notifications_enabled: false
                            }
                        }
                    }
                    
                })
                notifications.sendWelcomeEmail({
                    template: 'welcome-email',
                    to: user.email,
                    data: {
                        user_handle: user.email,
                    },
                    subject: "Welcome to divvly"
                })
                return res.status(200).send(generateDataTransferObject(user, "User created successfully", "success"))
            }
            // else 
            return res.status(200).send(generateDataTransferObject(host, "User already exists", "success"))
        }
    
        const newUser = await prismaClient.user.create({
            data: {
                ...data,
                customer_id,
                user_settings: {
                    create: {
                        notifications_enabled: false
                    }
                },
                DriverCredentials: {
                    create: {
                        is_verified: false
                    }
                }
            }
        })

        notifications.sendWelcomeEmail({
            template: 'welcome-email',
            to: newUser.email,
            data: {
                user_handle: newUser.email,
            },
            subject: "Welcome to divvly"
        })

        res.status(200).send(generateDataTransferObject(newUser, "User created successfully", "success"))
    } catch(e) {
        console.log("The error that occured is: ", e)
        captureException(e)
        res.status(500).send(generateDataTransferObject(e, "Internal Server error", "error"))
    }
}