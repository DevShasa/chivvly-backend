import "dotenv/config"
import "../notifications/listeners"
import { isEmpty } from "lodash";
import readlinePromises from 'node:readline/promises';
import { auth } from "src/config/firebase/firebaseConfig";
import { generateInviteCode, generateRandomDefaultPassword } from "./functions";
import prismaClient from "@prismaclient/client";
import { captureException } from "@sentry/node";
import { SendMailWithTemplate } from "./postmark/actions";

const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout
});


(async ()=>{
    const env = process.env.APP_ENV 
    if (env === "testing") return console.log("Cannot invite admin in testing environment")
    await rl.question("Enter the admin's email:: ").then(async (email)=>{
        if(isEmpty(email)) return console.log("Email cannot be empty")
        rl.close()
        console.log("Creating invitation for", email)
        const password = generateRandomDefaultPassword()
        await auth.host?.createUser({
            email,
            password: password,// default password
            emailVerified: true,
        }).then(async (user)=>{
            await prismaClient.user.create({
                data: {
                    uid: user?.uid,
                    email: email,
                    handle: email?.split("@")?.[0],
                    fname: "Admin",
                    lname: "Admin",
                    user_type: "HOST",
                    is_admin: true
                }
            })
            await auth?.host?.setCustomUserClaims(user.uid, {admin: true})
            const code = generateInviteCode()
            await prismaClient.invitation.create({
                data: {
                    email,
                    code: code,
                    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
                    uid: user.uid,
                    activated: false,
                }
            }).then(async (invite)=>{
                await SendMailWithTemplate(invite.email, 'admin-invite', {
                    email: invite.email,
                    invite_code: invite.code,
                    invite_link: `${process.env.CONTROL_PANEL_URL}/auth/admin?inviteCode=${invite.code}&email=${invite.email}`,
                    password: password,
                    user_name: invite.email

                }).then(()=>{
                    console.log(`
                        Token: ${invite.code}
                        Email: ${invite.email}
                        Password: ${password}
                        link: ${process.env.CONTROL_PANEL_URL}/auth/admin?inviteCode=${invite.code}&email=${invite.email}
                    `)
                }).catch((e)=>{
                    console.log("Unable to invite admin", e)
                })
                
            }).catch((e)=>{
                console.log(e)
            })
        }).catch((e)=>{
            captureException(e)
            console.log(e)
        })
    }).catch((e)=>{
        captureException(e)
        console.log(e)
        rl.close()
    })
})()