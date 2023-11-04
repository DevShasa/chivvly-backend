import { z } from "zod";



export const userQuerySchema = z.object({
    market_id: z.string().uuid().optional(),
    sub_market_id: z.string().uuid().optional(),
    sort_by: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    size: z.string().optional().default("10").transform((val)=>parseInt(val)),
    page: z.string().optional().default("1").transform((val)=>parseInt(val)),
    search: z.string().optional().default(""),
    user_type: z.enum(["HOST", "CUSTOMER", "ADMIN"]).optional(),
    user_id: z.string().uuid().optional(),
    email: z.string().optional(),
    handle: z.string().optional(),
    fname: z.string().optional(),
    lname: z.string().optional(),
    uid: z.string().uuid().optional(),
})