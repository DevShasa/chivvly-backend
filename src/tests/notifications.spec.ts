import prismaClient from "@prismaclient/client";
import { generateAppJWT, genUTCEpoch } from "@utils/functions";
import { createToken } from "@utils/testutils/createToken";
import notifications, { notification_event_names } from "src/notifications";
import assert from 'assert'
import request from 'supertest'
import app from "src/app";
import { isEmpty, isNull } from "lodash";

let customer_id: string;
let host_id: string;
let host_token: string;
let customer_token: string;
let market_id: string;
let submarket_id: string;
let station_id: string;
let vehicle_id: string;
let reservation_id: string;
let settings_id: string;
let bot_token: string;

describe("Notifications", () => {

    // setup
    before(async ()=> {
        host_token = await createToken("HOST") as string
        customer_token = await createToken("CUSTOMER") as string
        bot_token = generateAppJWT({
            user_id: "bot",
            user_type: "bot"
        })

        const market = await prismaClient.market.create({
            data: {
                name: "Test Market",
                country: "US",
                currency: "USD",
                SubMarket: {
                    create: {
                        name: "Test Submarket",
                    }
                }
            },
            include: {
                SubMarket: true
            }
        })

        market_id = market.id
        submarket_id = market.SubMarket[0].id


        const host = await prismaClient.user.create({
            data: {
                email: "jeff@email.com",
                handle: "jeff",
                uid: process.env.TEST_HOST_UID as string,
                user_type: "HOST",
                market_id: market_id,
                sub_market_id: submarket_id,
            }
        })

        host_id = host.id

        const customer = await prismaClient.user.create({
            data: {
                email: "bugsbunny@email.com",
                uid: process.env.TEST_CUSTOMER_UID as string,
                handle: "bugs",
                user_type: "CUSTOMER",
                user_settings: {
                    create: {
                        notifications_enabled: false,
                    },
                },
            },
            include: {
                user_settings: true
            }
        })

        settings_id  = customer.user_settings?.id as string

        customer.user_settings?.id && await prismaClient.pushToken.create({
            data: {
                token: "test_token",
                user_settings_id: settings_id
            }
        })

        customer_id = customer.id

        const station = await prismaClient.station.create({
            data: {
                name: "Test Station",
                user_id: host_id,
                sub_market_id: submarket_id,
                vehicle: {
                    create: {
                        make: "Tesla",
                        model: "Model 3",
                        color: "Red",
                        host: {
                            connect: {
                                id: host_id
                            }
                        },
                        hourly_rate: 10,
                        seats: 4,
                        year: 2020,
                        plate: "ABC123",
                        transmission: "MANUAL",
            
                    }
                }
            },
            include: {
                vehicle: true
            }
        })

        

        station_id = station.id
        vehicle_id = station.vehicle?.[0].id 

        // create reservations
        const reservation  = await prismaClient.reservation.create({
            data: {
                end_date_time: new Date(genUTCEpoch(new Date(Date.now() + 1000 * 60))),
                start_date_time: new Date(genUTCEpoch(new Date(Date.now() + 1000 * 60 * 5))),
                user_id: customer_id,
                vehicle_id: vehicle_id,
            }
        })


        reservation_id = reservation.id 
        
    })




    // tests
    describe("Notification tests",()=>{
        describe("Onboarding tests", ()=>{

            it("should send out onboarding notification events to customers", (done)=>{
                notifications.on(notification_event_names.send_complete_onboarding_customer, (data)=>{
                    assert(!isEmpty(data))
                    notifications.removeListener(notification_event_names.send_complete_onboarding_customer, ()=>{
                        done()
                    })
                    done()
                })

                request(app)
                .post("/api/notifications/customer-onboarding-scan")
                .set("Authorization", `Bearer ${bot_token}`)
                .expect(200)
                .catch((e)=>{
                    console.log(e)
                    done(e)
                })

            })

            it("should send out onboarding notification events to hosts", (done)=>{
                notifications.on(notification_event_names.send_complete_onboarding_host, (data)=>{
                    assert.strictEqual(data.to, "jeff@email.com")
                    done()
                })

                request(app)
                .post("/api/notifications/host-onboarding-scan")
                .set("Authorization", `Bearer ${bot_token}`)
                .expect(200)
                .catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })


        })

        describe("Authcode notifications", ()=>{

            it("should send out authcode notifications to host on authcode request", (done)=>{

                notifications.on(notification_event_names.send_to_host_new_authcode_request, (data)=>{
                    assert(data.to, "jeff@email.com")
                    done()
                })

                request(app)
                .post("/api/authcodes/request")
                .set("Authorization", `Bearer ${customer_token}`)
                .set("x-user", "CUSTOMER")
                .send({
                    vehicle_id: vehicle_id,
                    host_id
                }).expect(201)
                .catch((e)=>{
                    console.log(e)
                    done(e)
                })  

            })

            it("should send out authcode notifications to the customer on authcode granted", (done)=>{

                notifications.on(notification_event_names.send_auth_code_request_granted, (data)=>{
                    assert(data.user_id === customer_id)
                    done()
                })

                prismaClient.authCode.findFirst({
                    where: {
                        host_id
                    }
                }).then((code)=>{
                    if(isNull(code)){
                        done(new Error("No authcode found"))
                    }else{
                        request(app)
                        .post("/api/authcodes")
                        .query({
                            auth_code_id: code?.id
                        })
                        .set("Authorization", `Bearer ${host_token}`)
                        .set("x-user", "HOST")
                        .expect(200)
                        .catch((e)=>{
                            console.log(e)
                            done(e)
                        })
                    }
                })

                

            })

        })

        describe("Reservation reminders", ()=>{
            it("should send out reservation reminders to the customer", (done)=>{
                notifications.on(notification_event_names.send_reservation_reminder, (data)=>{
                    assert(data.user_id === customer_id)
                    done()
                })

                request(app)
                .post("/api/notifications/reservation-reminders")
                .set("Authorization", `Bearer ${bot_token}`)
                .expect(200)
                .catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })
        })
    })



    // teardown
    after(async ()=>{
        reservation_id && await prismaClient.reservation.delete({
            where: {
                id: reservation_id
            }
        })

        customer_id && await prismaClient.authCode.deleteMany({
            where: {
                user_id: customer_id
            }
        })

        vehicle_id && await prismaClient.vehicle.delete({
            where: {
                id: vehicle_id
            }
        })

        station_id && await prismaClient.station.delete({
            where: {
                id: station_id
            }
        })

        settings_id && await prismaClient.pushToken.deleteMany({
            where: {
                user_settings_id: settings_id
            }
        })

        settings_id && await prismaClient.userSettings.delete({
            where: {
                id: settings_id
            }
        })

        

        customer_id && await prismaClient.user.delete({
            where: {
                id: customer_id
            }
        })

        host_id && await prismaClient.user.delete({
            where: {
                id: host_id
            }
        })

        submarket_id && await prismaClient.subMarket.delete({
            where: {
                id: submarket_id
            }
        })

        market_id && await prismaClient.market.delete({
            where: {
                id: market_id
            }
        })


    })

})