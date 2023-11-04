import prismaClient from "@prismaclient/client"
import { isEmpty } from "lodash"

(async ()=>{

    const markets = await prismaClient.market.findMany({})
    if (isEmpty(markets)) return console.log("No markets found")
    for (const market of markets){
        // admin user adopter
        await prismaClient.user.create({
            data: {
                market_id: market.id,
                email: `adminadopter${market.name}@divvly.io`,
                user_type: "HOST",
                handle: `adminadopter${market.name}`,
                is_admin: true,
                uid: `adminadopter${market.name}`,
            }
        })

        console.log("::Cread admin user adopter for", market.name)

        // host user adopter
        await prismaClient.user.create({
            data: {
                market_id: market.id,
                email: `hostadopter${market.name}@divvly.io`,
                user_type: "HOST",
                handle: `hostadopter${market.name}`,
                uid: `hostadopter${market.name}`
            }
        })

        console.log("::::Cread host user adopter for", market.name)

        // customer user adopter
        await prismaClient.user.create({
            data: {
                market_id: market.id,
                email: `customeradopter${market?.name}@divvly.io`,
                user_type: "CUSTOMER",
                handle: `customeradopter${market?.name}`,
                uid: `customeradopter${market?.name}`
            }
        })

        console.log("::::::Cread customer user adopter for", market.name)
    }

})()