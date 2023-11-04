import { isValidLatitude, isValidLongitude, pagination_query_schema } from "@utils/functions";
import { z } from "zod";



export const tStation = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    sub_market_id: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    latitude: z.custom<number>(isValidLatitude).optional(),
    longitude: z.custom<number>(isValidLongitude).optional(),
})


export const tMarket = z.object({
    country: z.string().optional(),
    name: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    currency: z.enum(["KES", "USD", "ZSD", "GBP", "ZAR", "THB", "CAD", "RWF"]).optional(),
})

export const tSubMarket = z.object({
    market_id: z.string().uuid({
        message: "Invalid marker id"
    }).optional(),
    name: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
})


/**
 * @name tStationQuerySchema
 * @description - a zod schema for the station query type
 */
export const tStationQuerySchema = z.object({
    page: pagination_query_schema.page,
    size: pagination_query_schema.size,
    station_id: z.string().uuid().optional(),
    search: z.string().optional(),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sort_by: z.enum(["created_at", "name"]).optional().default("created_at"),
    user_id: z.string().uuid().optional(),
})


export const tLocationQuerySchema = z.object({
    page: z.string().optional(),
    size: z.string().optional(),
    id: z.string().uuid().optional(),
    market_id: z.string().uuid().optional()
})