import prismaClient from "@prismaclient/client";
import { createToken } from "@utils/testutils/createToken";
import app from "src/app";
import request from 'supertest'
import assert from "assert"


let host_token: string;
let market_id: string;
let sub_market_id: string;
let station_id: string;
const new_vehicles: string[] = []
let host_id: string;




describe("Vehicles", ()=>{

    before(async ()=>{
        host_token = await createToken("HOST") as string
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
    
        const station = await prismaClient.station.create({
            data: {
                name: "test station",
                user_id: host.id,
                sub_market_id: sub_market.id,
            }
        })
    
        market_id = market.id
        sub_market_id = sub_market.id
        station_id = station.id
    })

    
    describe("[CREATE]", ()=>{
        it("should create vehicle 1", (done)=>{
            request(app)
            .post("/api/vehicles")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                vehicle: {
                    color: "red",
                    make: "toyota",
                    model: "corolla",
                    year: 2010,
                    plate: "KCK 123A",
                    station_id: station_id,
                    status: "ACTIVE"
                },
                pictures: [
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                ]
            }).expect(201)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                new_vehicles.push(res.body.data.id)
                done()
            })
            .catch((e)=>{
                console.log(e)
                done(e)
            })

        })

        it("Should create vehicle 2", (done)=>{
            request(app)
            .post("/api/vehicles")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                vehicle: {
                    color: "yellow",
                    make: "toyota",
                    model: "corolla",
                    year: 2011,
                    plate: "KCK 123B",
                    station_id: station_id,
                    status: "INACTIVE"
                },
                pictures: [
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                ]
            }).expect(201)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                new_vehicles.push(res.body.data.id)
                done()
            })
            .catch((e)=>{
                console.log(e)
                done(e)
            })
        })

        it("Should create vehicle 3", (done)=>{
            request(app)
            .post("/api/vehicles")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                vehicle: {
                    color: "pink",
                    make: "toyota",
                    model: "corolla",
                    year: 2011,
                    plate: "KCK 123C",
                    station_id: station_id,
                    status: "BLOCKED"
                },
                pictures: [
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                ]
            }).expect(201)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                new_vehicles.push(res.body.data.id)
                done()
            })
            .catch((e)=>{
                console.log(e)
                done(e)
            })
        })

        it("Should create vehicle 4", (done)=>{
            request(app)
            .post("/api/vehicles")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                vehicle: {
                    color: "white",
                    make: "toyota",
                    model: "corolla",
                    year: 2011,
                    plate: "KCK 123D",
                    station_id: station_id,
                },
                pictures: [
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    "https://images.pexels.com/photos/3787149/pexels-photo-3787149.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                ]
            }).expect(201)
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                new_vehicles.push(res.body.data.id)
                done()
            })
            .catch((e)=>{
                console.log(e)
                done(e)
            })
        })
    })

    describe('[UPDATE]', ()=>{
        it("should update a vehicle", (done)=>{
            request(app)
            .put(`/api/vehicles?vehicle_id=${new_vehicles[0]}`)
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .send({
                color: "purple",
            }).expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.color, "purple")
                done()
            }).catch((err)=>{
                done(err)
            })
        })
    })

    describe("[GET]", ()=>{

        it("should get all vehicles", (done)=>{
            request(app)
            .get("/api/vehicles")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 3)//we wont get the inactive vehicle same as deleted
                done()
            }).catch((err)=>{
                done(err)
            })
        })


        it("should get a vehicle", (done)=>{
            request(app)
            .get(`/api/vehicles?vehicle_id=${new_vehicles[0]}`)
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data?.[0]?.id, new_vehicles[0])
                done()
            }).catch((err)=>{
                done(err)
            })
        })

        it("should get active vehicles", (done)=>{
            request(app)
            .get("/api/vehicles?status=ACTIVE")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 2)
                done()
            }).catch((err)=>{
                done(err)
            })
        })

        it("should get inactive vehicles", (done)=>{
            request(app)
            .get("/api/vehicles?status=INACTIVE")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 0) // inactive same as deleted, and won;t be accessible
                done()
            }).catch((err)=>{
                done(err)
            })
        })

        it("should get blocked vehicles", (done)=>{
            request(app)
            .get("/api/vehicles?status=BLOCKED")
            .set("Authorization", `Bearer ${host_token}`)
            .set("x-user", "HOST")
            .expect(200).then((res)=>{
                assert.strictEqual(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 1)
                done()
            }).catch((err)=>{
                done(err)
            })
        })

    })

    after(async ()=>{
        

        //delete vehiclePictures
        await prismaClient.vehiclePictures.deleteMany({
            where: {
                vehicle: {
                    host: {
                        id: host_id
                    }
                }
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
    
        // delete the host
        await prismaClient.user.delete({
            where: {
                id: host_id
            }
        })
         
    
        // delete the market and submarket
        await prismaClient.subMarket.deleteMany({
            where: {
                market_id
            }
        })
    
        // delete market
        await prismaClient.market.delete({
            where: {
                id: market_id
            }
        })
    
        
    })
})


