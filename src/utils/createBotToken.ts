import 'dotenv/config'
/**
 * @description, this script will generate a jwt token, that needs to be included in the auth headers for requests made to the api, by bots or other services
 */

import { generateAppJWT } from "./functions";

(async()=>{
    console.log(`Generating app token... :robot: `)
    const token = await generateAppJWT({
        user_id: 'bot',
        user_type: 'bot'
    })
    console.log(`Generated token: ${token}`)
})();