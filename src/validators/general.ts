import { pagination_query_schema } from "@utils/functions";
import { z } from "zod";

export const paginationQuerySchema = z.object({
    id: z.string().optional(),
    page: pagination_query_schema.page,
    size: pagination_query_schema.size,
})