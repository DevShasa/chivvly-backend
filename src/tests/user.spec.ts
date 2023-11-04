import prismaClient from "@prismaclient/client";
import { createToken } from "@utils/testutils/createToken";
import app from "src/app";
import request from "supertest";
import assert from "assert";
import { isEmpty } from "lodash";
import notifications, { notification_event_names } from "src/notifications";
import { auth } from "src/config/firebase/firebaseConfig";
import 'src/notifications/listeners'

let customer_token: string;
let host_token: string;
let market_id: string;
let sub_market_id: string;
let customer_id: string;
let host_id: string;
let admin_token: string;
let admin_id: string;
let invite_code: string;

describe("USER", () => {
  before(async () => {
    customer_token = (await createToken("CUSTOMER")) as string;
    host_token = (await createToken("HOST")) as string;
    admin_token = (await createToken("HOST", true)) as string;
    const market = await prismaClient.market.create({
      data: {
        name: "test market",
        country: "test country",
        currency: "KES",
      },
    });

    const sub_market = await prismaClient.subMarket.create({
      data: {
        name: "test submarket",
        market_id: market.id,
      },
    });

    const admin = await prismaClient.user.create({
      data: {
        uid: process.env.TEST_ADMIN_UID as string,
        fname: "admin",
        lname: "admin",
        email: "admin@email.com",
        handle: "admin",
        market_id: market.id,
        user_type: "HOST",
        sub_market_id: sub_market.id,
        status: "ACTIVE",
        is_admin: true,
      }
    })

    admin_id = admin.id

    market_id = market.id;
    sub_market_id = sub_market.id;
  });

  describe("[CUSTOMER]", () => {
    describe("Create", () => {
      it("should create a customer", (done) => {
        request(app)
          .post("/api/users")
          .set("Authorization", `Bearer ${customer_token}`)
          .set("x-user", "CUSTOMER")
          .send({
            fname: "bugs",
            lname: "bunny",
            email: "bugsbunny@email.com",
            handle: "bugsbunny",
            market_id: market_id,
            user_type: "CUSTOMER",
            sub_market_id: sub_market_id,
          })
          .expect(201)
          .then((res) => {
            assert.strictEqual(res.body.status, "success");
            customer_id = res.body.data.id;
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });
    });

    describe("Onboarding", () => {
      it("All onboarding steps should be incomplete except location", (done) => {
        request(app)
          .get(`/api/users/onboarding`)
          .set("Authorization", `Bearer ${customer_token}`)
          .set("x-user", "CUSTOMER")
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.status, "success");
            // assert.deepEqual(res.body.data.completed, {
            //   drivers_license: false,
            //   payment_method: false,
            //   location: true,
            // });
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });

      it("Should be able to upload drivers license", (done) => {
        request(app)
          .put("/api/users/drivercredentials")
          .set("Authorization", `Bearer ${customer_token}`)
          .set("x-user", "CUSTOMER")
          .send({
            drivers_licence_front:
              "https://images.pexels.com/photos/5516035/pexels-photo-5516035.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            drivers_licence_back:
              "https://images.pexels.com/photos/5273211/pexels-photo-5273211.jpeg?auto=compress&cs=tinysrgb&w=400",
          })
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.status, "success");
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });

      it("Should be able to add a payment method", (done) => {
        prismaClient.user
          .findUnique({
            where: {
              id: customer_id,
            },
          })
          .then((user) => {
            request(app)
              .post("/api/paymenttypes")
              .query({
                type: "STRIPE"
              })
              .set("Authorization", `Bearer ${customer_token}`)
              .set("x-user", "CUSTOMER")
              .send({
                card_number: "4242424242424242",
                cvc: "444",
                customer_id: user?.customer_id,
                exp_year: 2027,
                exp_month: 10,
              })
              .expect(200)
              .then((res) => {
                assert.strictEqual(res.body.status, "success");
                done();
              })
              .catch((e) => {
                console.log(e);
                done(e);
              });
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });

      it("All onboarding steps should be complete", (done) => {
        request(app)
          .get(`/api/users/onboarding`)
          .set("Authorization", `Bearer ${customer_token}`)
          .set("x-user", "CUSTOMER")
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.status, "success");
            // assert.deepEqual(res.body.data.completed, {
            //   drivers_license: true,
            //   payment_method: true,
            //   location: true,
            // });
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });

      it("Whould be able to fetch the user object", (done) => {
        request(app)
          .get("/api/users")
          .set("Authorization", `Bearer ${customer_token}`)
          .set("x-user", "CUSTOMER")
          .expect(200)
          .then((res) => {
            assert.strictEqual(res.body.status, "success");
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });
    });
  });

  describe("[HOST]", () => {
    describe("Create", () => {
      it("should create a host", (done) => {
        request(app)
          .post("/api/users")
          .set("Authorization", `Bearer ${host_token}`)
          .set("x-user", "HOST")
          .send({
            fname: "jeff",
            lname: "bezos",
            email: "jeff@email.com",
            handle: "HOSTCODE1",
            market_id: market_id,
            sub_market_id: sub_market_id,
            user_type: "HOST",
          })
          .expect(201)
          .then((res) => {
            assert.strictEqual(res.body.status, "success");
            host_id = res.body.data.id;
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });
    });

    describe("Onboarding", () => {
      it("All onboarding steps should be incomplete except location", (done) => {
        request(app)
          .get(`/api/users/onboarding`)
          .set("Authorization", `Bearer ${host_token}`)
          .set("x-user", "HOST")
          .expect(200)
          .then((res) => {
            // adding payout involves a webhook call to stripe, so we can't test it here
            assert.strictEqual(res.body.status, "success");
            assert.deepEqual(res.body.data.completed, {
              location: true,
              payout_method: false,
              profile: false
            });
            done();
          })
          .catch((e) => {
            console.log(e);
            done(e);
          });
      });
    });


    describe("ADMIN", ()=>{
      it("Should be able to create invites and have them sent to the email", (done)=>{
        notifications.on(notification_event_names.send_admin_invite_email, (data)=>{
          assert.strictEqual(data.data.email, "test@blackhole.postmarkapp.com")
          invite_code = data.data.invite_code
          assert(!isEmpty(invite_code))
          done()
        })

        request(app)
        .post("/api/users/admin/invite")
        .set("Authorization", `Bearer ${admin_token}`)
        .set("x-user", "HOST") // admin is a special host
        .send({
          email: "test@blackhole.postmarkapp.com" // this is a test email for postmark
        }).expect(200)
        .then((res)=>{
          assert.strictEqual(res.body.status, "success");
        }).catch((e)=>{
          console.log(e)
          done(e)
        }) 
      })


      it("User's who receive an invite should be able to request for an auth token", (done)=>{
        request(app)
        .get("/api/users/admin/accept")
        .query({
          email: "test@blackhole.postmarkapp.com",
          code: invite_code
        }).expect(200)
        .then((res)=>{
          assert.strictEqual(res.body.status, "success");
          assert(!isEmpty(res.body.data)) // the client can then use this to login
          done()
        }).catch((e)=>{
          console.log(e)
          done(e)
        })
      })

    })
  });

  after(async () => {
    // delete the customer
    if (!isEmpty(customer_id)) {
      await prismaClient.userSettings.delete({
        where: {
          user_id: customer_id,
        },
      });
      await prismaClient.driverCredentials.delete({
        where: {
          user_id: customer_id,
        },
      });
      await prismaClient.paymentTypes.deleteMany({
        where: {
          user_id: customer_id,
        },
      });
      await prismaClient.user.delete({
        where: {
          id: customer_id,
        },
      });
    }

    // delete the host
    if (!isEmpty(host_id)) {
      await prismaClient.userSettings.delete({
        where: {
          user_id: host_id,
        },
      });

      await prismaClient.user.delete({
        where: {
          id: host_id,
        },
      });
    }

    // delete invites
    await prismaClient.invitation.deleteMany({
      where: {
        email: "test@blackhole.postmarkapp.com"
      }
    });

    // delete the admin
    admin_id && (await prismaClient.user.delete({ where: { id: admin_id } }));


    //delete the testuser from firebase
    const uid = (await auth.host?.getUserByEmail("test@blackhole.postmarkapp.com"))?.uid
    uid && (await auth.host?.deleteUser(uid))

    await prismaClient.userSettings.deleteMany({
      where: {
        user: {
          uid
        }
      }
    })

    // and from the database
    await prismaClient.user.delete({
      where: {
        uid
      }
    })

    // delete the market and submarket
    await prismaClient.subMarket.deleteMany({});

    // delete market
    await prismaClient.market.deleteMany({});
  });
});
