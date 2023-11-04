import { body} from "express-validator";
import { z } from "zod";

export const validateNePaymentType = [
    body("status").isIn(["Active","Nonactive"]),
    body("payment_type").isIn(["amex","diners", "jcb","mastercard","unionpay","visa","mpesa","paypal","unknown"])
]

export const tPaymentType = z.object({
    user_id: z.string().uuid({
        message: "User id must be a valid uuid"
    }).optional(),
    status: z.enum(["ACTIVE","NONACTIVE"]).optional(),
    details: z.string().optional(),
    stripe_payment_method_id: z.string().optional(),
    type: z.enum(["STRIPE", "MPESA", "PAYPAL", "UNKNOWN"]).default("STRIPE"),
})


export const tMobileMoneyPaymentType = z.object({
    type: z.enum(["MPESA", "MTN"]),
    phone_number: z.number().positive(), // number plus country code, validation on the front end
})