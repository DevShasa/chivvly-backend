import prismaClient from "@prismaclient/client";
import { createToken } from "@utils/testutils/createToken";
import request from 'supertest'
import assert from 'assert'
import app from "src/app";

let customer_id: string;
let customer_token: string;
let host_id: string;
let host_token: string;
let vehicle_id: string;
let station_id: string;
let market_id: string;
let submarket_id: string;

describe("Authcode", ()=>{
    //setup
    before(async ()=>{
       customer_token = await createToken("CUSTOMER") as string
       host_token = await createToken("HOST") as string

       // market
       const market = await prismaClient.market.create({
              data: {
                name: "test market",
                country: "test country",
                currency: "CAD"
              }
        })
        market_id = market.id

        // submarket 
        const submarket = await prismaClient.subMarket.create({
            data: {
                name: "test submarket",
                market_id: market.id
            }
        })

        submarket_id = submarket.id

        // host
        const host = await prismaClient.user.create({
            data: {
                handle: "test host",
                sub_market_id: submarket.id,
                market_id: market.id,
                email: "jeff@email.com",
                uid: process.env.TEST_HOST_UID as string,
                user_type: "HOST"
            }
        })

        host_id = host.id

        // customer
        const customer = await prismaClient.user.create({
            data: {
                handle: "test customer",
                sub_market_id: submarket.id,
                market_id: market.id,
                email: "bugsbunny@email.com",
                uid: process.env.TEST_CUSTOMER_UID as string,
                user_type: "CUSTOMER",
                user_settings: {
                    create: {
                        notifications_enabled: false
                    }
                }
            }
        })
        customer_id = customer.id

        // Station
        const station = await prismaClient.station.create({
            data: {
                name: "test station",
                sub_market_id: submarket.id,
                user_id: host.id,
            }
        })

        station_id = station.id

        // Vehicle
        const vehicle = await prismaClient.vehicle.create({
            data: {
                make: "test make",
                model: "test model",
                year: 2020,
                user_id: customer.id,
                station_id: station.id,
            }
        })

        vehicle_id = vehicle.id
    })


    describe("Authcode", ()=>{
        it("Should create an authcode request from the customer", (done)=>{
            request(app)
            .post("/api/authcodes/request")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .send({
                vehicle_id,
                host_id
            }).expect(201)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })


        it("Host should be able to fetch authcodes", (done)=>{
            request(app)
            .get("/api/authcodes")
            .query({
                status: "NONACTIVE"
            })
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 1)
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })

        it("Host should be able to activate an authcode", (done)=>{
            prismaClient.authCode.findFirst({
                where: {
                    host_id
                }
            }).then(async (authCode)=>{
                console.log("The hostcode being activated", authCode)
                try {
                    const res = await request(app)
                        .post("/api/authcodes")
                        .query({
                            auth_code_id: authCode?.id
                        })
                        .set("Authorization", `Bearer ${host_token}`) 
                        .set("x-user", "HOST")
                        .expect(200);
                    console.log("Done making the request")
                    assert.strictEqual(res.body.status, "success");
                    done();
                } catch (e) {
                    console.log(e);
                    done(e);
                }
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
            
        })

        it("Host should be able to fetch active authcodes", (done)=>{
            request(app)
            .get("/api/authcodes")
            .query({
                status: "ACTIVE"
            })
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 1)
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })

    })


    //teardown
    after(async ()=>{

        // delete all authcodes
        await prismaClient.authCode.deleteMany({
            where: {
                vehicle_id: vehicle_id
            }
        })

        // delete created vehicle
        await prismaClient.vehicle.delete({
            where: {
                id: vehicle_id
            }
        })

        // delete created station
        await prismaClient.station.delete({
            where: {
                id: station_id
            }
        })

        await prismaClient.userSettings.deleteMany({
            where: {
                user_id: customer_id
            }
        })

        // delete created customer
        await prismaClient.user.delete({
            where: {
                id: customer_id
            }
        })

        // delete created host
        await prismaClient.user.delete({
            where: {
                id: host_id
            }
        })

        // delete created submarket
        await prismaClient.subMarket.delete({
            where: {
                id: submarket_id
            }
        })

        // delete created market
        await prismaClient.market.delete({
            where: {
                id: market_id
            }
        })

    })
})