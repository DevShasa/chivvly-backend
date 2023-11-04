import  generateDataTransferObject  from '@utils/generateDto';
import { RequestHandler } from "express";
import prismaClient from "@prismaclient/client";
import { Prisma, tITemStatus, UserType, Vehicle } from "@prisma/client";
import { parsePagination, parseQueryString } from '@utils/pagination';
import { tVehicleQuerySchema, tVehicleSchema } from '@validators/vehicle';
import { isArray, isEmpty, isNull, isUndefined } from 'lodash';
import { appUserTypes } from '@utils/constants';
import { getDistance, vehicle_time_filter_query } from '@utils/functions';
import { captureException } from '@sentry/node';
import { WithUserHeaders } from '@middleware/withUser';

export const createVehicle:RequestHandler = async(req, res)=>{
    const {vehicle, pictures} = req.body as {vehicle: Vehicle, pictures: string[]}
    tVehicleSchema.required({
        station_id: true,
    }).parseAsync(vehicle).then(async (newDataVehicle)=>{

        const user_id = req.headers.user_id  as unknown as string

        await prismaClient.vehicle.create({
            data: {
                ...newDataVehicle,
                user_id,
                VehiclePictures: !isArray(pictures) ? undefined : {
                    createMany: {
                        data: pictures?.map((pic)=>({
                            url: pic
                        }))
                    }
                },
                pictures
            }
        }).then((vehicle)=>{
            res.status(201).send(generateDataTransferObject(vehicle, "Vehicle Created Successfullu", "success"))
        }).catch((e)=>{
            captureException(e)
            res.status(500).send(generateDataTransferObject(e, "An error occured creating the vehicle", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "An error occured", "error"))
    })

    
    
}


export const getVehiclesByStatus:RequestHandler = async(req, res)=>{

    const status = req.query.status as unknown as tITemStatus
    const { page, size} = parseQueryString(req.query)
    const pagination = parsePagination(page, size)

    await prismaClient.vehicle.findMany({
        where: {
            status: {
                equals: status,
                not: "INACTIVE"
            }
        },
        ...pagination
    }).then((vehicles)=>{
        res.status(200).send(generateDataTransferObject(vehicles, "Vehicles fetched successfully", "success"))
    }).catch((e)=>{
        captureException(e)
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching vehicles", "error"))
    })
}



export const updateVehicleDetails:RequestHandler = async(req, res)=>{

    tVehicleSchema.parseAsync(req.body).then(async (updatedVehicle)=>{
        const user_id = req.headers.user_id as string
        const _id = req.query.vehicle_id as string
        
        if(isEmpty(_id)) return res.status(400).send(generateDataTransferObject(null, "Invalid vehicle id", "error"))
    
        await prismaClient.vehicle.findFirstOrThrow({
            where: {
                id: _id,
                user_id
            }
        }).then(async ()=>{
            await prismaClient.vehicle.update({
                where: {
                    id: _id
                },
                data: updatedVehicle
            }).then((updated)=>{
                res.status(200).send(generateDataTransferObject(updated, "Vehicle updated successfully", "success"))
            })
        }).catch((e)=>{
            res.status(400).send(generateDataTransferObject(e, "Unable to update vehicle", "error"))
        })
    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid vehicle data", "error"))
    })
}



/**
 * @name withinRadius
 * @description fetches vehicles within a radius of a given location
 * @param {number} latitude - latitude of the location
 * @param {number} longitude - longitude of the location
 * @param {string} user_type - type of user
 */

export const withinRadius = (user_type: string, latitude: number, longitude: number, start_date_time?: string, end_date_time?: string ): Promise<Vehicle[]|null> => {
    return new Promise((res, rej)=>{
        if(isUndefined(latitude) || isUndefined(longitude)) return rej("Invalid location")
        if(isEmpty(user_type)) return rej("Invalid user type")
        prismaClient.vehicle.findMany({
            where: vehicle_time_filter_query(start_date_time, end_date_time, "CUSTOMER") ?? {},
            include: {
                host: {
                    include: {
                        market: true,
                        sub_market: true,
                    }
                },
                VehiclePictures: {
                    select: {
                        url: true
                    }
                },
                station: true
            }
        }).then((vehicles)=>{
            const inRadius = vehicles.filter((vehicle)=>{
                if (isNull(vehicle.station.longitude) || isNull(vehicle.station.latitude)) return false
                const distance = getDistance({
                    lat: latitude,
                    lng: longitude 
                }, {
                    lat: vehicle.station.latitude ,
                    lng: vehicle.station.longitude
                })
                return distance <= 5
            })
            res(inRadius)
        }).catch((e)=>{
            rej(e)
        })
    })

}


export const fetchVehicles:RequestHandler = async(req, res)=>{
    const { user_id, user_type, uid, role } = req.headers as WithUserHeaders
    tVehicleQuerySchema.parseAsync(req.query).then(async (query)=>{
        const {page, size, latitude, longitude, host_code, market_id, station_id, sub_market_id, vehicle_id, start_date_time, end_date_time, status, sort, search, sort_by, user_id  } = query
      
        if ((isUndefined(longitude) || isUndefined(latitude)) || !isEmpty(host_code) || user_type === "HOST" || !isEmpty(vehicle_id)) {
           
            await prismaClient.vehicle.findMany({
                where: {
                    station_id,
                    user_id,
                    host: {
                        uid: role === "admin" ? undefined : user_type === appUserTypes.host ? uid : undefined,
                        market_id,
                        sub_market_id,
                        handle: host_code,
                    },
                    id: vehicle_id,
                    status: {
                        not: "INACTIVE",
                        equals: status ?? undefined,
                    },
                    OR: isEmpty(search) ? undefined : [
                        {
                            model: {
                                contains: search ?? undefined,
                                mode: "insensitive"
                            },
                        },
                        {
                            make: {
                                contains: search ?? undefined,
                                mode: "insensitive"
                            }
                        },
                        {
                            plate: {
                                contains: search ?? undefined,
                                mode: "insensitive"
                            }
                        }
                    ],
                    ...vehicle_time_filter_query(start_date_time, end_date_time, user_type, vehicle_id)
                },
                skip: user_type === "CUSTOMER" ? undefined : (page-1) * size,
                take: user_type === "CUSTOMER" ? undefined : size,
                include: {
                    host: {
                        include: {
                            market: true,
                            sub_market: true,
                        }
                    },
                    VehiclePictures: {
                        select: {
                            url: true
                        }
                    },
                    station: true
                },
                orderBy: {
                    [sort_by]: sort ?? "desc"
                }
            }).then((vehicles)=>{
                res.status(200).send(generateDataTransferObject(vehicles, "Vehicles fetched successfully", "success"))
            }).catch((e)=>{
                captureException(e)
                res.status(500).send(generateDataTransferObject(e, "An error occured fetching vehicles", "error"))
            })
        }else {
            await withinRadius(user_type, latitude, longitude, start_date_time, end_date_time).then((vehicles)=>{
                res.status(200).send(generateDataTransferObject(vehicles, "Vehicles fetched successfully", "success"))
            }).catch((e)=>{
                captureException(e)
                res.status(500).send(generateDataTransferObject(e, "An error occured fetching vehicles", "error"))
            })
        }

        

    }).catch((e)=>{
        res.status(400).send(generateDataTransferObject(e, "Invalid query", "error"))
    })
}

export const getVehicleList: RequestHandler = async (req, res) =>{
    const user_id = req.headers.user_id as string 


    try {
        const vehicles = await prismaClient.vehicle.findMany({
            where: {
                user_id,
                status: {
                    not: "INACTIVE"
                }
            },
            select: {
                make: true,
                model: true,
                year: true,
                id: true
            }
        })
    
        const parsed = vehicles.map((vehicle)=>{
            return {
                id: vehicle.id,
                name:`${vehicle.year} ${vehicle.make} ${vehicle.model}`
            }
        })
    
        res.status(200).send(generateDataTransferObject(parsed, "Vehicles fetched successfully", "success"))
    } catch (e)
    {
        captureException(e, (scope)=>{
            scope.setTag("message", "Unable to get vehicle list")
            return scope
        })
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching vehicles", "error"))
    }

    
}