import express from "express";
import { withUser } from "@middleware/withUser";
import * as PaymentsController from "../controllers/payments";


const router = express.Router()

/**
 * @todo add docs
 */
router.post("/", withUser, PaymentsController.createStripePaymentIntent)

router.post("/mpesa", withUser, PaymentsController.createMpesaPaymentIntent)

router.post("/mtn", withUser, PaymentsController.createMTNPaymentIntent)

router.get("/confirm", withUser, PaymentsController.confirmPayment)

router.get("/", withUser, PaymentsController.fetchPayments)

router.get("/report", withUser, PaymentsController.getEarningsReport)

export default router