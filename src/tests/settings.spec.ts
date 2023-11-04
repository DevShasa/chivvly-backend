import prismaClient from "@prismaclient/client";
import { createToken } from "@utils/testutils/createToken";
import app from "src/app";
import request from "supertest"
import assert from "assert"
import crypto from "crypto"

let user_token: string;
let user_id: string; 




describe("Settings", ()=>{
    //setup
    before(async ()=>{
        const token = await createToken("CUSTOMER") as string
        user_token = token
        const user = await prismaClient.user.create({
            data: {
                fname: "jeff",
                lname: "bezos",
                handle: "HOST1",
                email: "jeff@email.com",
                uid: process.env.TEST_CUSTOMER_UID as string,
                user_type: "CUSTOMER",
                user_settings: {
                    create: {
                        notifications_enabled: false
                    }
                }
            }
        })

        user_id = user.id
    })

    //test suite
    describe("Update Notification Settings",()=>{
        it("Should turn on notifications", (done)=>{
            request(app). 
            put("/api/settings"). 
            set("Authorization", `Bearer ${user_token}`). 
            set("x-user", "CUSTOMER"). 
            send({
                notifications_enabled: true
            }).expect(200). 
            then((res)=>{
                assert.strictEqual(res.body.status, "success") 
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })

        it("Should add a token to the user", (done)=>{
            request(app)
            .post("/api/settings/tokens")
            .set("Authorization", `Bearer ${user_token}`) 
            .set("x-user","CUSTOMER") 
            .send({
                token: crypto.randomUUID()
            }).expect(200) 
            .then((res)=>{
                assert.strictEqual(res.body.status, "success")
                done()
            })
            .catch((e)=>{
                console.log(e)
                done(e)
            })
        })

        it("Should turn off notifications", (done)=>{
            request(app). 
            put("/api/settings"). 
            set("Authorization", `Bearer ${user_token}`). 
            set("x-user", "CUSTOMER"). 
            send({
                notifications_enabled: false
            }).expect(200). 
            then((res)=>{
                assert.strictEqual(res.body.status, "success") 
                done()
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
        })
    })
    // teardown
    after(async ()=>{
        await prismaClient.pushToken.deleteMany({
            where: {
                user_settings: {
                    user: {
                        id: user_id
                    }
                }
            }
        })

        await prismaClient.userSettings.delete({
            where: {
                user_id
            }
        })

        await prismaClient.user.delete({
            where: {
                id: user_id
            }
        })
    })
})