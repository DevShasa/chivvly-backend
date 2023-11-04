import prismaClient from "@prismaclient/client";
import { generateRandomPlaceholderHandle, isPaymentAuthorizationTokenValid, timeSleep } from "@utils/functions";
import { createToken } from "@utils/testutils/createToken";
import request from 'supertest';
import assert from "assert"
import app from "src/app";
import { isNull } from "lodash";
import { createAPIKey, createMTNUser } from "@utils/mtn/scripts/create";
import crypto from 'crypto'


let customer_token: string;
let customer_id: string;
let host_id: string;
let market_id: string;
let sub_market_id: string;
let station_id: string;
let vehicle_id: string;
let admin_token: string;
let admin_id: string;
let payment_auth: string;
let payment_type_id: string;
let host_token: string;

describe('MTN Momo intergration test', ()=>{
    // setup
    before(async  ()=>{
        host_token = (await createToken("HOST")) as string 
        customer_token = (await createToken("CUSTOMER")) as string
        admin_token = (await createToken("HOST", true)) as string
        // create a market, mtn's test currency has to specifically be EUR
        const market = await prismaClient.market.create({
            data: {
                name: "test market",
                country: "A country in europe",
                currency: "EUR",
            }
        })

        market_id = market.id

        // create a submarket
        const sub_market = await prismaClient.subMarket.create({
            data: {
                name: "test sub market",
                market_id: market.id
            }
        })

        sub_market_id = sub_market.id

        // create a host
        const host = await prismaClient.user.create({
            data: {
                uid: process.env.TEST_HOST_UID as string,
                email: "jeff@email.com",
                handle: generateRandomPlaceholderHandle(),
                user_type: "HOST",
                fname: "jeff",
                lname: "bezos",
                market_id: market.id,
                sub_market_id: sub_market_id
            }
        })

        // create a payout method for the host 
        await prismaClient.payoutMethod.create({
            data: {
                user_id: host.id,
                mobile_money_number: "0735644121" as string, // this is just a random number
                type: "MTN",
                verified: true,
                status: "ACTIVE",
            }
        })

        // create an admin
        const admin = await prismaClient.user.create({
            data: {
                uid: process.env.TEST_ADMIN_UID as string,
                email: "admin@email.com",
                handle: generateRandomPlaceholderHandle(),
                user_type: "HOST",
                is_admin: true,
                fname: "admin",
                lname: "admin",
                market_id: market.id,
                sub_market_id: sub_market_id,
            }
        })

        admin_id = admin.id

        // create a station
        const station = await prismaClient.station.create({
            data: {
                name: "This is a test station",
                user_id: host.id,
                description: "This is a test station",
                sub_market_id: sub_market_id,
            }
        })

        station_id = station.id

        // create a vehicle in the station
        const vehicle = await prismaClient.vehicle.create({
            data: {
                color: "red",
                make: "Toyota",
                model: "Corolla",
                plate: "KCK 123",
                station_id: station.id,
                hourly_rate: 50,
                user_id: host.id,
                seats: 4
            }
        })

        vehicle_id = vehicle.id

        // a customer who will rent the vehicle
        const customer = await prismaClient.user.create({
            data: {
                uid: process.env.TEST_CUSTOMER_UID as string,
                email: "customer@divvly.io",
                handle: generateRandomPlaceholderHandle(),
                user_type: "CUSTOMER",
                fname: "customer",
                lname: "customer",
                market_id: market.id,
                sub_market_id: sub_market_id
            }
        })

        host_id = host.id
        customer_id = customer.id

        //give the customer a payment type
        const payment_type = await prismaClient.paymentTypes.create({
            data: {
                phone_number: parseInt("0771423121"), // a random number
                user_id: customer.id,
                type: "MTN",
            }
        })

        payment_type_id = payment_type.id


        // Create and mtn api user and get them an api key
        const mtn_disbursement_api_user = await createMTNUser("disbursement")
        const mtn_collection_api_user = await createMTNUser("collection")

        // get them api keys
        const mtn_disbursement_api_key = await createAPIKey(mtn_disbursement_api_user)
        const mtn_collection_api_key = await createAPIKey(mtn_collection_api_user)

        // set env variables
        process.env.MTN_COLLECTION_USER_ID = mtn_collection_api_user.reference_id
        process.env.MTN_DISBURSEMENT_USER_ID = mtn_disbursement_api_user.reference_id
        process.env.MTN_COLLECTION_API_KEY = mtn_collection_api_key
        process.env.MTN_DISBURSEMENT_API_KEY = mtn_disbursement_api_key
        process.env.APP_ENV = "testing"
        process.env.MTN_TEST_URL = "https://sandbox.momodeveloper.mtn.com"
        process.env.MTN_ENVIRONMENT = "sandbox"
        process.env.TESTING_CALLBACK_URL = `https://webhook.site/${crypto.randomUUID()}` // for testing you can replace this with an actual one from https://webhook.site/
    })


    describe("Tests", ()=>{
        it("Should create a payment successfully", (done)=>{
            request(app).
            post("/api/payments/mtn")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .send({
                payment_type_id,
                amount: 1,
                vehicle_id,
            }).expect(200).then(async (res)=>{
                const data = res.body.data
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(data.status, "PROCESSING")
                assert(isPaymentAuthorizationTokenValid(res.body.data.authorization))
                await timeSleep(10000) // sleep for 10 seconds to allow the payment to be created
                
                const the_payment = await  prismaClient.payment.findFirst({
                    where: {
                        authorization: res.body.data.authorization
                    }
                })
                assert.strictEqual(the_payment?.status,"PROCESSING")
                assert.strictEqual(the_payment?.amount, 1)
                assert.strictEqual(the_payment?.user_id, customer_id)
                payment_auth = data.authorization
                done()
            }).catch(done)
        }).timeout(120000)

        
        it("Should create a payout successfully", (done)=>{
            
            // get the latest payment from the customer and create a reservation from it
            prismaClient.payment.findFirst({
                where: {
                    authorization: payment_auth
                }
            }).then(async (payment)=>{
                if (isNull(payment)) return done(new Error("Payment not found"))
                // mark the payment as complet (this is coz mtn unlike mpesa won't send a callback to the specified url)
                await prismaClient.payment.update({
                    where: {
                        id: payment?.id
                    },
                    data: {
                        status: "SUCCEEDED"
                    }
                })
                await prismaClient.reservation.create({
                    data: {
                        end_date_time: new Date(Date.now() + 1000 * 60 * 60 * 24),
                        start_date_time: new Date(),
                        vehicle_id,
                        user_id: customer_id,
                        payment_id: payment.id,
                        status: "COMPLETE"
                    }
                }).then(()=>{
                    
                    // we can now request a payout
                    request(app).post("/api/payouts/mtn")
                    .set("Authorization", `Bearer ${admin_token}`)
                    .set("x-user", "HOST")
                    .send({
                        amount: 1,
                        user_id: host_id
                    }).expect(200).then(async (res)=>{
                        assert.strictEqual(res.body.status, "success")
                        await timeSleep(10000) // sleep for 10 seconds to allow the payout to be created
                        const the_payout = await  prismaClient.payout.findFirst({})
                        assert.strictEqual(the_payout?.status,"PROCESSING")
                        assert.strictEqual(the_payout?.amount, 1)
                        assert.strictEqual(the_payout?.user_id, host_id)
                        done()
                    }).catch((e)=>{
                        done(e)
                    })
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        }).timeout(120000)


        it("Checking payment should result in success", (done)=>{
            console.log("Payment auth::", payment_auth)
            request(app).
            get("/api/payments/confirm")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .set("X-Payment-Authorization", payment_auth)
            .expect(200).then(async (res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data, "SUCCEEDED") // if payment was successful
                done()
            })
            .catch(done)
        })
    }).timeout(120000)

    // teardown
    after(async ()=>{
        // delete reservations
        await prismaClient.reservation.deleteMany({
            where: {
                user_id: customer_id
            }
        })
        // delete the vehicle
        vehicle_id && await prismaClient.vehicle.delete({
            where: {
                id: vehicle_id
            }
        })

        // delete the station
        station_id && await prismaClient.station.delete({
            where: {
                id: station_id
            }
        })

        // delete a payout
        await prismaClient.payout.deleteMany({
            where: {
                user_id: host_id
            }
        })

        // delete payout methods
        await prismaClient.payoutMethod.deleteMany({
            where: {
                user_id: host_id
            }
        })

        // delete the host
        host_id && await prismaClient.user.delete({
            where: {
                id: host_id
            }
        })

        // delete all the customer's payments
        customer_id && await prismaClient.payment.deleteMany({
            where: {
                user_id: customer_id
            }
        })

        // delete the customer's payment type
        customer_id && await prismaClient.paymentTypes.deleteMany({
            where: {
                user_id: customer_id
            }
        })

        // delete the customer
        customer_id && await prismaClient.user.delete({
            where: {
                id: customer_id
            }
        })

        // delete admin
        admin_id && await prismaClient.user.delete({
            where: {
                id: admin_id
            }
        })

        // delete the submarket
        sub_market_id && await prismaClient.subMarket.delete({
            where: {
                id: sub_market_id
            }
        })

        // delete the market
        market_id && await prismaClient.market.delete({
            where: {
                id: market_id
            }
        })

        // disconnect prisma
        await prismaClient.$disconnect()


    })
})