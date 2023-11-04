import { z } from "zod";

export const tMailWithContent = z.object({
    to: z.string().email(),
    subject: z.string(),
    html: z.string().optional(),
    text: z.string().optional()
})


export const tMailWithTemplate = z.object({
    to: z.string().email(),
    template_name: z.string(),
    template_data: z.any().optional()
})