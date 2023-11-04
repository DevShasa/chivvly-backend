import "dotenv/config"
import { createToken } from "./createToken"

(async()=>{
    console.log("Make sure you are on the testing environment")
    console.log("give it a sec...")
    const token = await createToken("HOST")
    console.log(`Here is your postman token: ${token}`)
})()