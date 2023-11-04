import { RequestHandler } from "express";
import prismaClient from "@prismaclient/client";
import { UserType } from "@prisma/client"
import generateDataTransferObject from "@utils/generateDto";
import { acceptInviteSchema, createInviteSchema, tUser, tUserDriverCredentials } from "@validators/user"
import { createCustomer } from "@utils/stripe/actions";
import { isEmpty, isNull, merge } from "lodash"
import { appUserTypes } from "@utils/constants";
import { auth } from "src/config/firebase/firebaseConfig";
import notifications from "src/notifications";
import { generateInviteCode, generateRandomDefaultPassword, generateRandomPlaceholderHandle } from "@utils/functions";
import { captureException } from "@sentry/node";



export const createNewUser:RequestHandler = async(req, res)=>{
    await tUser
    .required({
        email: true,
        handle: true,
        user_type: true,
    })
    .parseAsync(req.body).then(async (userData)=>{
        const firebase_uid = req.headers.uid  as unknown as string
        let customer_id;

        if (userData.user_type === "CUSTOMER") {
            try {
                const customer = await createCustomer(userData)
                customer_id = customer.id
            } catch (e) {
                captureException(e)
                return res.status(500).send(generateDataTransferObject(e, "An error occured creating the user", "error"))
            }
            
        }
        
            
            return await prismaClient.user.create({
                data: {
                    ...userData,
                    uid: firebase_uid,
                    user_settings: {
                        create: {
                            notifications_enabled: false
                        }
                    },
                    customer_id: userData.user_type === "CUSTOMER" ? customer_id : undefined,
                    ...(
                        userData.user_type === "CUSTOMER" ? {
                            DriverCredentials: {
                                create: {
                                    is_verified: false
                                } 
                            }
                        }: null
                    )
                }
            }).then(({id})=>{
                
                res.status(201).send(generateDataTransferObject(
                    {
                        id,
                    },
                    "User created successfully",
                    "success"
                ))
            }).catch((e)=>{
                captureException(e)
                res.status(500).send(generateDataTransferObject(
                    e,
                    "An error occured creating the user",
                    "error"
                ))
            })
 
        
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid data provided", "error"))
    })
    
}




export const updateUserDetails:RequestHandler = async (req, res)=>{
    const user_type = req.headers.user_type as unknown as UserType
    await tUser.parseAsync(req.body).then(async (userUpdateData)=>{
        const firebase_uid = req.headers.uid  as unknown as string
        await prismaClient.user.update({
            where: {
                uid: firebase_uid
            },
            data:  userUpdateData,
            include: {
                user_settings: true,
                DriverCredentials: user_type === appUserTypes.customer,
                market: true,
                sub_market: true,
                payment_types: true,
                PayoutMethod: user_type === appUserTypes.host,
            }
        }).then((updatedInfo)=>{

            const stringified = JSON.stringify(updatedInfo, (key, value)=>{
                if (typeof value === 'bigint') return value.toString()
                return value
            })

            const updatedInfoParsed = JSON.parse(stringified)
            res.status(200).send(generateDataTransferObject(updatedInfoParsed, "User updated successfully", "success"))
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured updating the user", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid data", "error"))
    })

}


export const getUserDetails:RequestHandler = async (req, res)=>{
    const firebase_uid = req.headers.uid as unknown as string
    const user_type = req.headers.user_type as unknown as UserType
    const role  = req.headers.role as 'admin' | 'user'
    const handle = req.query.handle as unknown as string

    if (handle) {
        /**
         * @description - This is used to check if a handle is taken or not
         */
        await prismaClient.user.findFirst({
            where: {
                handle
            },
            select: {
                handle: true
            }
        }).then((data)=>{
            if (isNull(data)) {
                res.status(200).send(generateDataTransferObject({
                    isHandleTaken: false,
                }, "Fetched successfully", "success"))
            }else {
                res.status(200).send(generateDataTransferObject({
                    isHandleTaken: true,
                }, "Fetched successfully", "success"))
            }
            
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured fetching the user", "error"))
        })
    }else {
        await prismaClient.user.findUniqueOrThrow({
            where: {
                uid: firebase_uid
            },
            include: {
                user_settings: true,
                DriverCredentials: user_type === appUserTypes.customer,
                market: true,
                sub_market: true,
                payment_types: {
                    where: {
                        status: {
                            not: 'NONACTIVE'
                        }
                    }
                },
                PayoutMethod: user_type === appUserTypes.host ? {
                    where: {
                        status: {
                            not: "INACTIVE"
                        }
                    }
                } : undefined,
                sent_invites: user_type === appUserTypes.host && role === "admin",
            }
        }).then(async (data)=>{
            const earnings = {
                all_time: 0,
                available: 0,
            }
            if (user_type === "HOST"){
                const all_time_payments_agg = await prismaClient.payment.aggregate({
                    where: {
                        Reservation: {
                            vehicle: {
                                host: {
                                    id: data.id
                                }
                            }
                        },
                        status: "SUCCEEDED",
                        amount: {
                            gte: 0
                        }
                    } ,
                    _sum:{
                        amount: true
                    }  
                })

                const all_time_payouts_agg = await prismaClient.payout.aggregate({
                    where: {
                        user_id: data.id,
                        status: "SUCCEEDED",
                        amount: {
                            gte: 0
                        },
                    },
                    _sum: {
                        amount: true
                    }
                })

                const all_pending_withdrawals = await prismaClient.withdrawal.aggregate({
                    where: {
                        user_id: data.id,
                        status: "PENDING"
                    },
                    _sum: {
                        amount: true
                    }
                })

                const all_time = all_time_payments_agg._sum.amount ?? 0
                const available = all_time - ((all_time_payouts_agg._sum.amount ?? 0) + (all_pending_withdrawals._sum.amount ?? 0))
                earnings.all_time = all_time
                earnings.available = available
            }

            const final_data = merge(data, {
                earnings
            })
            
            const stringified = JSON.stringify(final_data, (key, value)=>{
                if (typeof value === 'bigint') return value.toString()
                return value
            })
            res.status(200).send(generateDataTransferObject(JSON.parse(stringified), "Fetched successfully", "success"))
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured fetching the user", "error"))
        })
    }
    
}


export const onBoarding: RequestHandler = async (req, res) => {
     const user_type = req.headers.user_type as unknown as UserType
     const uid = req.headers.uid as unknown as string

     if (user_type === appUserTypes.customer) {
        return await prismaClient.user.findUnique({
            where: {
                uid
            },
            include: {
                DriverCredentials: true,
                payment_types: true,
            }
        }).then((userData)=>{
            if(isEmpty(userData) || isNull(userData)) return res.status(404).send(generateDataTransferObject(null, "User not found", "error"))
            const onboardingProgress = {
                completed: {
                    // drivers_license: isEmpty(userData?.DriverCredentials?.drivers_licence_back) || isEmpty(userData?.DriverCredentials?.drivers_licence_front) ? false : true,
                    drivers_license: true,
                    // payment_method: isEmpty(userData?.payment_types) ? false : true,
                    payment_method: true,
                    location: isEmpty(userData?.market_id) || isEmpty(userData?.sub_market_id) ? false : true,
                    profile: !isEmpty(userData?.fname) && !isEmpty(userData?.lname)
                }
                
            }
            return res.status(200).send(generateDataTransferObject(onboardingProgress, "Fetched successfully", "success"))
        }).catch((e)=>{
            captureException(e)
            return res.status(500).send(generateDataTransferObject(e, "An error occured fetching the user", "error"))
        })
     }

     if (user_type === appUserTypes.host) {
        return await prismaClient.user.findUnique({
            where: {
                uid
            },
            include: {
                PayoutMethod: true,
            }
        }).then((data)=>{
            const onboardingProgress = {
                completed: {
                    location: isEmpty(data?.market_id) || isEmpty(data?.sub_market_id) ? false : true,
                    payout_method: data?.is_admin ? true : isEmpty(data?.PayoutMethod) ? false : true,
                    profile: !isEmpty(data?.profile_pic_url) && !isEmpty(data?.fname) && !isEmpty(data?.lname) && !isEmpty(data?.handle)
                }
            }
            return res.status(200).send(generateDataTransferObject(onboardingProgress, "Fetched successfully", "success"))
       }).catch((e)=>{
        captureException(e)
        return res.status(500).send(generateDataTransferObject(e, "An error occured fetching the user", "error"))
       })
     }

     // Probably won't be needed
     return res.status(400).send(generateDataTransferObject(null, "Invalid user type", "error"))
}

export const updateDriversLicense: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as unknown as string
    tUserDriverCredentials.required({
        drivers_licence_front: true,
        drivers_licence_back: true
    }).parseAsync(req.body).then(async (data)=>{
        await prismaClient.driverCredentials.update({
            where: {
                user_id
            },
            data
        }).then((updated)=>{
            res.status(200).send(generateDataTransferObject(updated, "Updated successfully", "success"))
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured updating the user", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid data", "error"))
    })
}

export const createInvite: RequestHandler  = async (req, res) => {
    const user_id = req.headers.user_id as unknown as string
    
    return await createInviteSchema.parseAsync(req.body).then(async (data)=>{
        const default_password = generateRandomDefaultPassword()
        auth?.host?.createUser({
            email: data.email,
            emailVerified: true,
            password: default_password
        }).then((user)=>{
            auth?.host?.setCustomUserClaims(user.uid, {
                admin: true
            }).then(()=>{
                const code = generateInviteCode()
                prismaClient.invitation.create({
                    data: {
                        email: data.email,
                        uid: user.uid,
                        code,
                        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now { exact time will have to be determined later on }
                        sender_id: user_id // the user who sent the invite
                    }
                }).then((invite)=>{
                    notifications.sendAdminInviteEmail({
                        data: {
                            email: data.email,
                            invite_code: code,
                            invite_link: `${process.env.CONTROL_PANEL_URL}/admin/invite?code=${code}`,
                            password: default_password,
                            user_name: data.email
                        },
                        subject: "You have been invited as an admin to our platform",
                        template: "admin-invite",
                        to: data.email
                    })
                    res.status(200).send(generateDataTransferObject(invite, "Invite created successfully", "success"))
                }).catch((e)=>{
                    captureException(e)
                    res.status(500).send(generateDataTransferObject(e, "An error occured inviting the user", "error"))
                })
            }).catch((e)=>{
                captureException(e)
                res.status(500).send(generateDataTransferObject(e, "An error occured creating the user", "error"))
            })
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured creating the user", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid data", "error"))
    })


}

export const acceptInvite: RequestHandler = async (req, res) => {
    return await acceptInviteSchema.parseAsync(req.query).then((data)=>{
        prismaClient.invitation.findFirst({
            where: {
                code: data.code,
                expires_at: {
                    gte: new Date()
                },
                activated: false
            }
        }).then(async (invite)=>{
            if(isNull(invite)) return res.status(404).send(generateDataTransferObject(null, "Invite not found", "error"))
            await prismaClient.invitation.update({
                where: {
                    id: invite.id
                },
                data: {
                    activated: true
                }
            }).then(async (updatedInvite)=>{
                await prismaClient.user.findUnique({
                    where: {
                        uid: updatedInvite.uid
                    }
                }).then(async (data)=>{

                    const token = await auth.host?.createCustomToken(updatedInvite.uid, {
                        admin: true
                    })

                    if(isNull(data)){
                        await prismaClient.user.create({
                            data: {
                                uid: updatedInvite.uid,
                                email: updatedInvite.email,
                                user_type: appUserTypes.host as UserType,
                                is_admin: true,
                                handle: generateRandomPlaceholderHandle() // The user can update this later,
                            }
                        }).then(()=>{
                            res.status(200).send(generateDataTransferObject(token, "Invite accepted successfully", "success"))
                        }).catch((e)=>{
                            captureException(e)
                            res.status(500).send(generateDataTransferObject(e, "An error occured accepting the invite", "error"))
                        })
                    }else{
                        await prismaClient.user.update({
                            where: {
                                email: updatedInvite.email
                            },
                            data: {
                                uid: updatedInvite.uid,
                                email: updatedInvite.email,
                                user_type: appUserTypes.host as UserType,
                                is_admin: true,
                                handle: generateRandomPlaceholderHandle() // The user can update this later,
                            }
                        }).then(()=>{
                            res.status(200).send(generateDataTransferObject(token, "Invite accepted successfully", "success"))
                        }).catch((e)=>{
                            captureException(e)
                            res.status(500).send(generateDataTransferObject(e, "An error occured accepting the invite", "error"))
                        })
                    }
                }).catch((e)=>{
                    captureException(e)
                    res.status(500).send(generateDataTransferObject(e, "An error occured accepting the invite", "error"))
                })
                
            }).catch((e)=>{
                captureException(e)
                res.status(500).send(generateDataTransferObject(e, "An error occured accepting the invite", "error"))
            })
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured fetching the invite", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid data", "error"))
    })
}


export const getDashboardData: RequestHandler = async (req, res) => {
    const user_id = req.headers.user_id as unknown as string 
    const role = req.headers.role as 'admin' | 'user' // TODO: add implementations for this


    try {
        const upcoming_reservations = await prismaClient.reservation.findMany({
            where: {
                vehicle: {
                    host: {
                        id: user_id
                    }
                },
                status: "UPCOMING",
                NOT: {
                    type: "BLOCK"
                }
            },
            orderBy: {
                created_at: "desc"
            },
            take: 5,
            include: {
                user: true,
                vehicle: true,
                payment: true
            }
        })

        const recently_added_vehicles = await prismaClient.vehicle.findMany({
            where: {
                host: {
                    id: user_id
                },
                status: "ACTIVE",
            },
            take: 4,
            orderBy: {
                created_at: "desc"
            }
        })

        const recent_withdrawal_requests = await prismaClient.withdrawal.findMany({
            where: {
                user_id
            },
            take: 5,
            orderBy: {
                created_at: "desc"
            }   
        })

        const map_vehicles = await prismaClient.vehicle.findMany({
            where: {
                host: {
                    id: user_id
                }
            },
            include: {
                station: true,
                host: true,
            }
        })


        const dashboard_data = {
            vehicles: recently_added_vehicles,
            reservations: upcoming_reservations,
            withdrawal_requests: recent_withdrawal_requests,
            map_vehicles
        }

        res.status(200).send(generateDataTransferObject(dashboard_data, "Fetched successfully", "success"))
        
    } 
    catch (e) 
    {
        captureException(e, (scope)=>{
            return scope.setTag("user_id", user_id)
            .setTag("role", role)
            .setTag("function", "getDashboardData")
        })
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching the dashboard data", "error"))
    }
}