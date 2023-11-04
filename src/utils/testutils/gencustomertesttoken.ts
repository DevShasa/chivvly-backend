import "dotenv/config"
import { createToken } from "./createToken"

(async()=>{
    if(process.env.APP_ENV !== "testing") return console.log("Make sure you are on the testing environment")
    console.log("give it a sec...")
    const token = await createToken("CUSTOMER")
    console.log(`Here is your postman token: ${token}`)
})()