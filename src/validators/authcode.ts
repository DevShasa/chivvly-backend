import { pagination_query_schema } from "@utils/functions";
import { z } from "zod";

/**
 * @name tAuthCodeSchema 
 * @description zod schema for auth code
 */
export const tAuthCodeSchema = z.object({
    host_id: z.string().uuid().optional(),
    code: z.string().optional(),
    vehicle_id: z.string().uuid().optional(),
    status: z.enum(["ACTIVE", "EXPIRED", "REVOKED", "NONACTIVE"]).optional(),
    expiry_date_time: z.string().datetime().optional()
})


/**
 * @name tAuthCodeQuerySchema 
 * @description zod schema for auth code query
 */

export const tAuthCodeQuerySchema = z.object({
    status: z.enum(['ACTIVE', 'NONACTIVE', 'EXPIRED', 'REVOKED']).optional(),
    page: pagination_query_schema.page,
    size: pagination_query_schema.size,
    auth_code_id: z.string().uuid().optional(),
    code: z.string().length(6, {
        message: "Auth code must be 6 characters long"
    }).optional(),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sort_by: z.enum(["created_at", "expiry_date_time"]).optional().default("created_at"),
    search: z.string().optional()
})