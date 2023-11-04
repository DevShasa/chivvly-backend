import { tPayoutMethodType } from "@prisma/client"
import prismaClient from "@prismaclient/client"
import { captureException } from "@sentry/node"



const getAmountPayable = async (amount: number, user_id: string, payout_method: tPayoutMethodType) => {
    try {   
        const all_time_payments_agg = await prismaClient.payment.aggregate({
            where: {
                Reservation: {
                    vehicle: {
                        host: {
                            id: user_id
                        }
                    }
                },
                amount: {
                    gte: 0
                },
                status: "SUCCEEDED"
            },
            _sum: {
                amount: true
            }
        })

        const all_time_payouts_agg = await prismaClient.payout.aggregate({
            where: {
                user_id,
                amount: {
                    gte: 0
                },
                status: "SUCCEEDED"
            },
            _sum: {
                amount: true
            }
        })

        const all_time_payments = all_time_payments_agg._sum.amount ?? 0
        const all_time_payouts = all_time_payouts_agg._sum.amount ?? 0

        const total = all_time_payments - all_time_payouts 

        if(total < 1) throw Error("Not enough funds to withdraw")

        if(amount > total) throw Error("Not enough funds to withdraw")

        return amount
        
    } catch (e) {
        captureException(e)
        return Promise.reject(e)
    }
}