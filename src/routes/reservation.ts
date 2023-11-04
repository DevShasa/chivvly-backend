import { withUser } from "@middleware/withUser";
import express from "express";
import * as ReservationController from "../controllers/reservation";

const router = express.Router()
  /**
   * @openapi
   * '/api/reservation':
   *  post:
   *     tags:
   *     - Reservation
   *     summary: Create a new reservation
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - location_id
   *               - vehicle_id
   *               - start_date_time
   *               - end_date_time
   *               - hourly_rate
   *               - currency
   *               - duration
   *               - payment_id
   *               - status
   *             properties:
   *               location_id:
   *                 type: string
   *               vehicle_id:
   *                 type: string
   *               start_date_time:
   *                 type: string
   *               end_date_time:
   *                 type: string
   *               total_cost:
   *                 type: integer
   *               duration:
   *                 type: integer
   *               payment_id:
   *                 type: string
   *               status:
   *                 type: string
   *               hourly_rate:
   *                 type: integer
   *               currency:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/",withUser,  ReservationController.createReservation)


  /**
   * @openapi
   * '/api/reservation/:reservationId':
   *  patch:
   *     tags:
   *     - Reservation
   *     summary: Modify reservation
   *     parameters:
   *      - name: reservationId
   *        in: path
   *        description: reservation id
   *        required: true
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - location_id
   *               - vehicle_id
   *               - start_date_time
   *               - end_date_time
   *               - hourly_rate
   *               - currency
   *               - duration
   *               - payment_id
   *               - status
   *             properties:
   *               location_id:
   *                 type: string
   *               vehicle_id:
   *                 type: string
   *               start_date_time:
   *                 type: string
   *               end_date_time:
   *                 type: string
   *               total_cost:
   *                 type: integer
   *               duration:
   *                 type: integer
   *               payment_id:
   *                 type: string
   *               status:
   *                 type: string
   *               hourly_rate:
   *                 type: integer
   *               currency:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.put("/", withUser, ReservationController.modifyReservation)


router.patch("/", withUser, ReservationController.modifyReservation)

/**
 * @openapi
 * '/api/reservation':
 *  get:
 *     tags:
 *     - Reservation
 *     summary: Get all reservations
 *     responses:
 *       200:
 *         description: Successfuly fetched reservations
 *       500:
 *         description: internal server error
 */
router.get("/",withUser,  ReservationController.fetchReservations)

router.get("/calendar", withUser, ReservationController.getCalendarData)

router.put("/calendar", withUser, ReservationController.updateCalendarData)

router.patch("/calendar", withUser, ReservationController.updateCalendarData)

router.get("/inspection", withUser, ReservationController.getInspection)

router.put("/inspection", withUser, ReservationController.updateInspection)

router.patch("/inspection", withUser, ReservationController.updateInspection)

router.post("/slot", withUser, ReservationController.blockSlot)

router.delete("/slot", withUser, ReservationController.unblockSlot)

router.post("/cash", withUser, ReservationController.createCashReservation)

router.put("/cash", withUser, ReservationController.updateCashReservation)

export default router