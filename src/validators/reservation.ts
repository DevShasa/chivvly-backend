import { customIsNumber, pagination_query_schema, theEndOfTodayEpoch, theStartOfTodayEpoch } from "@utils/functions";
import { z } from "zod";

export const tReservationSchema = z.object({
    user_id: z.string().uuid().optional(),
    vehicle_id: z.string().uuid().optional(),
    start_date_time: z.string().optional(),
    end_date_time: z.string().optional(),
    duration: z.number().optional(),
    payment_id: z.string().uuid().optional(),
    status: z.enum(["COMPLETE","ACTIVE", "UPCOMING", "CANCELLED", "OTHER"]).optional(),
    type: z.enum(["HOURLY", "DAILY", "BLOCK", "HOST"]).optional(),
    payment_type_id: z.string().uuid().optional()
})


/**
 * @name tReservationQuerySchema 
 * @description - a zod schema for the reservation query type
 */

export const tReservationQuerySchema = z.object({
    page: pagination_query_schema.page,
    size: pagination_query_schema.size,
    reservation_id: z.string().uuid().optional(),
    status: z.enum(["COMPLETE", "ACTIVE", "UPCOMING", "CANCELLED", "OTHER", "PENDING_CONFIRMATION"]).optional(),
    search: z.string().optional(),
    station_id: z.string().uuid().optional(),
    sub_market_id: z.string().uuid().optional(),
    market_id: z.string().uuid().optional(),
    vehicle_id: z.string().uuid().optional(),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sort_by: z.enum(["created_at", "start_date_time", "end_date_time", "payment"]).optional().default("created_at"),
    user_id: z.string().uuid().optional()
})

/**
 * @name tQueryCalendarSchema 
 * @description - a zod schema for the calendar query type
 */

export const tQueryCalendarSchema = z.object({
    // explanation: the defaults are set to the start and end of the day, so that on initial loads of the calendar, we can have all the reservations for the day send down to the client
    start_time: z.string().optional().default(new Date().setUTCHours(0,0,0,0).toString()), 
    end_time: z.string().optional().default(new Date().setUTCHours(23,59,59,999).toString()),
    event_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
})


/**
 * @name tUpdateCalendarSchema
 * @description - a zod schema for the calendar update type
 */

export const tUpdateCalendarSchema = z.object({
    status: z.enum(["COMPLETE", "ACTIVE", "UPCOMING", "CANCELLED", "OTHER"])
})