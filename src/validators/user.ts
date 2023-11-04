import { z } from "zod";

/**
 * @name tUser 
 * @description - a zod schema for the user type
 */
export const tUser = z.object({
    fname: z.string().optional(),
    lname: z.string().optional(),
    email: z.string().email("Not a valid email").optional(),
    handle: z.string().min(3, {
        message: "handle must have a min of 3 characters"
    }).optional(),
    phone: z.string().min(5, {
        message: "Invalid phone number parsed"
    }).optional(),
    profile_pic_url: z.string().url({
        message: "Use a valid user url"
    }).optional(),
    market_id: z.string().uuid({
        message: "Invalid market id"
    }).optional(),
    sub_market_id: z.string().uuid({
        message: "Invalid submarket id provided"
    }).optional(),
    user_type: z.enum(["CUSTOMER", "HOST"]).optional(),
    status: z.enum(["ACTIVE", "NONACTIVE", "BANNED", "SUSPENDED"]).optional(),
    connected_account_id: z.string().optional(),
    customer_id: z.string().optional(),
    description: z.string().optional(),
    // uid: z.string().optional() gets parsed as a header
})


/**
 * @name tUserDriverCredentials
 * @description - a zod schema for the user driver credentials type
 */

export const tUserDriverCredentials = z.object({
    drivers_licence_front: z.string().optional(),
    drivers_licence_back: z.string().optional(),
})


/**
 * @name createInviteSchema
 */

export const createInviteSchema = z.object({
    email: z.string().email("Not a valid email").nonempty(),
})


/**
 * @name acceptInviteSchema 
 */

export const acceptInviteSchema = z.object({
    email: z.string().email("Not a valid email").nonempty(),
    code: z.string().nonempty(),
})