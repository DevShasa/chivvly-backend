import mtn, { mtn_event_names } from ".";
import prismaClient from "@prismaclient/client";
import { MtnPayment, MtnPayout, PaymentRequestsBody, PayoutRequestBody } from "./types";
import { z } from "zod";
import { first, isNull } from "lodash";
import crypto from 'crypto'
import { captureException } from "@sentry/node";
import dayjs from 'dayjs'

const tPaymentRequestToCustomer = z.object({
    user_id: z.string().uuid(),
    amount: z.number().refine((amount)=>amount > 0, {
        message: "Amount must be greater than 0"
    }), 
    payment_type_id: z.string().uuid(),
    vehicle_id: z.string().uuid(),
    authorization_token: z.string(),
})


/**
 * @description - this listener contains the implementation for making the payment request
 */
mtn.on(mtn_event_names.send_mtn_payment_request_to_customer, async (data)=>{
    // get the user
    try {
        const parsed = tPaymentRequestToCustomer.safeParse(data)
        if(!parsed.success) throw new Error(parsed.error.message)
        const { user_id, amount, payment_type_id, vehicle_id } = parsed.data
        const user = await prismaClient.user.findUnique({
            where: {
                id: user_id,
            },
            include: {
                payment_types: {
                    where: {
                        id: payment_type_id
                    }
                },
            }
        })

        const vehicle = await prismaClient.vehicle.findUnique({
            where: {
                id: vehicle_id
            },
            include: {
                host: {
                    include: {
                        market: true
                    }
                }
            }
        })
        if (!vehicle) throw new Error("Vehicle not found")
        if (!vehicle.host) throw new Error("Vehicle host not found")
        if (!vehicle.host.market) throw new Error("Vehicle host market not found")
        if (!vehicle.host.market.currency) throw new Error("Vehicle host market currency not found")
        if(!user) throw new Error("User not found")
        const active_payment_type = user.payment_types.find((payment_type)=>payment_type.status === "ACTIVE" && payment_type.type === "MTN" && !isNull(payment_type.phone_number) && payment_type.id === payment_type_id)
        if(!active_payment_type) throw new Error("No active payment type found")
        if(isNull(active_payment_type.phone_number)) throw new Error("No phone number found")
        const paymentToken = crypto.randomUUID()
        const newPayment = await prismaClient.payment.create({
            data: {
                amount,
                status: "PROCESSING",
                payment_type_id,
                user_id,
                paymentToken,
                authorization: data.authorization_token,
            }
        })
        const request_to_pay_body: PaymentRequestsBody = {
            amount: amount.toString(),
            currency: vehicle.host.market.currency,
            externalId: newPayment.id,
            payeeNote: "Payment for your Divvly reservation ",
            payerMessage: "Payment for your Divvly reservation ",
            payer: {
                partyIdType: "MSISDN",
                partyId: active_payment_type.phone_number.toString()
            }
        }
        await mtn.requestToPay(request_to_pay_body, paymentToken)?.catch(async ()=>{ // error already captured in the requestToPay method
            try {
                await prismaClient.payment.update({
                    where: {
                        id: newPayment.id
                    },
                    data: {
                        status: "FAILED"
                    }
                })

            } catch (e){
                captureException(e)
            }
        })

    } catch (e) {
        captureException(e)
    }
})



/**
 * @description - this listener contains the implementation for handling the response from mtn's api
 */
mtn.on(mtn_event_names.send_mtn_payment_request_to_customer_callback, async (data: MtnPayment)=>{ // vallidations isn't necessary for data coming in from mtn's api
    try {
        const payments = await prismaClient.payment.findMany({
            where: {
                paymentToken: data.externalId
            },
            include: {
                user: true,
                Reservation: true
            }
        })
        const payment = first(payments)

        if(!payment) throw new Error("Payment not found")

        switch(data.status){
            case "SUCCESSFUL":{
                await prismaClient.payment.update({
                    where: {
                        id: payment.id
                    },
                    data: {
                        status: "SUCCEEDED"
                    }
                })

                mtn.sendPaymentSuccessfulNotification({
                    template: 'payment-successful',
                    to: payment.user?.email,
                    subject: "Payment successful",
                    data: {
                        amount: payment.amount.toFixed(2),
                        date: dayjs(payment.date_time)?.format("dddd, MMMM D, YYYY"),
                        user_name: payment.user?.email,
                        vehicle_id: payment?.Reservation?.id,
                    }
                })
                break;
            }
            case "FAILED":{
                await prismaClient.payment.update({
                    where: {
                        id: payment.id
                    },
                    data: {
                        status: "FAILED"
                    }
                })
                break;
            }

            default:{
                throw new Error(`Unknown payment status for ${data.externalId} `)
            }
        }

    }catch (e){
        console.log(e) 
        captureException(e)
    }
})



const tPayoutData = z.object({
    user_id: z.string().uuid(),
    amount: z.number().refine((amount)=>amount > 0, {
        message: "Amount must be greater than 0"
    }),
    withdrawal_id: z.string().uuid().optional(),
    payment_type_id: z.string().uuid().optional(),
    refunded_from: z.string().uuid().optional(),
})

/**
 * @description - this listener contains the implementation for making the payout request
 */
mtn.on(mtn_event_names.send_mtn_payout_to_host, async (data) =>{
    
    const parsed = tPayoutData.safeParse(data)
    try {
         
        if(!parsed.success) throw new Error(parsed.error.message)

        const {  user_id, amount, withdrawal_id, payment_type_id, refunded_from } = parsed.data

        const user = await prismaClient.user.findFirst({
            where: {
                id: user_id,
                PayoutMethod: {
                    some: {
                        AND: [
                            {
                               type: {
                                equals: "MTN"
                               }
                            }
                        ]
                    }
                }
            },
            include: {
                PayoutMethod: {
                    where: {
                        type: "MTN",
                        mobile_money_number: {
                            not: null
                        }
                    }
                },
                payment_types: {
                    where: {
                        type: "MTN",
                        status: "ACTIVE",
                        id: payment_type_id
                    }
                }
            }
        })

        if(user?.user_type === "CUSTOMER") {
            if(!user.payment_types[0]) throw new Error("No active payment type found")
            if(!user.payment_types[0].phone_number) throw new Error("No phone number found")
            if(!user?.market_id) throw new Error("Customer market not found") 

            const market = await prismaClient.market.findUnique({
                where: {
                    id: user.market_id
                },
                select: {
                    currency: true
                }
            })

            if(!market) throw new Error("Market not found")

            const paymentToken = crypto.randomUUID()

            const newPayout = await prismaClient.payout.create({
                data: {
                    amount,
                    payout_token: paymentToken,
                    status: "PROCESSING",
                    user_id: user_id,
                    market_id: user.market_id,
                    type: "CUSTOMER_REFUND",
                    issuer_id: refunded_from
                }
            })

            const funds_transfer_body: PayoutRequestBody = {
                amount: amount.toString(),
                currency: market.currency,
                externalId: newPayout.payout_token,
                payerMessage: "Divvly payout",
                payeeNote: "Divvly payout",
                payee: {
                    partyIdType: "MSISDN",
                    partyId: user?.payment_types?.[0]?.phone_number.toString()
                }
            }
    
            await mtn.requestTransfer(funds_transfer_body, paymentToken).catch(async ()=>{ // error already captured in the requestTransfer method
                try {
                    await prismaClient.payout.update({
                        where: {
                            id: newPayout.id
                        },
                        data: {
                            status: "FAILED"
                        }
                    })
                } catch (e) {
                    captureException(e)
                }
            })

            return 
        }else {
            if(!user) throw new Error("Host not found")
            if(!user.PayoutMethod) throw new Error("Host payout method not found")
            if(!user.PayoutMethod[0]) throw new Error("Host payout method not found")
            if(!user.PayoutMethod[0].mobile_money_number) throw new Error("Host payout method mobile money number not found")
            if(!user.market_id) throw new Error("Host market not found")
    
            const market = await prismaClient.market.findUnique({
                where: {
                    id: user.market_id
                },
                select: {
                    currency: true
                }
            })
    
            if(!market) throw new Error("Market not found")
    
            const payoutToken = crypto.randomUUID()
    
            const newPayout = await prismaClient.payout.create({
                data: {
                    amount,
                    payout_token: payoutToken,
                    status: "PROCESSING",
                    user_id: user_id,
                    market_id: user.market_id,
                    payout_method_id: user.PayoutMethod[0].id,
                    withdrawal_id
                }
            })
    
    
    
            const funds_transfer_body: PayoutRequestBody = {
                amount: amount.toString(),
                currency: market.currency,
                externalId: newPayout.payout_token,
                payerMessage: "Divvly payout",
                payeeNote: "Divvly payout",
                payee: {
                    partyIdType: "MSISDN",
                    partyId: user.PayoutMethod?.[0].mobile_money_number.toString()
                }
            }
    
            await mtn.requestTransfer(funds_transfer_body, payoutToken)

        }


    } catch (e) {
        if(parsed.success && parsed.data.withdrawal_id){
            await prismaClient.withdrawal.update({
                where: {
                    id: parsed.data.withdrawal_id
                },
                data: {
                    status: "FAILED"
                }
            }).catch((e)=>{
                captureException(e)
            })
        }

        captureException(e)
    } 
})


mtn.on(mtn_event_names.send_mtn_payout_to_host_callback, async (data: MtnPayout)=>{ // vallidations isn't necessary for data coming in from mtn's api
    try {
        await prismaClient.payout.updateMany({
            where: {
                payout_token: data.externalId
            },
            data: {
                status: data.status === "SUCCESSFUL" ? "SUCCEEDED" : "FAILED"
            }
        })

        const the_payout = await prismaClient.payout.findFirst({
            where: {
                payout_token: data.externalId
            },
            include: {
                user: true,
                payout_method: true,
            }
        })

        if(!the_payout) throw new Error("Payout not found")

        if(the_payout.withdrawal_id){
            await prismaClient.withdrawal.updateMany({
                where: {
                    id: the_payout.withdrawal_id
                },
                data: {
                    status: the_payout.status === "SUCCEEDED" ? "COMPLETED" : "FAILED"
                }
            })

            mtn.sendWithdrawalApprovedNotification({
                template: 'withdrawal-approved',
                to: the_payout?.user?.email,
                subject: "Withdrawal approved",
                data: {
                    payout_method: the_payout?.payout_method?.type,
                    payout_method_id: the_payout?.payout_method?.id,
                    withdrawal_ammount: the_payout?.amount?.toFixed(2),
                    withdrawal_date: dayjs(the_payout?.date)?.format("dddd, MMMM D, YYYY"),
                    withdrawal_id: the_payout?.withdrawal_id
                }
            })
        }

    } catch (e) {
        captureException(e)
    }
})