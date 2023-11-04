import { z } from "zod";


export const tIssueSchema = z.object({
    reservation_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    status: z.enum(["RESOLVED", "PENDING", "DUPLICATE"]).optional(),
    complaint: z.string().optional()
})
