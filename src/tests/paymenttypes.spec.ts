import request from 'supertest'
import assert from 'assert'
import { createToken } from '@utils/testutils/createToken';
import app from 'src/app';
import prismaClient from '@prismaclient/client';

let customer_id: string;
let customer_token: string;


describe("Payment Types", ()=>{
    //setup
    before(async()=>{
        customer_token = await createToken("CUSTOMER") as string

        const user_res = await request(app).post("/api/users") 
        .set("Authorization", `Bearer ${customer_token}`)
        .set("x-user", "CUSTOMER")
        .send({
            fname: "bugs",
            lname: "bunny",
            email: "bugsbunny@email.com",
            handle: "bugsbunny",
            user_type: "CUSTOMER",
        })

        customer_id = user_res.body.data.id

        
    })

    // test suite 

    describe("Create Payment Type", ()=>{
        it("Should create a payment type successfully", (done)=>{
            prismaClient.user.findFirst({
                where: {
                    id: customer_id
                }
            }).then((data)=>{
                request(app)
                .post("/api/paymenttypes")
                .query({
                    type: "STRIPE"
                })
                .set("Authorization", `Bearer ${customer_token}`)
                .set("x-user", "CUSTOMER")
                .send({
                    customer_id: data?.customer_id,
                    exp_year: 2027,
                    exp_month: 10,
                    card_number: "4242424242424242",
                    cvc: "444",
                }).expect(200)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
            
        })

        it("Should get all user payment methods", (done)=>{
            request(app)
            .get("/api/paymenttypes")
            .set("Authorization", `Bearer ${customer_token}`)
            .set("x-user", "CUSTOMER")
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

        it("Should deactivate the payment method", (done)=>{
            prismaClient.paymentTypes.findFirst({
                where: {
                    user_id: customer_id
                }
            }).then((paymentType)=>{
                request(app)
                .put("/api/paymenttypes?id="+paymentType?.id)
                .set("Authorization", `Bearer ${customer_token}`)
                .set("x-user", "CUSTOMER")
                .send({
                    status: "NONACTIVE"
                })
                .expect(200)
                .then((res)=>{
                    assert.strictEqual(res.body.status, "success")
                    done()
                }).catch((e)=>{
                    console.log(e)
                    done(e)
                })
            }).catch((e)=>{
                console.log(e)
                done(e)
            })
            
        })
    })

    //teardown
    after(async()=>{

        // delete user settings
        await prismaClient.userSettings.delete({
            where: {
                user_id: customer_id
            }
        })

        // delete driver credentials
        await prismaClient.driverCredentials.delete({
            where: {
                user_id: customer_id
            }
        })

        //delete payment types
        await prismaClient.paymentTypes.deleteMany({
            where: {
                user_id: customer_id
            }
        })

        // delete user
        await prismaClient.user.delete({
            where: {
                id: customer_id
            }
        })

        // delete all user payment types
        await prismaClient.paymentTypes.deleteMany({
            where: {
                user_id: customer_id
            }
        })

    })
})