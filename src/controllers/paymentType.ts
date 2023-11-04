import { RequestHandler } from "express";
import { tMobileMoneyPaymentType, tPaymentType } from "@validators/paymentType";
import { createPaymentMethod, getPaymentMethods, tPaymentMethod } from "@utils/stripe/actions";
import generateDataTransferObject from "@utils/generateDto";
import { isEmpty, isNull } from "lodash";
import prismaClient from "@prismaclient/client";
import { z } from "zod";
import { captureException } from "@sentry/node";




export const addPaymentMethod: RequestHandler = async  (req, res) => {
    const user_id = req.headers.user_id as string
    const _type = req.query.type

    switch(_type?.toString().toUpperCase()){
        case "MPESA":{
            const mpesa = tMobileMoneyPaymentType.required({type: true, phone_number: true}).safeParse(req.body)
            if(!mpesa.success) return res.status(400).send(generateDataTransferObject(null, "Invalid request body", "error"))
            try {
                const payment_method = await prismaClient.paymentTypes.create({
                    data: {
                        user_id,
                        phone_number: mpesa.data.phone_number,
                        type: "MPESA",
                    }
                })
                if(isEmpty(payment_method) || isNull(payment_method)) return res.status(500).send(generateDataTransferObject(null, "An error occured while creating payment method", "error"))
                return res.status(200).send(generateDataTransferObject(null, "Payment method created successfully", "success"))
            } catch (e) {
                res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
                captureException(e)
            }
            break;
        }
        case "MTN": {
            const mtn = tMobileMoneyPaymentType.required({type: true, phone_number: true}).safeParse(req.body)
            if(!mtn.success) return res.status(400).send(generateDataTransferObject(null, "Invalid request body", "error"))
            try {
                const payment_method = await prismaClient.paymentTypes.create({
                    data: {
                        user_id,
                        phone_number: mtn.data.phone_number,
                        type: "MTN",
                    }
                })
                if(isEmpty(payment_method) || isNull(payment_method)) return res.status(500).send(generateDataTransferObject(null, "An error occured while creating payment method", "error"))
                return res.status(200).send(generateDataTransferObject(null, "Payment method created successfully", "success"))
            } catch (e) {
                res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
                captureException(e)
            }
            break;
        }
        case "STRIPE": {
            try {
                const card = tPaymentMethod.required({card_number: true, exp_month: true, exp_year: true, customer_id: true, cvc: true}).safeParse(req.body)
                if(!card.success) return res.status(400).send(generateDataTransferObject(card.error, "Invalid request body", "error"))
                const payment_method = await createPaymentMethod(card.data)
                if(isEmpty(payment_method) || isNull(payment_method)) return res.status(500).send(generateDataTransferObject(null, "An error occured while creating payment method", "error"))
                const new_payment_method = await prismaClient.paymentTypes.create({
                    data: {
                        stripe_payment_method_id: payment_method?.id,
                        user_id,
                        details: {
                            last4: payment_method?.card?.last4 as string,
                            issuer: payment_method?.card?.brand as string,
                        },
                        type: "STRIPE" // being explicit for clarity
                    }
                })
                if(isEmpty(new_payment_method) || isNull(new_payment_method)) return res.status(500).send(generateDataTransferObject(null, "An error occured while creating payment method", "error"))
                return res.status(200).send(generateDataTransferObject(null, "Payment method added successfully", "success"))
            } catch(e){
                res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
                captureException(e)
            }
            break;
        }
        case "PAYPAL":
            /**
             * @todo add implementation
             */
            break;
        case "CASH":
            /**
             * @todo add implementation
             */
            break;
        default:
            return res.status(400).send(generateDataTransferObject(null, "Invalid payment method", "error"))
    }
}

export const updatePaymentType: RequestHandler = async (req, res) => {
    const user_id =req.headers.user_id as string
    const id = req.query.id as string

    if (isEmpty(id)) return res.status(400).send(generateDataTransferObject(null, "Payment type id is required", "error"))

    const parsed =  tPaymentType.required({
        status: true
    }).safeParse(req.body)
    if(!parsed.success) return res.status(400).send(generateDataTransferObject(null, "Invalid request body", "error"))
    const data = parsed.data
    try {
        await prismaClient.paymentTypes.updateMany({
            where: {
                id,
                user_id
            },
            data: data
        })

        return res.status(200).send(generateDataTransferObject(null, "Payment type updated successfully", "success"))
    }
    catch (e)
    {
        captureException(e)
        return res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
    }   
}

export const getUserPaymentMethods: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as string 
    const user_type = req.headers.user_type as string
    const parsed = z.object({
        payment_type_id: z.string().uuid().optional()
    }).safeParse(req.query)

    if(!parsed.success) return  res.status(400).send(generateDataTransferObject(null, "Invalid request body", "error"))

    if (user_type !== "CUSTOMER") return res.status(403).send(generateDataTransferObject(null, "Not allowed", "error"))

    try {
        // no need for pagination, it can be done client side
        const paymenttypes = await prismaClient.paymentTypes.findMany({
            where: {
                user_id,
                id: parsed.data.payment_type_id,
                status: {
                    not: "NONACTIVE"
                }
            },
            include: {
                payments: true
            }
        })

        if(isEmpty(paymenttypes)) return res.status(404).send(generateDataTransferObject(null, "No payment methods found", "error"))
        const stringified = JSON.stringify(paymenttypes, (key, value)=>{
            if(typeof value === "bigint") return value.toString()
            return value
        })

        const parsed_res = JSON.parse(stringified)
        return res.status(200).send(generateDataTransferObject(parsed_res, "Payment methods found", "success"))
    } catch (e) {
        captureException(e)
        return res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
    }
}