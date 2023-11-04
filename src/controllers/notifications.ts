import prismaClient from "@prismaclient/client";
import { captureException } from "@sentry/node";
import { expo_app_scheme } from "@utils/expo";
import { RequestHandler } from "express";
import notifications from "src/notifications";


export const customerOnBoardingScanHandler: RequestHandler = async(req, res) => {


    await prismaClient.user.findMany({
        where: {
            user_type: "CUSTOMER",
            OR: [
                {
                    DriverCredentials: {
                        drivers_licence_back: {
                            equals: null
                        },
                        drivers_licence_front: {
                            equals: null
                        }
                    }
                },
                {
                    market_id: {
                        equals: null
                    }
                },
                {
                    sub_market_id: {
                        equals: null
                    }
                },
                {
                    NOT: {
                        payment_types: {
                            some: {}
                        }
                    }
                }
            ]
        },
         select: {
            email: true,
            fname: true,
            lname: true,
            id: true
         }
    }).then((users)=>{
        res.sendStatus(200)

        for (const user of users) {
            notifications.sendCompleteOnboardingCustomerNotification({
                data: {
                   message: `Almost there, complete your onboarding process to start using the app`,
                   link: `${expo_app_scheme}onboarding`,
                },
                user_id: user.id
            })
        }

    }).catch((e)=>{
        captureException(e)
        res.sendStatus(500)
    })
}

export const hostOnBoardingScanHandler: RequestHandler = async(req, res) => {
    await prismaClient.user.findMany({
        where: {
            user_type: "HOST",
            OR: [
                {
                    connected_account_id: {
                        equals: null
                    }
                }
            ],
            is_admin: {
                not: true
            }
        },
        select: {
            email: true,
            fname: true,
            lname: true,
            id: true
        }
    }).then((users)=>{
        res.sendStatus(200)
        for (const user of users) {
            notifications.sendCompleteOnboardingHostNotification({
                subject: "Complete your onboarding process",
                to: user.email,
                template: 'onboard-reminder',
                data: {
                    user_name: user?.email,
                    onboarding_link: `${process.env.CONTROL_PANEL_URL}/onboarding`
                }
            })
        }
    }).catch((e)=>{
        res.sendStatus(500)
        captureException(e)
    })
}

export const reservationsIn5MinutesHandler: RequestHandler = async(req, res) => {
    await prismaClient.reservation.findMany({
        where: {
            AND: [
                {
                    start_date_time: {
                        gte: new Date(new Date().toUTCString()), 
                    },
                },
                {
                    start_date_time: {
                        lte: new Date(new Date().setMinutes(new Date().getMinutes() + 5))
                    }
                }
            ]
        },
        include: {
            user: true,
            vehicle: true
        }
    }).then((reservations)=>{
        res.sendStatus(200)
        for (const reservation of reservations) {
            notifications.sendReservationReminderNotification({
                data: {
                    message: `Your reservation for ${reservation.vehicle.make} ${reservation.vehicle.model} is in 5 minutes`,
                    link: `${expo_app_scheme}manage-reservations?reservation_id=${reservation.id}`
                },
                user_id: reservation.user_id
            })
        }
    }).catch((e)=>{
        res.sendStatus(500)
        captureException(e)
    })
}