import { body } from "express-validator";
import { z } from "zod";


export const validateSettings= [
    body("notifications_enabled").isIn(["true","false"])
]

export const tSettingsSchema = z.object({
    notifications_enabled: z.boolean().optional(),
    tracking_enabled: z.boolean().optional()
})

export const tPushTokenSchema = z.object({
    token: z.string()
})
