import { parseEvent } from '@middleware/parseEvent';
import express  from 'express';
import * as hooks from "./events"
import { withBotAuth } from '@middleware/withBotAuth';


const router = express.Router()


router.post("/",parseEvent, hooks.stripeWebhookHandler) 

router.post("/mpesa/express", hooks.mpesaExpressWebhookRequestHandler)

router.post("/mpesa/payout", hooks.mpesaPayoutWebhookRequestHandler)

router.post("/mtn/disbursement", hooks.mtnPayoutToHostWebhookRequestHandler);

router.post("/mtn/requesttopay", hooks.mtnRequestToPayWebhookRequestHandler);

router.post("/firebase/users/new", withBotAuth, hooks.firebaseUserCreationWebhookRequestHandler)

export default router