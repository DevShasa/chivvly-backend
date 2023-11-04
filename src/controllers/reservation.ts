import  generateDataTransferObject  from '@utils/generateDto';
import { RequestHandler } from "express";
import prismaClient from "@prismaclient/client";
import { tQueryCalendarSchema, tReservationQuerySchema, tReservationSchema, tUpdateCalendarSchema } from '@validators/reservation';
import { isEmpty, isUndefined } from 'lodash';
import { appUserTypes, reservationStatusColor } from '@utils/constants';
import { isPaymentAuthorizationTokenValid } from '@utils/functions';
import { z } from 'zod';
import { captureException } from '@sentry/node';
import notifications from 'src/notifications';
import { WithUserHeaders } from '@middleware/withUser';

export const createReservation:RequestHandler =  async(req, res) =>{
    const user_id = req.headers.user_id as string
    const payment_auth = req?.headers?.["x-payment-authorization"] as string // expo has no support for cookies
    if(isEmpty(payment_auth) || isUndefined(payment_auth)) return res.status(401).send(generateDataTransferObject({}, "Unauthorized", "error"))
    if(!isPaymentAuthorizationTokenValid(payment_auth)) return res.status(401).send(generateDataTransferObject({}, "Unauthorized", "error"))

    await tReservationSchema.required({
        vehicle_id: true,
        station_id: true,
        start_date_time: true,
        end_date_time: true,
    }).parseAsync(req.body).then((async (reservation)=>{
        // get the payment by the payment auth
        await prismaClient.payment.findFirst({
            where: {
                user_id,
                authorization: payment_auth, // get the exact payment for this reservation
                status: "SUCCEEDED" // the payment must have been successful
            }
        }).then(async (payment)=>{
            if(isEmpty(payment)) return res.status(400).send(generateDataTransferObject({}, "Payment not found", "error"))
            await prismaClient.reservation.create({
                data: {
                    ...reservation,
                    start_date_time: reservation.start_date_time,
                    end_date_time: reservation.end_date_time,
                    user_id,
                    payment_id: payment.id,
                    inspection: {
                        create: {

                        }
                    }
                },
                include: {
                    vehicle: {
                        include: {
                            host: true
                        }
                    },
                    user: true
                }
            }).then((reservation)=>{
                notifications.sendReservationMadeNotification({
                    to: reservation?.vehicle?.host?.email,
                    template: 'new-reservation',
                    subject: 'New Reservation',
                    data: {
                        host_name: reservation?.vehicle?.host?.fname ?? "there",
                        auth_code: '*******',
                        vehicle_model: reservation?.vehicle?.model ?? "",
                        client_name: reservation?.user?.fname ?? "",
                        vehicle_name: (reservation?.vehicle?.make ?? "") + " " + (reservation?.vehicle?.model ?? ""),
                    }
                })
                res.status(201).send(generateDataTransferObject(reservation, "Reservation created successfully", "success"))
            }).catch((e)=>{
                res.status(500).send(generateDataTransferObject(e, "An error occured creating the reservation", "error"))
                captureException(e)
            })
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "Unable to process payment", "error"))
            captureException(e)
        })
        
    })).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "An error occured", "error"))
    })  
}

export const modifyReservation:RequestHandler = async (req, res)=>{
    const user_id = req.headers.user_id as string
    await tReservationSchema.parseAsync(req.body).then(async (updatedReservation)=>{
        const { reservation_id } = req.query
            await prismaClient.reservation.findFirst(({
                where: {
                    id: reservation_id as string,
                    user_id
                }
            })).then(async (reservation)=>{
                if(isEmpty(reservation)) return res.status(400).send(generateDataTransferObject({}, "Reservation not found", "error"))
                await prismaClient.reservation.update({
                    where: {
                        id: reservation_id as string
                    },
                    data: {
                        ...updatedReservation,
                        start_date_time: updatedReservation.start_date_time ? new Date(updatedReservation.start_date_time) : undefined,
                        end_date_time: updatedReservation.end_date_time ? new Date(updatedReservation.end_date_time) : undefined
                    }
                }).then(()=>{
                    res.status(200).send(generateDataTransferObject(reservation, "Reservation updated successfully", "success"))
                }).catch((e)=>{
                    res.status(500).send(generateDataTransferObject(e, "An error occured updating the reservation", "error"))
                    captureException(e)
                })
            }).catch((e)=>{
                res.status(400).send(generateDataTransferObject(e, "An error occured", "error"))
            })
            
        }).catch((e)=>{
            res.status(400).send(generateDataTransferObject(e, "An error occured", "error"))
        })
}

export const fetchReservations:RequestHandler = async(req, res)=>{
   const { user_type, user_id: current_user_id, role } = req.headers as WithUserHeaders

   
   tReservationQuerySchema.parseAsync(req.query).then(async (query)=>{
       const { page, size, reservation_id, status, search, station_id, sub_market_id, market_id, vehicle_id, sort, sort_by, user_id} = query

        await prismaClient.reservation.findMany({
            where: {
                id: reservation_id,
                status: 
                status === "PENDING_CONFIRMATION" ? undefined : // if status is pending confirmation, return all reservations regardless of status
                status !== undefined ? { // if status is not undefined, return all reservations with the specified status
                    notIn: ["PENDING_CONFIRMATION"],
                    equals: status
                } : undefined, // if status is undefined, return all reservations
                payment_method: status === "PENDING_CONFIRMATION" ? "CASH" : undefined, // if status is pending confirmation, return all cash reservations as well
                user_id: role === "admin" ? user_id : user_type === appUserTypes.host ? undefined : current_user_id,
                vehicle: user_type === appUserTypes.host ? {
                    host: {
                        id: role === "admin" ? user_id : current_user_id
                    },
                    OR: isEmpty(search) ? undefined : [
                        {
                            make: {
                                contains: isEmpty(search) ? undefined : search,
                                mode: 'insensitive'
                            },
                        },
                        {
                            model: {
                                contains: isEmpty(search) ? undefined : search,
                                mode: 'insensitive'
                            },
                        },
                        {
                            plate: {
                                contains: isEmpty(search) ? undefined : search,
                                mode: 'insensitive'
                            }
                        }
                    ],
                    station_id,
                    station: {
                        sub_market_id,
                        sub_market: market_id ?  {
                            market_id
                        } : undefined
                    }
                } : undefined,
                vehicle_id,
                NOT: {
                    type: "BLOCK"
                }
            },
            include: {
                vehicle: {
                    include: {
                        host: {
                            include: {
                                user_settings: {
                                    select: {
                                        tracking_enabled: true
                                    }
                                },
                                market: true,
                                sub_market: true
                            }
                        },
                        station: true,                    
                    }
                },
                payment: {
                    include: {
                        payment_type: true 
                    }
                },
                user: true,
                inspection: true,
            },
            skip: (page - 1) * size,
            take: size,
            orderBy: sort_by !== "payment" ? {
                [sort_by]: sort,
            } : {
                payment: {
                    amount: sort
                }
            }
        }).then((reservations)=>{
            const stringified = JSON.stringify(reservations, (key, value)=>{
                if(typeof value === 'bigint'){
                    return value.toString()
                }
                return value
            })
            const parsed = JSON.parse(stringified)
            res.status(200).send(generateDataTransferObject(parsed, "Reservations fetched successfully", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured fetching reservations", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "An error occured" , "error"))
    })
}

export const getCalendarData: RequestHandler = async (req, res)=>{
    const { user_id: current_user_id, user_type, role } = req.headers as WithUserHeaders

    if (user_type !== appUserTypes.host) return res.status(400).send(generateDataTransferObject({}, "Only hosts can access this endpoint", "error"))
    const parsed = tQueryCalendarSchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error.formErrors.fieldErrors, "Invalid query", "error"))
    const query = parsed.data
    const { start_time, end_time, user_id } = query
    const start = Number.isNaN(Number(start_time)) ? start_time : Number(start_time)
    const end = Number.isNaN(Number(end_time)) ? end_time : Number(end_time)
    try {
        const vehicles = await prismaClient.vehicle.findMany({
            where: {
                host: {
                    id: role === "admin" ? user_id : current_user_id
                }
            }
        })
    
        const resources = vehicles.map((vehicle)=>{
            return {
                title: `${vehicle.make} ${vehicle.model} (${vehicle.plate})`,
                ...vehicle
            }
        })
    
        const reservations = await prismaClient.reservation.findMany({
            where: {
                vehicle: {
                    host: {
                        id: role === "admin" ? user_id : current_user_id
                    }
                },
                start_date_time: {
                    gte: new Date(start).toISOString(),
                },
                end_date_time: {
                    lte: new Date(end).toISOString()
                }
            },
            include: {
                user: {
                    select: {
                        fname: true,
                        lname: true,
                        email: true,
                        profile_pic_url: true
                    }
                },
                vehicle: true
            }
        })
    
        const events = reservations.map((reservation)=>{
             return {
                id: reservation.id,
                resourceId: reservation.vehicle.id,
                title: `${(reservation.user.fname ?? "")} ${(reservation.user.lname ?? "")} (${reservation.user.email ?? ""})`,
                start: reservation.start_date_time,
                end: reservation.end_date_time,
                color: reservation?.type === "BLOCK" ? "black" : reservationStatusColor[reservation.status],
                extendedProps: {
                    status: reservation.status,
                    type: reservation.type,
                    vehicle: reservation.vehicle,
                    user: reservation.user,
                },
                description: reservation?.type === "BLOCK" ? "You blocked this time slot": reservation.status
             }
        })
    
        res.status(200).send(generateDataTransferObject({
            resources,
            events
        }, "Calendar data fetched successfully", "success"))

    } 
    catch (e)
    {
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching calendar data", "error"))
        captureException(e, (scope)=>{
            return scope.setUser({
                id: current_user_id
            })
        })
    }
}

export const blockSlot: RequestHandler = async (req, res)=>{
    const { user_id } = req.headers as {
        user_id: string,
        user_type: string
    }

    const parsed = z.object({
        vehicle_id: z.string().uuid(),
        start_date_time: z.string(),
        end_date_time: z.string(),
    }).safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error.formErrors.fieldErrors, "Invalid body", "error"))

    const { vehicle_id, start_date_time, end_date_time } = parsed.data

    try {
        const block = await prismaClient.reservation.create({
            data: {
                user_id,
                vehicle_id,
                start_date_time,
                end_date_time,
                type: "BLOCK", 
            }
        })

        res.status(200).send(generateDataTransferObject(block, "Slot blocked successfully", "success"))
    } 
    catch (e)
    {
        res.status(500).send(generateDataTransferObject(e, "An error occured blocking the slot", "error"))
        captureException(e, (scope)=>{
            return scope.setUser({
                id: user_id
            })
        })
    }
}

export const unblockSlot: RequestHandler = async (req, res)=>{
    const { user_id } = req.headers as {
        user_id: string,
        user_type: string
    }

    const parsed = z.object({
        reservation_id: z.string().uuid(),
    }).safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error.formErrors.fieldErrors, "Invalid body", "error"))

    const { reservation_id } = parsed.data

    try {
        const block = await prismaClient.reservation.delete({
            where: {
                id: reservation_id
            }
        })

        res.status(200).send(generateDataTransferObject(block, "Slot unblocked successfully", "success"))
    } 
    catch (e)
    {
        res.status(500).send(generateDataTransferObject(e, "An error occured unblocking the slot", "error"))
        captureException(e, (scope)=>{
            return scope.setUser({
                id: user_id
            })
        })
    }
}

export const updateCalendarData: RequestHandler = async (req, res) => {
    const { user_type } = req.headers as {
        user_id: string,
        user_type: string
    }

    if (user_type !== appUserTypes.host) return res.status(400).send(generateDataTransferObject({}, "Only hosts can access this endpoint", "error"))
    await tQueryCalendarSchema.required({
        event_id: true
    }).parseAsync(req.query).then(async (query)=>{
        await tUpdateCalendarSchema.required().parseAsync(req.body).then(async (body)=>{
            const {event_id} = query
            const { status } = body
            await prismaClient.reservation.update({
                where: {
                    id: event_id as string
                },
                data: {
                    status
                }
            }).then((updated)=>{
                res.status(200).send(generateDataTransferObject(updated, "Reservation updated successfully", "success"))
            }).catch((e)=>{
                res.status(500).send(generateDataTransferObject(e, "An error occured updating the reservation", "error"))
                captureException(e)
            })
        }).catch((e)=>{
            res.status(400).send(generateDataTransferObject(e, "Invalid body ", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid query ", "error"))
    })
}

export const updateInspection: RequestHandler = async (req, res)=>{
    const parsed = z.string().uuid().safeParse(req.query.reservation_id)
    const reservation_id = parsed.success ? parsed.data : undefined
    if (!reservation_id) return res.status(400).send(generateDataTransferObject({}, "Invalid reservation id", "error"))
    return prismaClient.inspection.update({
        where: {
            reservation_id
        },
        data: {
            fuel: req.body.fuel, // if undefined, nothing will be updated
            questions: req.body.questions, // if undefined, nothing will be updated
        }
    }).then(()=>{
        res.status(200).send(generateDataTransferObject({}, "Inspection updated successfully", "success"))
    }).catch((e)=>{
        res.status(500).send(generateDataTransferObject(e, "An error occured updating the inspection", "error"))
        captureException(e)
    })
}

export const getInspection: RequestHandler = async (req, res)=>{
    const parsed = z.string().uuid().safeParse(req.query.reservation_id)
    const reservation_id = parsed.success ? parsed.data : undefined

    if (!reservation_id) return res.status(400).send(generateDataTransferObject({}, "Invalid reservation id", "error"))
    return prismaClient.inspection.findUnique({
        where: {
            reservation_id
        }
    }).then((inspection)=>{
        res.status(200).send(generateDataTransferObject(inspection, "Inspection fetched successfully", "success"))
    }).catch((e)=>{
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching the inspection", "error"))
        captureException(e)
    })
}

export const createCashReservation: RequestHandler = async (req, res)=>{
    const headers = req.headers as WithUserHeaders 
    const { user_id } = headers 

    const parsed = tReservationSchema
    .extend({
        amount: z.number(),
    })
    .required({
        vehicle_id: true,
        start_date_time: true,
        end_date_time: true
    })
    .safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error.formErrors.fieldErrors, "Invalid body", "error"))

    const { vehicle_id, start_date_time, end_date_time, amount } = parsed.data


    try {

        const reservation = await prismaClient.$transaction(async (tx)=>{
            const payment = await tx.payment.create({
                data: {
                    amount,
                    user_id,
                    status: "REQUIRES_CONFIRMATION"
                }
            })

            const reservation = await tx.reservation.create({
                data: {
                    start_date_time: new Date(start_date_time),
                    end_date_time: new Date(end_date_time),
                    vehicle_id,
                    user_id,
                    payment_id: payment.id,
                    status: 'PENDING_CONFIRMATION',
                    inspection: {
                        create:{

                        }
                    },
                    payment_method: "CASH"
                }
            })

            return reservation
        }, {
            maxWait: 5000,
            timeout: 10000
        })


        res.status(201).send(generateDataTransferObject(reservation, "Reservation created successfully", "success"))

    } catch(e)
    {
        res.status(500).send(generateDataTransferObject(e, "An error occured creating the reservation", "error"))
        captureException(e)
    }




}

export const updateCashReservation: RequestHandler = async (req, res) => {
    const headers = req.headers as WithUserHeaders 
    const { user_id ,user_type } = headers 


    if (user_type !== "HOST") return res.status(400).send(generateDataTransferObject({}, "Only hosts can access this endpoint", "error"))

    const parsed = z.object({
        reservation_id: z.string().uuid(),
        status: z.enum(["APPROVED", "DENIED"]),
        payment_id: z.string().uuid(),
    }).safeParse(req.body)

    if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error.formErrors.fieldErrors, "Invalid body", "error"))

    const { reservation_id, status, payment_id } = parsed.data

    try {


        const customer_id = await prismaClient.$transaction(async (tx)=>{

            const payment = await tx.payment.update({
                where: {
                    id: payment_id
                },
                data: {
                    status: status === "APPROVED" ? "SUCCEEDED" : "FAILED",
                }
            })

            await tx.reservation.updateMany({
                where: {
                    id: reservation_id,
                    payment_id,
                    vehicle: {
                        user_id
                    }
                },
                data: {
                    status: status === "APPROVED" ? "UPCOMING" : "CANCELLED"
                }
            })

            return payment?.user_id
        })

        if (status === "APPROVED") {
            notifications.sendCashPaymentReservationApprovedNotification({
                user_id: customer_id,
                data: {
                    message: "Your payment has been approved; you can now pick up your vehicle",
                    extra: {
                        type: "cash_payment_approved",
                    },
                }
            })
        }

        if (status === "DENIED") {
            notifications.sendCashPaymentReservationDeniedNotification({
                user_id: customer_id,
                data: {
                    message: "Your payment has been refused by the vehicle host",
                    extra: {
                        type: "cash_payment_denied",
                    },
                }
            })
        }

        res.status(200).send(generateDataTransferObject({}, "Reservation updated successfully", "success"))

    }   
    catch (e)
    {
        res.status(500).send(generateDataTransferObject(e, "An error occured approving the reservation", "error"))
        captureException(e)
    }
    
}