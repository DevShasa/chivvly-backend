import prismaClient from "@prismaclient/client"
import { createToken } from "@utils/testutils/createToken" 
import app from "src/app"
import request from 'supertest'
import assert from 'node:assert'
import { createAPIKey, createMTNUser } from "@utils/mtn/scripts/create"
import crypto from "crypto"



let admin_id: string
let admin_token: string
let host_id: string
let host_token: string
let customer_id: string 
let customer_token: string
let market_id: string
let sub_market_id: string
let payout_method_id: string;
let withdrawal_id: string;
let vehicle_id: string;
let station_id: string;
let reservation_id: string;
let payment_id: string


describe("Withdrawals", ()=>{
    //setup

    before(async ()=>{

        admin_token = (await createToken("HOST", true)) as string
        host_token = (await createToken("HOST")) as string
        customer_token = (await createToken("CUSTOMER")) as string

        // create the markets
        const market = await prismaClient.market.create({
            data: {
                currency: 'EUR', // this is for testing since the mtn api only accepts eur as a test currency
                country: "CANADA",
                name: "Canada"
            }
        })

        market_id = market.id

        const sub_market = await prismaClient.subMarket.create({
            data: {
                name: "test submarket",
                market_id: market.id,      
            }
        })

        sub_market_id = sub_market.id

        const admin = await prismaClient.user.create({
            data: {
                uid: process.env.TEST_ADMIN_UID as string,
                user_type: "HOST",
                is_admin: true,
                handle: "test admin",
                email: "admin@email.com",
                market_id: market.id,
                sub_market_id: sub_market.id
            }
        })

        admin_id = admin.id


        const host = await prismaClient.user.create({
            data: {
                uid: process.env.TEST_HOST_UID as string,
                user_type: "HOST",
                handle: "test host",
                email: "jeff@email.com",
                market_id: market.id,
                sub_market_id: sub_market.id
            }
        })

        host_id = host.id

        // create a dummy payout method for the host not using mtn for this test
        const payout_method = await prismaClient.payoutMethod.create({
            data: {
                user_id: host.id,
                mobile_money_number: "0735644121", // this is just a random number
                type: "MTN",
                verified: true,
                status: "ACTIVE",
            }
        })

        payout_method_id = payout_method.id

        const customer = await prismaClient.user.create({
            data: {
                uid: process.env.TEST_CUSTOMER_UID as string,
                user_type: "CUSTOMER",
                handle: "test customer",
                email: "customer@email.com",
                market_id: market.id,
                sub_market_id: sub_market.id
            }
        })

        customer_id = customer.id


        // create stations for the hosts' vehicles

        const station = await prismaClient.station.create({
            data: {
                name: "test station",
                user_id: host.id,
                sub_market_id: sub_market.id,
            }
        })

        station_id = station.id

        // create a vehicle for this station

        const vehicle = await prismaClient.vehicle.create({
            data: {
                station_id: station.id,
                user_id: host.id,
                hourly_rate: 10
            }
        })

        vehicle_id = vehicle.id

        // create a dummy payment 
        const payment = await prismaClient.payment.create({
            data: {
                amount: 300,
                user_id: customer.id,
            }
        })

        payment_id = payment.id

        // create a dummy reservation
        const reservation = await prismaClient.reservation.create({
            data: {
                user_id: customer.id,
                vehicle_id: vehicle.id,
                start_date_time: new Date(),
                end_date_time: new Date(Date.now() + 1000 * 60 * 60 * 30)
            }
        })

        reservation_id = reservation.id


        // using mtn to handle payouts
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
        process.env.TESTING_CALLBACK_URL = `https://webhook.site/${crypto.randomUUID()}` 

    
    })


    // the tests
    describe("Withdrawals", () => {
        
        // let the host make a withdrawal request
        it("Host should be able to make a request", (done)=>{
            request(app).post("/api/payouts/withdrawals")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                amount: 255,
                payout_method_id: payout_method_id
            }).expect(201).then((res)=>{
                const data = res.body.data 
                withdrawal_id = data?.id
                assert.strictEqual(data?.status, "PENDING")
                done()
            }).catch(done)
        })

        // host should be able to fetch their requests

        it("Host should be able to fetch their requests", (done)=>{
            request(app).get("/api/payouts/withdrawals")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                const body = res.body
                assert.strictEqual(body.status, "success")
                assert.strictEqual(body.data.length,1)
                done()
            }).catch(done)
        })


        // let the admin approve the request
        it("Admin should be able to approve a request", (done)=>{

            request(app).patch("/api/payouts/withdrawals")
            .set("Authorization", `Bearer ${admin_token}`)
            .set("x-user", "HOST")
            .send({
                status: "APPROVED",
                id: withdrawal_id
            }).expect(200).then((res)=>{
                const body = res.body
                assert.strictEqual(body.status, "success")
                done()
            }).catch(done)

        })

        
    })



    // teerdown
    after(async ()=>{

        // delete payout 
        withdrawal_id && await prismaClient.payout.deleteMany({
            where: {
                withdrawal_id
            }
        })

        // delete the dummy withdrawal
        withdrawal_id && await prismaClient.withdrawal.delete({
            where: {
                id: withdrawal_id
            }
        })

        // delete the dummy payout method
        payout_method_id && await prismaClient.payout.deleteMany({
            where: {
                payout_method_id: payout_method_id
            }
        })

        // delete the dummy payout method
        payout_method_id && await prismaClient.payoutMethod.deleteMany({
            where: {
                id: payout_method_id
            }
        })


        // delete the dumy reservation
        reservation_id && await prismaClient.reservation.deleteMany({
            where: {
                id: reservation_id
            }
        })

        // delete the dummy payment 
        payment_id && await prismaClient.payment.deleteMany({
            where: {
                id: payment_id
            }
        })

        // delete the vehicle
        vehicle_id && await prismaClient.vehicle.deleteMany({
            where: {
                id: vehicle_id
            }
        })

        // delete the station 
        station_id && await prismaClient.station.deleteMany({
            where: {
                id: station_id
            }
        })

        // dekete host payouts
        host_id && await prismaClient.payout.deleteMany({
            where: {
                user_id: host_id
            }
        })

        // delete the users

        host_id && await prismaClient.user.deleteMany({
            where: {
                id: host_id
            }
        })

        customer_id && await prismaClient.user.deleteMany({
            where: {
                id: customer_id
            }
        })

        admin_id && await prismaClient.user.deleteMany({
            where: {
                id: admin_id
            }
        })

        // delete the sub market

        sub_market_id && await prismaClient.subMarket.deleteMany({
            where: {
                id: sub_market_id
            }
        })

        // finally the marlet 

        market_id && await prismaClient.market.deleteMany({
            where: {
                id: market_id
            }
        })

    })
})