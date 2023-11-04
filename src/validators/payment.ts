/**
 * @todo add zod schemas for paymenta
 */

import { pagination_query_schema } from "@utils/functions";
import { z } from "zod";

/**
 * @name tPaymentQuerySchema
 * @description - a zod schema for the payment query type
 */

export const tPaymentQuerySchema = z.object({
  stripe_payment_id: z.string().optional(),
  payment_type_id: z.string().uuid().optional(),
  page: pagination_query_schema.page, // probably won't need this but incase pagination is required in the future
  size: pagination_query_schema.size, // probably won't need this but incase pagination is required in the future
});


/**
 * @name tMPesaPaymentIntentSchema
 * @description - a zod schema for the mpesa payment intent type
 */

export const tMPesaPaymentIntentSchema = z.object({
  amount: z.number().refine((val)=>val > 0, {message: "Amount must be greater than 0"}),
  vehicle_id: z.string().uuid(),
  payment_type_id: z.string().uuid(),
  reservation_id: z.string().uuid().optional(),
})

export const tCreateMTNPaymentIntent = z.object({
  amount: z.number().refine((val)=>val > 0, {message: "Amount must be greater than 0"}),
  vehicle_id: z.string().uuid(),
  payment_type_id: z.string().uuid(),
  reservation_id: z.string().uuid().optional(),
})
