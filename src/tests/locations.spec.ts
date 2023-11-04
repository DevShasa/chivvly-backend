import prismaClient from "@prismaclient/client";
import { createToken } from "@utils/testutils/createToken";
import request from 'supertest'
import assert from 'assert'
import app from "src/app";

let market_id: string;
let submarket_id: string;
let host_id: string;
let host_token: string;


describe("Location", ()=>{
    // setup 
    before(async ()=>{
        host_token = await createToken("HOST") as string

        const host = await prismaClient.user.create({
            data: {
                email: "jeff@email.com",
                handle: "HOST1",
                uid: process.env.TEST_HOST_UID as string,
                fname: "jeff",
                lname: "bezos",
                user_type: "HOST",
                is_admin: true
            }
        })

        host_id = host.id

    })  

    describe("Location ",()=>{
        describe("Market", ()=>{
            it("Should create a market", (done)=>{
                request(app).post("/api/location/admin/markets")
                .set("Authorization", `Bearer ${host_token}`)
                .set("x-user", "HOST")
                .send({
                    country: "Kenya",
                    name: "Kenya",
                    currency: "KES"
                }).expect(201)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    market_id = res.body.data.id
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })

            it("Should get created markets", (done)=>{
                request(app)
                .get("/api/location/markets")
                .set("Authorization", `Bearer ${host_token}`)
                .set("x-user", "HOST")
                .expect(200)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    assert.strictEqual(res.body.data?.length, 1)
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })
        })

        describe("Submarket", ()=>{
            it("Should create a submarket", (done)=>{
                request(app)
                .post("/api/location/admin/submarkets")
                .set("Authorization", `Bearer ${host_token}`)
                .set("x-user", "HOST")
                .send({
                    name: "Nairobi",
                    market_id
                }).expect(201)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    submarket_id = res.body.data.id
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })


            it("Should get created submarkets", (done)=>{
                request(app)
                .get("/api/location/submarkets")
                .set("Authorization", `Bearer ${host_token}`)
                .set("x-user", "HOST")
                .expect(200)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    assert.strictEqual(res.body.data?.length, 1)
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })
        })

        describe("Station", ()=>{
            it("Should create a station", (done)=>{
                request(app)
                .post("/api/location/station")
                .set("Authorization", `Bearer ${host_token}`)
                .set("x-user", "HOST")
                .send({
                    name: "Western Heights",
                    sub_market_id: submarket_id,
                    longitude: 90,
                    latitude: 90
                }).expect(201)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })

            it("Should get created stations", (done)=>{
                request(app)
                .get("/api/location/stations")
                .set("Authorization", `Bearer ${host_token}`)
                .set("x-user", "HOST")
                .expect(200)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    assert.strictEqual(res.body.data?.length, 1)
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            })
        })


    })

    // tear down
    after(async ()=>{
        // delete all created stations
        await prismaClient.station.deleteMany({
            where: {
                user_id: host_id
            }
        })

        // delete subMarket
        await prismaClient.subMarket.delete({
            where: {
                id: submarket_id
            }
        })

        //delete the created market
        await prismaClient.market.delete({
            where: {
                id: market_id
            }
        })
        
        //delete the user
        await prismaClient.user.delete({
            where: {
                id: host_id
            }
        })
    })
})
