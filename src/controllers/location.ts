import generateDataTransferObject  from '@utils/generateDto';
import { Market } from "@prisma/client";
import prismaClient from "@prismaclient/client";
import { Request, Response } from "express";
import { isEmpty, isUndefined } from 'lodash';
import { parsePagination, parseQueryString } from '@utils/pagination';
import { tLocationQuerySchema, tMarket, tStation, tStationQuerySchema, tSubMarket } from '@validators/location';
import { captureException } from '@sentry/node';
import { WithUserHeaders } from '@middleware/withUser';
import { z } from 'zod';

export const createMarket = async (req: Request, res: Response) => {
    const { role } = req.headers as WithUserHeaders

    if(role !== "admin") return res.status(403).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))

    await tMarket.required({
        country: true,
        name: true,
        currency: true,
    }).parseAsync(req.body).then(async (market)=>{
        await prismaClient.market.create({
            data: market
        }).then((market)=>{
            res.status(201).send(generateDataTransferObject(market, "Market created successfully", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured creating the market", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })

    
}


export const createSubMarket = async (req: Request, res: Response) => {

    const { role } = req.headers as WithUserHeaders

    if(role !== "admin") return res.status(403).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))

    const subMarket = req.body as Market
    tSubMarket.required({
        name: true,
        market_id: true,
    }).parseAsync(subMarket).then(async (subMarket)=>{
        await prismaClient.subMarket.create({
            data: subMarket
        }).then((subMarket)=>{
            res.status(201).send(generateDataTransferObject(subMarket, "Sub-market created successfully", "success"))
        }).catch((e)=>{
            console.log("The error::",e)
            res.status(500).send(generateDataTransferObject(e, "An error occured creating the sub-market", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })
    
}


export const updateMarket = async (req: Request, res: Response) => {
    const { role  } = req.headers as WithUserHeaders
    const market_id =  req.query.market_id as string 
    if(role !== "admin") return res.status(403).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))
    if(!z.string().uuid().safeParse(market_id).success) return res.status(400).send(generateDataTransferObject(null, "Invalid request", "error"))

    const parsed  = tMarket.safeParse(req.body)

    if(!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request", "error"))

    const market = parsed.data

    try {
        await prismaClient.market.update({
            where: {
                id: market_id
            },
            data: {
                ...market
            }
        })

        return res.status(200).send(generateDataTransferObject(null, "Market updated successfully", "success"))
    } 
    catch (e)
    {   
        captureException(e, (context)=>{
            return context.setTag("level", "low")
            .setTag("description","An error occured updating the market")
        })
        return res.status(500).send(generateDataTransferObject(e, "An error occured updating the market", "error"))
    }
}


export const updateSubMarket = async (req: Request, res: Response) => {
    const { role  } = req.headers as WithUserHeaders
    const sub_market_id =  req.query.sub_market_id as string 
    if(role !== "admin") return res.status(403).send(generateDataTransferObject(null, "You are not authorized to perform this action", "error"))
    if(!z.string().uuid().safeParse(sub_market_id).success) return res.status(400).send(generateDataTransferObject(null, "Invalid request", "error"))

    const parsed  = tSubMarket.safeParse(req.body)

    if(!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request", "error"))

    const subMarket = parsed.data

    try {
        await prismaClient.subMarket.update({
            where: {
                id: sub_market_id
            },
            data: {
                ...subMarket
            }
        })

        return res.status(200).send(generateDataTransferObject(null, "Sub-market updated successfully", "success"))
    } 
    catch (e)
    {   
        captureException(e, (context)=>{
            return context.setTag("level", "low")
            .setTag("description","An error occured updating the sub-market")
        })
        return res.status(500).send(generateDataTransferObject(e, "An error occured updating the sub-market", "error"))
    }
}

export const createStation = async (req: Request, res: Response) => {
    const user_id = req.headers.user_id as string
    await tStation.required({
        name: true,
        sub_market_id: true,
        latitude: true,
        longitude: true
    }).parseAsync(req.body).then(async (station)=>{
        await prismaClient.station.create({
            data: {
                ...station,
                user_id,
            }
        }).then((station)=>{
            res.status(201).send(generateDataTransferObject(station, "Station created successfully", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured creating the station", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })
    
}

export const updateStation = async (req: Request, res: Response) => {
    const user_id = req.headers.user_id as string
    const station_id = req.query.station_id as string
    await tStation.parseAsync(req.body).then(async (updatedStation)=>{
        await prismaClient.station.findFirst({
            where: {
                id: station_id,
                user_id
            }
        }).then(async (station)=>{
            await prismaClient.station.update({
                where: {
                    id: station_id,
                },
                data: {
                    ...updatedStation,
                }
            }).then(()=>{
                res.status(200).send(generateDataTransferObject(station, "Station updated successfully", "success"))
            }).catch((e)=>{
                res.status(500).send(generateDataTransferObject(e, "An error occured updating the station", "error"))
                captureException(e)
            })
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured", "error"))
            captureException(e)
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })
    
    
}

export const getMarkets = async (req: Request, res: Response) => {
    const { role } = req.headers as WithUserHeaders // these will only be availble if an admin is making the request
    const parsed = tLocationQuerySchema.safeParse(req.query) 
    if(!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request", "error")) 
    const { id, page, size } = parsed.data

    try {
        const markets = await prismaClient.market.findMany({
            where:{
                id: isEmpty(id) ? undefined : id,
                status: role === 'admin' ? undefined : "ACTIVE"
            },
            take: isEmpty(size) ? undefined : Number(size),
            skip: isEmpty(page) ? undefined : (Number(page) - 1) * Number(size),
            include: role === 'admin' ? {
                _count: {
                    select: {
                        SubMarket: true,
                        User: true,
                    }
                }
            } : undefined
        })

        return res.status(200).send(generateDataTransferObject(markets, "Markets retrieved successfully", "success"))
    } 
    catch (e)
    {
        return res.status(500).send(generateDataTransferObject(e, "An error occured retrieving the markets", "error"))
    }
 
}

export const getSubMarkets =  async (req: Request, res: Response) => {
    const { role } = req.headers as WithUserHeaders // these will only be availble if an admin is making the request
    const parsed = tLocationQuerySchema.safeParse(req.query) 
    if(!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request", "error")) 
    const { id, page, size, market_id } = parsed.data

    try {
        const subMarkets = await prismaClient.subMarket.findMany({
            where:{
                id: isEmpty(id) ? undefined : id,
                market_id: isEmpty(market_id) ? undefined : market_id,
                status: role === 'admin' ? undefined : "ACTIVE"
            },
            take: isEmpty(size) ? undefined : Number(size),
            skip: isEmpty(page) ? undefined : (Number(page) - 1) * Number(size),
            include: role === 'admin' ? {
                _count: {
                    select: {
                        Station: true,
                        User: true,
                    }
                }
            } : undefined
        })

        return res.status(200).send(generateDataTransferObject(subMarkets, "Sub-markets retrieved successfully", "success"))
    } 
    catch (e)
    {
        return res.status(500).send(generateDataTransferObject(e, "An error occured retrieving the sub-markets", "error"))
    }
 
}

export const getStations = async (req: Request, res: Response) => {
    const { user_id: current_user_id, role } = req.headers as WithUserHeaders
    
    tStationQuerySchema.parseAsync(req.query).then((query)=>{
        const { station_id, page, size, search, sort_by, sort, user_id } = query

        prismaClient.station.findMany({
            where: {
                id: station_id,
                user_id: role === "admin" ? user_id : current_user_id,
                name: !isEmpty(search) ? {
                    contains: search,
                    mode: 'insensitive'
                } : undefined,
                status: {
                    not: "INACTIVE"
                }
            },
            take: size,
            skip: (page - 1) * size,
            include: {
                sub_market: true
            },
            orderBy: {
                [sort_by]: sort
            }
        }).then((stations)=>{
            res.status(200).send(generateDataTransferObject(stations, "Successfully retrieved stations", "success"))
        }).catch((e)=>{
            res.status(500).send(generateDataTransferObject(e, "An error occured retrieving the stations", "error"))
            captureException(e)
        })

    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"))
    })

}