import { tPaymentStatus } from "@prisma/client"

interface event_type { data: { object: { id: string } }; type: string }


export const parsePaymentIntentEvents  = (event: event_type) : {payment_intent_id: string, event: tPaymentStatus} | null =>{
    const payment_intent_id = event.data.object.id
    let status = event.type 
    status = status === "payment_intent.succeeded" ? "SUCCEEDED" : status === "payment_intent.canceled" ? "CANCELLED" : status === "payment_intent.requires_action" ? "REQUIRES_ACTION" : status === "payment_intent.processing" ? "PROCESSING" : "FAILED"
    return {payment_intent_id, event: status as tPaymentStatus}
}