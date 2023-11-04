import { customIsNumber, numeric_string_to_number, pagination_query_schema } from "@utils/functions";
import { z } from "zod";


/**
 * @name tVehicleSchema
 * @description - a zod schema for the vehicle type
 */
export const tVehicleSchema = z.object({
    user_id: z.string().uuid().optional(),
    station_id: z.string().uuid().optional(),
    color: z.string().optional(),
    seats: z.number().optional(),
    plate: z.string().optional(),
    transmission: z.string().optional(), 
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    hourly_rate: z.number().optional(),
    tracking_device_id: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    pictures: z.array(z.string()).optional(),
})


/**
 * @name tVehicleQuerySchema
 * @description - a zod schema for the vehicle query type
 */

export const tVehicleQuerySchema = z.object({
    latitude: numeric_string_to_number.optional(),
    longitude: numeric_string_to_number.optional(),
    host_code: z.string().optional(),
    vehicle_id: z.string().uuid().optional(),
    station_id: z.string().uuid().optional(),
    sub_market_id: z.string().uuid().optional(),
    market_id: z.string().uuid().optional(),
    page: pagination_query_schema.page,
    size: pagination_query_schema.size,
    start_date_time: z.string().optional(),
    end_date_time: z.string().optional(), 
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    search: z.string().optional(), 
    sort_by: z.enum(["hourly_rate", "year", "make", "model", "created_at"]).optional().default("created_at"),
    user_id: z.string().uuid().optional(),
})