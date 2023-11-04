import { WithUserHeaders } from "@middleware/withUser";
import prismaClient from "@prismaclient/client";
import { captureException } from "@sentry/node";
import generateDataTransferObject from "@utils/generateDto";
import { userQuerySchema } from "@validators/admin";
import { RequestHandler } from "express";


export const fetchUserData: RequestHandler = async (req, res) =>{
    const { user_id, role, user_type: current_user_type, email } = req.headers as unknown as Partial<WithUserHeaders>


    const parsed = userQuerySchema.safeParse(req.query) 

    if(!parsed.success) {
        res.status(400).send(parsed.error.formErrors.fieldErrors)
        return 
    }

    const query = parsed.data 

    const { market_id, sub_market_id, page, search, size, sort, sort_by, user_type} = query 


    try {
        const data = await prismaClient.user.findMany({
            where: {
                market_id: market_id,
                sub_market_id: sub_market_id,
                ...(user_type === "ADMIN" ? {
                    is_admin: true
                } : {
                    user_type
                }),
                ...(search ? {
                    OR: [
                        {
                            fname: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            lname: {
                                contains: search,
                                mode: "insensitive"
                            },
                        },
                        {
                            email: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            handle: {
                                contains: search,
                                mode: "insensitive"
                            }
                        }
                    ]
                }:{}),
                NOT: {
                    email: {
                        contains: "adopter"
                    }
                }
            },
            orderBy: {
                [sort_by]: sort
            },
            skip: (page - 1) * size,
            take: size,
            include: {
                market: {
                    select: {
                        name: true
                    }
                },
                sub_market: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        vehicle: true,
                        reservations: true, 
                        Payment: true,
                        withdrawals: true,
                        Payout: true
                    }
                },
            }
        })  

        const users = data?.map((user)=>{
            return {
                ...user,
                agg: {
                    ...user?._count,
                    vehicles: user?._count?.vehicle,
                }
            }
        })


        return res.status(200).send(generateDataTransferObject(users, "Successfully fetched users", "success"))
        
    } 
    catch (e)
    {
        captureException(e, (context)=>{
            return context
            .setTag("user_id", user_id)
            .setTag("role", role)
            .setTag("user_type", current_user_type)
            .setTag("email", email)
            .setExtra("query", query)

        })
        return res.status(500).send(e)
    }
}


export const fetchUser: RequestHandler = async (req, res) =>{
    const {user_id: admin_user_id, role, user_type} = req.headers as unknown as Partial<WithUserHeaders> 

    const parsed = userQuerySchema.safeParse(req.query)

    if(!parsed.success) {
        res.status(400).send(parsed.error.formErrors.fieldErrors)
        return 
    }

    const query = parsed.data

    const { user_id, email, handle, uid } = query 

    try {
        const data = await prismaClient.user.findFirst({
            where: {
                id: user_id,
                email,
                handle,
                uid
            },
            include: {
                market: {
                    select: {
                        name: true,
                        currency: true
                    }
                },
                sub_market: {
                    select: {
                        name: true,
                    }
                },
                _count: {
                    select: {
                        vehicle: true,
                        reservations: true,
                        Payment: true,
                        withdrawals: true,
                        Payout: true,
                    }
                }
            }
        })

        if(!data) return res.status(404).send(generateDataTransferObject(null, "User not found", "error"))

        const { user_type } = data


        const user = {
            ...data
        }

        return res.status(200).send(generateDataTransferObject(user, "Successfully fetched user", "success"))
    }
    catch (e) 
    {
        captureException(e,(context)=>{
            return context
            .setTag("role", role)
            .setTag("user_type", user_type)
            .setTag("admin_user_id", admin_user_id)
        })
    }
}