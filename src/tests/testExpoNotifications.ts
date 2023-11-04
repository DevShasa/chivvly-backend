import 'dotenv/config'
import { app_env } from "@utils/constants";
import expo, { expo_app_scheme } from "@utils/expo";

const push_token = process.env.TEST_PUSH_TOKEN as string;
const link = expo_app_scheme;

(async ()=>{
    if(app_env !== "testing") return console.log("This script is only for testing") 
    if(push_token === "") return console.log("Update TEST_PUSH_TOKEN in .env")
    if(link === "") return console.log("Update DEV_MOBILE_APP_SCHEME in .env")
    await expo.sendPushNotificationsAsync([
        {
            to: push_token,
            sound: 'default',
            title: "Auth Code Request Granted",
            priority: "high",
            body: "Your auth code has been activated, your new code is 34A5TG",
            data: {
                link: link + "search?searchType=host&hostCode=hostCode",
                code: "34A5TG",
                type: "auth_code_activated",
                host_id: "1",
                vehicle_id: "5"
            }
        }
    ])
})()