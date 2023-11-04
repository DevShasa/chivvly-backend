import { Market, SubMarket } from "@prisma/client"
import prismaClient from "@prismaclient/client"


(async ()=>{
    const markets_and_submarkets: Array<Partial<Market> & {
        sub_markets?: Array<Partial<SubMarket>>
    }> = [
        {
            currency: 'KES',
            country: 'Kenya',
            name: 'Kenya',
            sub_markets: [
                {
                    name: 'Nairobi',
                },
            ]
        },
        {
            currency: 'RWF',
            country: 'Rwanda',
            name: 'Rwanda',
            sub_markets: [
                {
                    name: 'Kigali',
                },
            ]
        },
        {
            currency: 'CAD',
            country: 'Canada',
            name: 'Canada.',
            sub_markets: [
                {
                    name: 'Toronto',
                }
            ]
        },
        {
            currency: 'USD',
            country: 'United States',
            name: 'United States',
            sub_markets: [
                {
                    name: 'New York',
                }
            ]
        },
        {
            currency: 'GBP',
            country: 'United Kingdom',
            name: 'United Kingdom',
            sub_markets: [
                {
                    name: 'London',
                }
            ]
        },
        {
            currency: 'THB',
            country: 'Thailand',
            name: 'Thailand',
            sub_markets: [
                {
                    name: 'Bangkok',
                }
            ]
        },
        {
            currency: 'ZSD',
            country: 'South Africa',
            name: 'South Africa',
            sub_markets: [
                {
                    name: 'Johannesburg'
                }
            ]
        }
    ] 

    try {
        for (const market of markets_and_submarkets) {
            const _market = await prismaClient.market.create({
                data: {
                    currency: market.currency ?? "USD",
                    country: market.country ?? "United States",
                    name: market.name ?? "United States",
                }   
            })

            console.log("Done creating market::", _market?.name)

            try {
                for (const sub_market of market.sub_markets ?? []) {
                    const sub = await prismaClient.subMarket.create({
                        data: {
                            name: sub_market.name ?? "New York",
                            market_id: _market.id
                        }
                    })
                    console.log("::::Done creating submarket::", sub?.name)
                } 
            } catch (e) {
                console.log("An error occured while creating submarkets::")
            }
        }
    } catch (e) {
        console.log("Something went wrong::", e)
    }

})()