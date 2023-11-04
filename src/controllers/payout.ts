import generateDataTransferObject from "@utils/generateDto";
import { RequestHandler } from "express";
import { createAccountOnboardingLink } from "@utils/stripe/actions";
import prismaClient from "@prismaclient/client";
import { SECONDS_IN_A_MONTH, appUserTypes } from "@utils/constants";
import { isNull } from "lodash";
import { tCreateWithdrawalRequestSchema, tFetchWithdrawalRequestSchema, tNewPayoutMethodSchema, tPayoutQuerySchema, tSendPayoutSchema, tUpdateWithdrawalBodySchema } from "@validators/payout";
import mpesa from "@utils/mpesa";
import '@utils/mpesa/listeners'
import mtn from "@utils/mtn";
import { captureException } from "@sentry/node";
import notifications from "src/notifications";
import { WithUserHeaders } from "@middleware/withUser";


export const addPayoutMethod: RequestHandler = async (req, res) => {
    const email = req.headers.email as unknown as string
    const parsed = tNewPayoutMethodSchema.safeParse(req.body)
    const user_id = req.headers.user_id as unknown as string

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid data provided", "error"))

    const data = parsed.data

    try {
        const newPayoutMethod =  await prismaClient.payoutMethod.create({
            data: {
                details: data.details,
                type: data.type,
                user_id,
                mobile_money_number: ["MTN", "MPESA"]?.includes(data?.details?.provider ?? "") ? data?.details?.phone_number : null,
            }
        })


        notifications.sendToHostPayoutMethodAddedNotification({
            template: 'payout-method-added',
            subject: 'Payout method added',
            to: email,
            data: undefined
        })

        res.status(201).send(generateDataTransferObject(newPayoutMethod, "Successfully created payout method", "success"))
    } catch (e) {
        res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
        captureException(e)
    }
}


/**
 * @name resumeStripeOnboarding
 * @description sends the user a link to create or update their payout method, e.g if they did not complete the stripe onboarding process
 * @param req 
 * @param res 
 */
export const resumeStripeOnboarding: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as unknown as string

    await prismaClient.user.findUnique({
        where: {
            id: user_id
        },
        select: {
            connected_account_id: true
        }
    }).then(async (user)=> {
        if(isNull(user)) return res.status(404).send(generateDataTransferObject(null, "User not found", "error"))
        if(isNull(user.connected_account_id)) return res.status(400).send(generateDataTransferObject(null, "User does not have a connected account", "error"))
        await createAccountOnboardingLink(user.connected_account_id).then((link)=>{
            res.status(200).send(generateDataTransferObject(link.url, "Successfully created onboarding link", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured creating the onboarding link", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
        captureException(e)
    })
}


export const getHostPayouts: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as unknown as string
    const user_type = req.headers.user_type as unknown as string
    if (user_type !== appUserTypes.host) return res.status(403).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))
    tPayoutQuerySchema.parseAsync(req.query).then(async (query)=>{
        const  { page, size, status } = query

        await prismaClient.payout.findMany({
            where: {
                status: status,
                user_id: user_id
            },
            skip: (page - 1) * size,
            take: size,
        }).then((data)=>{
            res.status(200).send(generateDataTransferObject(data, "Successfully fetched payouts", "success"))
        }).catch((e)=>{
            res.status(400).send(generateDataTransferObject(e, "Invalid query provided", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid query provided", "error"))
    })

}   

// legacy [ switched to withdrawals ]
export const sendMPesaPayout: RequestHandler = async (req, res) => {
    const parsed = tSendPayoutSchema.safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid data provided", "error"))

    const data = parsed.data

    const total_mpesa_payments_this_month = await prismaClient.payment.aggregate({
        where: {
            Reservation: {
                vehicle: {
                    host: {
                        id: data.user_id
                    }
                },
                status: "COMPLETE" // only payments made for complete reservations
            },
            date_time: {
                gte: new Date(new Date().getTime() - SECONDS_IN_A_MONTH) // this month
            },
            status: "SUCCEEDED",
            payment_type: {
                type: "MPESA"
            }
        },
        _sum: {
            amount: true,
        }
    })

    const total_payouts_this_month = await prismaClient.payout.aggregate({
        where: {
            user_id: data.user_id,
            status: "SUCCEEDED",
            date: {
                gte: new Date(new Date().getTime() - SECONDS_IN_A_MONTH) // this month
            },
            payout_method: {
                type: "MPESA"
            }
        },
        _sum: {
            amount: true,
        }
    })

    const what_the_host_shout_be_paid_this_month = (total_mpesa_payments_this_month._sum.amount ?? 0) - (total_payouts_this_month._sum.amount ?? 0)

    /**
     * @todo - deduction will happen here
     */

    if (what_the_host_shout_be_paid_this_month <= 0) return res.status(400).send(generateDataTransferObject(null, "No money for host", "error"))

    // if no amount is specified in the request, we will pay the host for the month
    let final_amount_to_be_paid = what_the_host_shout_be_paid_this_month
    if(data.amount) {
        if(data.amount > what_the_host_shout_be_paid_this_month) return res.status(400).send(generateDataTransferObject(null, "Amount specified is greater than what the host should be paid", "error"))
        final_amount_to_be_paid = data.amount
    }

    res.status(200).send(generateDataTransferObject(null, "PROCESSING", "success"))

    mpesa.sendMpesaPayout({
      amount: final_amount_to_be_paid,
      user_id: data.user_id,
    });


}

// legacy [ switched to withdrawals ]
export const sendMTNPayout: RequestHandler = async (req, res) => {
    const parsed = tSendPayoutSchema.safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid data provided", "error"))

    const data = parsed.data

    const total_mtn_payments_this_month = await prismaClient.payment.aggregate({
        where: {
            Reservation: {
                vehicle: {
                    host: {
                        id: data.user_id
                    }
                },
                status: "COMPLETE"
            },
            date_time: {
                gte: new Date(new Date().getTime() - SECONDS_IN_A_MONTH) // this month
            },
            status: "SUCCEEDED",
            payment_type: {
                type: "MTN"
            }
        },
        _sum: {
            amount: true,
        }
    })

    const total_payouts_this_month = await prismaClient.payout.aggregate({
        where: {
            user_id: data.user_id,
            status: "SUCCEEDED",
            date: {
                gte: new Date(new Date().getTime() - SECONDS_IN_A_MONTH) // this month
            },
            payout_method: {
                type: "MTN"
            }
        },
        _sum: {
            amount: true,
        }
    })

    const what_the_host_shout_be_paid_this_month = (total_mtn_payments_this_month._sum.amount ?? 0) - (total_payouts_this_month._sum.amount ?? 0)

    /**
     * @todo - deduction will happen here
     */

    if (what_the_host_shout_be_paid_this_month <= 0) return res.status(400).send(generateDataTransferObject(null, "No money for host", "error"))

    // if no amount is specified in the request, we will pay the host for the month
    let final_amount_to_be_paid = what_the_host_shout_be_paid_this_month
    if(data.amount) {
        if(data.amount > what_the_host_shout_be_paid_this_month) return res.status(400).send(generateDataTransferObject(null, "Amount specified is greater than what the host should be paid", "error"))
        final_amount_to_be_paid = data.amount
    }

    res.status(200).send(generateDataTransferObject(null, "PROCESSING", "success"))

    mtn.sendMTNPayout({
        amount: final_amount_to_be_paid,
        user_id: data.user_id
    })
}


export const createWithdrawalRequest: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as string 

    const parsed = tCreateWithdrawalRequestSchema.safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid data provided", "error"))

    const data = parsed.data 

    try {   
        const withdrawal_request = await prismaClient.withdrawal.create({
            data: {
                amount: data.amount,
                user_id: user_id,
                payout_method_id: data.payout_method_id,
            }
        })

        return res.status(201).send(generateDataTransferObject(withdrawal_request, "Withdrawal request created", "success"))
    } catch (e) {
        captureException(e)
        return res.status(500).send(generateDataTransferObject(null, "Internal server error", "error"))
    }
}


export const fetchWithdrawalRequests: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as string 
    const role = req.headers.role as 'admin' | 'user'


    const parsed = tFetchWithdrawalRequestSchema.safeParse(req.query)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid data provided", "error"))

    const query = parsed.data 


    try {
        const withdrawal_requests = await prismaClient.withdrawal.findMany({
            where: {
                user_id: role === 'user' ? user_id : query.user_id,
                status: query.status,
                payout_method_id: query.payout_method_id,
                id: query?.withdrawal_request_id,
                OR: [
                    {
                        user: {
                            fname: {
                                contains: query.search,
                                mode: 'insensitive'
                            }
                        },
                    },
                    {
                        user: {
                            lname: {
                                contains: query.search,
                                mode: 'insensitive'
                            }
                        },
                    },
                    {
                        user: {
                            email: {
                                contains: query.search,
                                mode: 'insensitive'
                            }
                        },
                    },
                ]
            },
            include: {
                user: {
                    include: {
                        market: {
                            select: {
                                currency: true
                            }
                        },
                    }
                },
                payouts: true,
                payout_method: true
            },
            orderBy: {
                [query.sort_by]: query.sort
            }
        })
    
        return res.status(200).send(generateDataTransferObject(withdrawal_requests, "Withdrawal requests fetched", "success"))
    } catch (e) {
        captureException(e)
        return res.status(500).send(generateDataTransferObject(null, "Internal server error", "error"))
    }
}

export const updateWithdrawalStatus: RequestHandler = async (req, res) => {
    const role = req.headers.role as 'admin' | 'user'

    const parsed = tUpdateWithdrawalBodySchema.safeParse(req.body) 

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid data provided", "error"))


    const body = parsed.data 

    if(role !== 'admin' && body.status !== 'CANCELLED') return res.status(403).send(generateDataTransferObject(null, "You are not allowed to update the status of a withdrawal request", "error"))

    try {
        if (body.status !== 'APPROVED') {

            // TODO: add an extra layer of validation for is the new status is completed, this is for ach payments, where we dont have an intergration, and payments are gonna be made manually
            await prismaClient.withdrawal.update({
                where: {
                    id: body.id
                },
                data: {
                    status: body.status
                }
            })

            return res.status(200).send(generateDataTransferObject(null, "Withdrawal request updated", "success"))
        }

        // else, the admin has approved the withdrawal request, therefore we can initiate the payout 

        const the_withdrawal_request = await prismaClient.withdrawal.findUnique({
            where: {
                id: body.id
            },
            include: {
                payout_method: true,
                user: true
            }
        })

        if(isNull(the_withdrawal_request)) return res.status(404).send(generateDataTransferObject(null, "Withdrawal request not found", "error"))

        await prismaClient.withdrawal.update({
            where: {
                id: the_withdrawal_request.id
            },
            data: {
                status: 'APPROVED'
            }
        })

        notifications.sendWithdrawalApprovedNotification({
            to: the_withdrawal_request.user.email,
            subject: "Withdrawal request approved",
            template: "withdrawal-approved",
            data: {
                payout_method: the_withdrawal_request.payout_method.type,
                payout_method_id: the_withdrawal_request.payout_method.id,
                withdrawal_ammount: the_withdrawal_request.amount?.toFixed(2),
                withdrawal_id: the_withdrawal_request.id,
            }
        })
        switch(the_withdrawal_request.payout_method.type) {
            case 'MTN': {
                res.status(200).send(generateDataTransferObject(null, "PROCESSING", "success"))
                // let the mtn client handle the rest
                mtn.sendMTNPayout({
                    amount: the_withdrawal_request.amount ?? 0,
                    user_id: the_withdrawal_request.user_id,
                    withdrawal_id: the_withdrawal_request.id
                })
                break;
            }
            case 'MPESA': {
                res.status(200).send(generateDataTransferObject(null, "PROCESSING", "success"))
                // let the mpesa client handle the rest 
                mpesa.sendMpesaPayout({
                  amount: the_withdrawal_request.amount ?? 0,
                  user_id: the_withdrawal_request.user_id,
                  withdrawal_id: the_withdrawal_request.id,
                });
                break;
            }
            case "BANK_ACCOUNT": {
                await prismaClient.withdrawal.update({
                    where: {
                        id: the_withdrawal_request.id
                    },
                    data: {
                        status: 'COMPLETED'
                    }
                })
            }
            break;
            //others can go here
            default: {
                return res.status(400).send(generateDataTransferObject(null, "Unable to complete because of invalid payout method", "error"))
            }
        }

    } catch (e) {
        res.status(500).send(generateDataTransferObject(null, "Internal server error", "error"))
        captureException(e)
    }
}


export const fetchPayoutReports: RequestHandler = async (req, res) => {
    const headers = req.headers as WithUserHeaders
    const { user_id, user_type, market_id } = headers 

    if (user_type !== "HOST" ) {
        return res.status(403).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))
    }

    const market = prismaClient.market.findUnique({
        where: {
            id: market_id
        }
    })


    const withdrawals = prismaClient.withdrawal.aggregate({
        where: {
            user_id: user_id,
            status:{
                in: ["APPROVED", "PROCESSING", "COMPLETED", "PENDING"]
            }
        },
        _sum: {
            amount: true
        }
    })

    const refunds = prismaClient.payout.aggregate({
        where: {
            issuer_id: user_id
        },
        _sum: {
            amount: true
        }
    })

    const payments = prismaClient.payment.aggregate({
        where: {
            Reservation: {
                vehicle: {
                    user_id
                }
            }
        },
        _sum: {
            amount: true
        }
    })

    try {
        const [money_being_processed, money_refunded, payments_data, user_market] = await prismaClient.$transaction([withdrawals, refunds, payments, market])
    
        const total_money_withdrawable = (payments_data._sum.amount ?? 0) - ((money_being_processed._sum.amount ?? 0) + (money_refunded._sum.amount ?? 0))
    
        // const after_tax_an_platform_fees - this is where to make the deductions
    
        return res.status(200).send(generateDataTransferObject({
            available: total_money_withdrawable ?? 0,
            // tax: 0, TODO: add tax based on host's market
            // platform_fees: 0 calculate platform fees,
            all_time: payments_data?._sum?.amount ?? 0,
            currency: user_market?.currency
        }, "Successfully fetched withdrawable amount", "success"))
    } catch (e) {
        captureException(e)
        return res.status(500).send(generateDataTransferObject(null, "Internal server error", "error"))
    }

    
}