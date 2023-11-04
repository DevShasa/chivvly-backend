import { pagination_query_schema } from "@utils/functions";
import { z } from "zod";


/**
 * @name tPayoutQuerySchema 
 * @description payout query schema
 */

export const tPayoutQuerySchema = z.object({
    page: pagination_query_schema.page,
    size: pagination_query_schema.size,
    status: z.enum(["PROCESSING", "CANCELLED", "FAILED", "SUCCEEDED", "HOLD"]).optional()
})


/**
 * @name tSendPayoutSchema 
 * @description payout schema
 */
export const tSendPayoutSchema = z.object({
    amount: z.number().positive().int().optional(),
    user_id: z.string().uuid({
        message: "User id must be a valid uuid"
    }),
})

/**
 * @name tNewPayoutMethodSchema
 * @description payout method schema, used to validate the body when creating a new payout method
 */
export const tNewPayoutMethodSchema = z.object({
    type: z.enum(["MPESA", "MTN", "BANK_ACCOUNT", "PAYPAL"]),
    details: z.object({
        account_number: z.string().optional(),
        routing_number: z.string().optional(),
        id_number: z.string().optional(),
        id_type: z.string().optional(),
        country: z.string().optional(),
        city_state_province: z.string().optional(),
        address: z.string().optional(),
        phone_number: z.string().optional(),
        provider: z.enum(["MPESA", "MTN"]).optional(),
        type: z.enum(["MTN", "MPESA"]).optional(),
    })
})


export const tCreateWithdrawalRequestSchema = z.object({
    amount: z.number().positive().int(),
    payout_method_id: z.string().uuid()
})


/**
 * @name tFetchWithdrawalRequestSchema
 * @description validate the query params when fetching withdrawal requests
 */
export const tFetchWithdrawalRequestSchema = z.object({
    page: pagination_query_schema.page.optional(),
    size: pagination_query_schema.size.optional(),
    status: z.enum(["PENDING", "APPROVED", "CANCELLED", "FAILED", "COMPLETED"]).optional(),
    payout_method_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    withdrawal_request_id: z.string().uuid().optional(),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sort_by: z.enum(["created_at", "amount"]).optional().default("created_at"),
    search: z.string().optional()
})


export const tUpdateWithdrawalBodySchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "CANCELLED", "FAILED", "COMPLETED"]),
    id: z.string().uuid()
})