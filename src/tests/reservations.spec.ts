import prismaClient from "@prismaclient/client";
import { createToken } from "@utils/testutils/createToken";
import app from "src/app";
import request from 'supertest'
import assert from "assert"
import { generatePaymentAuthorizationToken } from "@utils/functions";
import { Inspection } from "@prisma/client";
import dayjs from 'dayjs'



let market_id: string;
let sub_market_id: string;
let station_id: string;
let host_token: string;
let customer_token: string;
let test_vehicle_id: string;
let new_reservation: string;
let customer_id: string;
let host_id: string;
let payment_auth: string;
let cash_reservation_id: string
let cash_payment_id: string


describe("Reservation", ()=>{

    before(async ()=>{
        host_token = await createToken("HOST") as string
        customer_token = await createToken("CUSTOMER") as string
        const market  = await prismaClient.market.create({
            data: {
                name: "test market",
                country: "test country",
                currency: "KES",
            }
        })
    
        const sub_market = await prismaClient.subMarket.create({
            data: {
                name: "test submarket",
                market_id: market.id,
            }
        })
    
        const host = await prismaClient.user.create({
            data: {
                fname: "jeff",
                lname: "bezos",
                handle: "HOST1",
                email: "jeff@email.com",
                user_type: "HOST",
                market_id,
                sub_market_id,
                uid: process.env.TEST_HOST_UID as string,
            }
        })

        host_id = host.id

        const customer = await prismaClient.user.create({
            data: {
                handle: "test customer",
                sub_market_id: sub_market.id,
                market_id: market.id,
                email: "bugsbunny@email.com",
                uid: process.env.TEST_CUSTOMER_UID as string,
                user_type: "CUSTOMER",
            }
        })

        customer_id = customer.id
    
    
        
    
        const station = await prismaClient.station.create({
            data: {
                name: "test station",
                user_id: host.id,
                sub_market_id: sub_market.id,
            }
        })
    
        await prismaClient.vehicle.createMany({
            data: [
                {
                    user_id: host.id,
                    station_id: station.id,
                    color: "red",
                    make: "toyota",
                    model: "corolla",
                    year: 2010,
                },
                {
                    user_id: host.id,
                    station_id: station.id,
                    color: "blue",
                    make: "toyota",
                    model: "corolla",
                    year: 2010,
                },
                {
                    user_id: host.id,
                    station_id: station.id,
                    color: "green",
                    make: "toyota",
                    model: "corolla",
                    year: 2010,
                }
            ]
        })
    
        const first_vehicle = await prismaClient.vehicle.findFirst({
            where: {
                user_id: host.id
            }
        })

        // create a dummy payment for the customer
        payment_auth = generatePaymentAuthorizationToken(customer_id, 300)
        const payment = await prismaClient.payment.create({
            data: {
                amount: 300,
                user_id: customer_id,
                authorization: payment_auth,
            }
        })
    
    
        test_vehicle_id = first_vehicle?.id as string
        market_id = market.id
        sub_market_id = sub_market.id
        station_id = station.id
    })
    

    describe("Create reservations", ()=>{
        it("should create a reservation", (done)=>{
            const start_date_time = new Date(new Date().toUTCString()).getTime() + 1000 * 60 * 60 * 5
            const end_date_time = new Date(new Date().toUTCString()).getTime() + 1000 * 60 * 60 * 6
            request(app). 
            post("/api/reservations")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-payment-authorization", payment_auth)
            .set("x-user", "CUSTOMER")
            .send({
                vehicle_id: test_vehicle_id,
                station_id: station_id,
                start_date_time: dayjs(start_date_time).format(),
                end_date_time: dayjs(end_date_time).format(),
            }).expect(201).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                new_reservation = res.body.data.id
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })
    })

    describe("Vehicle Inspection", () => { 
        it("Should be able to add questions", (done)=>{
            request(app).
            put("/api/reservations/inspection")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .query({
                reservation_id: new_reservation
            })
            .send({
                fuel: 10,
                questions: [
                    {
                        index: 1,
                        question: "Is available and present at location?",
                        option: "yes",
                        description: "Some description",
                        images: [
                          "https://neglected-mixer.net",
                          "https://threadbare-hardhat.com",
                          "https://metallic-distribution.net",
                          "http://authorized-noun.biz"
                        ]
                      },
                ]
            } as Partial<Inspection>).expect(200)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            }).catch(done)
        })

        it("Should be able to get the inspection for the created reservation", (done)=>{
            request(app).
            get("/api/reservations/inspection")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .query({
                reservation_id: new_reservation
            }).expect(200)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.questions.length, 1)
                done()
            }).catch(done)
        })
    })

    describe("Update reservation", ()=>{

        it("should update a reservation", (done)=>{
            request(app). 
            put("/api/reservations?reservation_id="+new_reservation)
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .send({
                end_date_time: dayjs(new Date(new Date().toUTCString()).getTime() + 1000 * 60 * 60 * 7).format(),
            }).expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })
        
    })

    describe("Get reservations", ()=>{

        it("Should get all reservations", (done)=>{
            request(app). 
            get("/api/reservations")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })

    })


    describe("Calendar", ()=>{
        it("should get calendar", (done)=>{
            request(app). 
            get("/api/reservations/calendar")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data?.events.length, 1)
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })

        it("should update calendar", (done)=>{
            request(app). 
            put("/api/reservations/calendar?event_id="+new_reservation)
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                status: "CANCELLED"
            }).expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })


    })


    describe("Create Cash Reservation", ()=>{
        it("should create a reservation", (done)=>{
            const start_date_time = new Date(new Date().toUTCString()).getTime() + 1000 * 60 * 60 * 5
            const end_date_time = new Date(new Date().toUTCString()).getTime() + 1000 * 60 * 60 * 6
            request(app). 
            post("/api/reservations/cash")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-payment-authorization", payment_auth)
            .set("x-user", "CUSTOMER")
            .send({
                vehicle_id: test_vehicle_id,
                start_date_time: dayjs(start_date_time).format(),
                end_date_time: dayjs(end_date_time).format(),
                amount: 300,
            }).expect(201).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                cash_reservation_id = res.body.data.id
                cash_payment_id = res.body.data.payment_id
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })
    })


    describe("Approve Cash Reservation", ()=>{
        it("should approve the reservation", (done)=>{
            request(app). 
            put("/api/reservations/cash")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                reservation_id: cash_reservation_id,
                status: "APPROVED",
                payment_id: cash_payment_id,
            }).expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            }) 
        })
    })

    after(async ()=>{

         // delete the inspection for the reservation
        await prismaClient.inspection.deleteMany({
            where: {
                reservation: {
                    user_id: customer_id
                }
            }
        })

        // delete reservations made by the customer
        await prismaClient.reservation.deleteMany({
            where: {
                user_id: customer_id
            }
        })
    
        // delete the vehicles created by the host
        await prismaClient.vehicle.deleteMany({
            where: {
                host: {
                    id: host_id
                }
            }
        })
    
        // delete the station
        await prismaClient.station.deleteMany({
            where: {
                user_id: host_id
            }
        })
    
        // delete the payments
        await prismaClient.payment.deleteMany({
            where: {
                user_id: customer_id
            }
        })
    
        
    
        //delete all users
        await prismaClient.user.deleteMany({
            where: {
                id: {
                    in: [
                        customer_id,
                        host_id
                    ]
                }
            }
        })
         
    
        // delete the  submarket
        await prismaClient.subMarket.deleteMany({
            where: {
                id: sub_market_id
            }
        })
    
        // delete market
        await prismaClient.market.deleteMany({
            where: {
                id: market_id
            }
        })
    
        
    })

})


