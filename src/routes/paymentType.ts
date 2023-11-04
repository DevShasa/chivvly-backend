import { withUser } from "@middleware/withUser"
import express from "express"
import * as PaymentTypeController from "../controllers/paymentType"
const router = express.Router()

  /**
   * @openapi
   * '/api/paymenttype':
   *  post:
   *     tags:
   *     - Payment Type
   *     summary: Register a payment type for a user
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *               - payment_type
   *             properties:
   *               status:
   *                 type: string
   *               payment_type:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/", withUser, PaymentTypeController.addPaymentMethod)

router.put("/",withUser, PaymentTypeController.updatePaymentType)

router.patch("/",withUser, PaymentTypeController.updatePaymentType)

router.get("/", withUser, PaymentTypeController.getUserPaymentMethods)

export default router