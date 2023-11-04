import prismaClient from "@prismaclient/client";
import { generateRandomCoordinates } from "@utils/functions";
import { createToken } from "@utils/testutils/createToken";
import request from "supertest";
import assert from 'assert'
import app from "src/app";

let customer_id: string;
let host_id: string;
let customer_token: string;
let host_token: string;
let market_id: string;
let sub_market_id: string;
const test_latitude = -1.2921;
const test_longitude = 36.8219;

describe("Vehicles within radius", ()=>{
    //setup
    before(async ()=>{

        customer_token = await createToken("CUSTOMER") as string
        host_token = await createToken("HOST") as string

        const market = await prismaClient.market.create({
            data: {
                country: "USA",
                name: "United States",
                currency: "USD",
            }
        })
        market_id = market.id
        const submarket = await prismaClient.subMarket.create({
            data: {
                name: "New York",
                market_id: market.id,
            }
        })
        sub_market_id = submarket.id
        const customer = await prismaClient.user.create({
            data: {
                email: "bugsbunny@email.com",
                fname: "Bugs",
                lname: "Bunny",
                handle: "bugsbunny",
                uid: process.env.TEST_CUSTOMER_UID as string,
                user_type: "CUSTOMER",
            }
        })

        const host = await prismaClient.user.create({
            data: {
                email: "jeff",
                fname: "Jeff",
                lname: "Bezos",
                handle: "jeff",
                uid: process.env.TEST_HOST_UID as string,
                user_type: "HOST",
            }
        })

        customer_id = customer.id
        host_id = host.id

        const stations = await Promise.all(Array.from({length: 10}, ()=>generateRandomCoordinates({
            lat: test_latitude,
            lng: test_longitude
        }, 5000)).map((coord, index)=>{
            return prismaClient.station.create({
                data: {
                    name: "Station "+index,
                    user_id: host_id,
                    sub_market_id: submarket.id,
                    latitude: coord.lat,
                    longitude: coord.lng,
                }
            })  
        }))

        const stations_further_away = await Promise.all(Array.from({length: 10}, ()=> generateRandomCoordinates({
            lat: 0,
            lng: 0
        }, 2000)).map((coord, index)=>{
            return prismaClient.station.create({
                data: {
                    name: "Station "+ index + 10,
                    user_id: host_id,
                    sub_market_id: submarket.id,
                    latitude: coord.lat,
                    longitude: coord.lng,
                }
            })
        }))

        //create a vehicle for each station
        await Promise.all([...stations, ...stations_further_away].map((station)=>{
            return prismaClient.vehicle.create({
                data: {
                    station_id: station.id,
                    user_id: host_id,
                }
            })
        }))


    })

    // tests

    describe("Tests ", ()=>{
        it("Should get a total of 20 vehicles when no coordinates are provided", (done)=>{
            request(app)
            .get("/api/vehicles")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .query({
                page: 1,
                size: 20
            })
            .expect(200)
            .then((res)=>{
                assert(res.body.status, "success")
                assert(res.body.data.length === 20)
                done()
            }).catch((e)=>{
                done(e)
            })
        })
        it("Should ge 10 vehicles within 5 kilometers of the user", (done)=>{
            
            request(app)
            .get("/api/vehicles")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
            .query({
                longitude: test_longitude,
                latitude: test_latitude,
                page: 2
            }).expect(200)
            .then((res)=>{
                assert(res.body.status, "success")
                assert.strictEqual(res.body.data.length, 10)
                done()
            }).catch((e)=>{
                done(e)
            })
        })
    })


    // teardown
    after(async ()=>{

        // delete created vehicles
        await prismaClient.vehicle.deleteMany({
            where: {
                user_id: host_id,
            }
        })

        // delete created stations
        await prismaClient.station.deleteMany({
            where: {
                user_id: host_id,
            }
        })

        // delete host 
        await prismaClient.user.delete({
            where: {
                id: host_id,
            }
        })

        // delete customer
        await prismaClient.user.delete({
            where: {
                id: customer_id,
            }
        })

        // delete created submarkets
        await prismaClient.subMarket.deleteMany({
            where: {
                id: sub_market_id,
            }
        })

        // delete created markets
        await prismaClient.market.deleteMany({
            where: {
                id: market_id,
            }
        })

    })
})