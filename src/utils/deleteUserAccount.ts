import "dotenv/config"
import prismaClient from "@prismaclient/client"
import { isEmpty, isNull } from "lodash"
import { auth } from "src/config/firebase/firebaseConfig"
import readline from 'node:readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async ()=>{
    try {
        const email = await rl.question("Enter the user's email::")
        rl.close()
        // deleting user account
        console.log("This is gonna take a while ...")
        // get the user first from the database
        const user = await prismaClient.user.findFirst({
            where: {
                email: email
            },
            include: {
                AuthCodeTable: true,
                DriverCredentials: true,
                user_settings: {
                    include: {
                        PushToken: true
                    }
                },
                withdrawals: true,
                reservations: true,
                vehicle: true,
                payment_types: true,
                PayoutMethod: true,
                Payout: true,
                sent_invites: true,
                Payment: true,
                AuthCodeUser: true,
                market: true,
                sub_market: true,
                issued_payouts: true
                
            }
        })
    
        if(isEmpty(user)) return console.log("User not found")

        console.log("Deleting user", user?.email, "...")

        switch(user?.user_type){
            case "CUSTOMER":{
    
                // get adopter for this market 
                const adopter = await prismaClient.user.findFirst({
                    where: {
                        market_id: user?.market_id,
                        handle: `customeradopter${user?.market?.name}`
                    }
                })
    
                if(isNull(adopter)) return console.log("Adopter not found for", user?.market?.name, "Please create one first")
    
    
                // delete all the user's reservations
                await prismaClient.reservation.updateMany({
                    where: {
                        user_id: user?.id
                    },
                    data: {
                        user_id: adopter?.id
                    }
                })

                console.log(":::Deleted user's reservations")
    
                // delete the user's authcode records
                for (const authcode of user.AuthCodeUser){
                    await prismaClient.authCode.delete({
                        where: {
                            id: authcode.id
                        }
                    })
                }

                console.log(":::Deleted user's authcodes")
    
                // start with the payments made by the user
                await prismaClient.payment.updateMany({
                    where: {
                        user_id: user.id
                    },
                    data: {
                        user_id: adopter?.id
                    }
                })

                console.log(":::Deleted user's payments")
    
                // update the user's payment types
    
                await prismaClient.paymentTypes.updateMany({
                    where: {
                        user_id: user.id
                    },
                    data: {
                        user_id: adopter?.id
                    }
                })

                console.log(":::Deleted user's payment types")
    
                // delte the user's push tokens 
                await prismaClient.pushToken.deleteMany({
                    where: {
                        user_settings: {
                            user_id: user.id
                        }
                    }
                })

                console.log(":::Deleted user's push tokens")
                
    
                // delete the user's settings 
                await prismaClient.userSettings.delete({
                    where: {
                        user_id: user.id
                    }
                })

                console.log(":::Deleted user's settings")
    
                // delete the user's driver credentials
                await prismaClient.driverCredentials.delete({
                    where: {
                        user_id: user.id
                    }
                })

                console.log(":::Deleted user's driver credentials")
    
                // delete the user's issues 
                await prismaClient.issue.deleteMany({
                    where: {
                        user_id: user.id
                    }
                })

                console.log(":::Deleted user's issues")
    
                // delete the user's authcode records
                await prismaClient.authCode.deleteMany({
                    where: {
                        user_id: user.id
                    }
                })

                console.log(":::Deleted user's authcodes")
    
                // update any payouts | refunds made to the user
               await prismaClient.payout.updateMany({
                    where: {
                        user_id: user.id
                    },
                    data: {
                        user_id: adopter?.id
                    }
               })

                console.log(":::Deleted user's payouts")
                
               
               // delete the user 
               await prismaClient.user.delete({
                   where: {
                       id: user.id
                    }
                })

                console.log(":::Deleted user")
                
                await auth?.customer?.deleteUser(user.uid)
                console.log(`
                    Deleted user ${user.email}::
                    - payment types
                    :: reassigned to ${adopter?.handle}
                    - reservations
                    :: reassigned to ${adopter?.handle}
                    - authcodes
                    :: deleted
                    - push tokens
                    :: deleted
                    - user settings
                    :: deleted
                    - payouts
                    :: reassigned to ${adopter?.handle}
                    - driver credentials
                    :: deleted
                    - issues
                    :: deleted
                `)
    
                break;
            }
            case "HOST": {
    
                if(user?.is_admin){
    
                    await prismaClient.invitation.deleteMany({
                        where: {
                            sender_id: user?.id
                        }
                    })

                    console.log(":::Deleted user's invites")
    

                    console.log(":::Deleted user's issued payouts")

                    // delete user settings
                    await prismaClient.userSettings.deleteMany({
                        where: {
                            user_id: user?.id
                        }
                    })

                    // delete payouts 
                    await prismaClient.withdrawal.deleteMany({
                        where: {
                            user_id: user?.id
                        }
                    })

                    // delete user withdrawals 
                    await prismaClient.withdrawal.deleteMany({
                        where: {
                            user_id: user?.id
                        }
                    })

                    // delete user payout methods 
                    await prismaClient.payoutMethod.deleteMany({
                        where: {
                            user_id: user?.id
                        }
                    })

                    // delete user stations 
                    await prismaClient.station.deleteMany({
                        where: {
                            user_id: user?.id
                        }
                    })


                    // delete authcodes 
                    await prismaClient.authCode.deleteMany({
                        where: {
                            vehicle: {
                                host: {
                                    id: user?.id
                                }
                            }
                        }
                    })
    
                    // delete admin vehicles 
                    await prismaClient.vehicle.deleteMany({
                        where: {
                            host: {
                                id: user?.id
                            }
                        }
                    })



                    
                    // delete the user
                    await prismaClient.user.delete({
                        where: {
                            id: user?.id
                        }
                    })

                    
                    // delete the user from firebase 
                    await auth?.host?.deleteUser(user?.uid) 
    
                    console.log(`
                        Deleted user ${user?.email}::
                        - invites
                    `)
                } else {
                    if (user?.market_id === null) return console.log("User has no market")
                    const adopter = await prismaClient.user.findFirst({
                        where: {
                            market: {
                                id: user?.market_id
                            }
                        }
                    })
    
                    if(isNull(adopter)) return console.log("Adopter not found for", user?.market?.name, "Please create one first")
    
                    // reassign the user's stations 
                    await prismaClient.station.updateMany({
                        where: {
                            user_id: user?.id
                        },
                        data: {
                            user_id: adopter?.id
                        }
                    })

                    console.log(":::Deleted user's stations")
    
                    // reassign the user's vehicles
                    await prismaClient.vehicle.updateMany({
                        where: {
                            user_id: user?.id
                        },
                        data: {
                            user_id: adopter?.id
                        }
                    })

                    console.log(":::Deleted user's vehicles")
    
                    // reassign the user's payout methods
    
                    await prismaClient.payoutMethod.updateMany({
                        where: {
                            user_id: user?.id
                        },
                        data: {
                            user_id: adopter?.id
                        }
                    })

                    console.log(":::Deleted user's payout methods")
    
                    // reassign the user's payouts 
                    await prismaClient.payout.updateMany({
                        where: {
                            user_id: user?.id
                        },
                        data: {
                            user_id: adopter?.id
                        }
                    })

                    console.log(":::Deleted user's payouts")
    
                    // reassign the user's withdrawals
                    await prismaClient.withdrawal.updateMany({
                        where: {
                            user_id: user?.id
                        },
                        data: {
                            user_id: adopter?.id
                        }
                    })

                    console.log(":::Deleted user's withdrawals")
    
                    
                    
                    // reassign the user's authcodes
                    await prismaClient.authCode.updateMany({
                        where: {
                            host_id: user?.id
                        },
                        data: {
                            host_id: adopter?.id
                        }
                    })
                    
                    console.log(":::Deleted user's authcodes")
                    
                    // delete the user's push tokens
                    await prismaClient.pushToken.deleteMany({
                        where: {
                            user_settings: {
                                user_id: user?.id
                            }
                        }
                    })
                    
                    console.log(":::Deleted user's push tokens")
                    
                    // delete the user's settings
                    await prismaClient.userSettings.deleteMany({
                        where: {
                            user_id: user?.id
                        }
                    })

                    console.log(":::Deleted user's settings")
                    
                    // delete the user
                    await prismaClient.user.delete({
                        where: {
                            id: user?.id
                        }
                    })
                    
                    // delete the user from firebase 
                    await auth?.host?.deleteUser(user?.uid)
                    console.log(`
                        Deleted user ${user?.email}::
                        - stations
                        :: reassigned to ${adopter?.handle}
                        - vehicles
                        :: reassigned to ${adopter?.handle}
                        - payouts
                        :: reassigned to ${adopter?.handle}
                        - withdrawals
                        :: reassigned to ${adopter?.handle}
                        - payout methods
                        :: reassigned to ${adopter?.handle}
                        - user settings
                        :: deleted
                        - authcodes
                        :: reassigned to ${adopter?.handle}
                        - push tokens
                        :: deleted
                    `)
    
                }
                break;
            }
            default:
                break;
        }
    } catch(e) 
    {
        console.log(e)
        rl.close()
    }

})()