import { withUser } from "@middleware/withUser";
import express from "express"
import * as VehiclesController from "../controllers/vehicles";
const router = express.Router()


  /**
   * @openapi
   * '/api/vehicles':
   *  post:
   *     tags:
   *     - Vehicles
   *     summary: Create a new vehicle
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - vehicle_type
   *               - market_id
   *               - seats
   *               - color
   *               - transmission
   *               - year
   *               - make
   *               - model
   *               - hourly_rate
   *               - currency
   *             properties:
   *               vehicle_type:
   *                 type: string
   *               market_id:
   *                 type: string
   *               seats:
   *                 type: integer
   *               color:
   *                 type: string
   *               plate:
   *                 type: string
   *               transmission:
   *                 type: string
   *               year:
   *                 type: integer
   *               longitude:
   *                 type: string
   *               latitude:
   *                 type: string
   *               status:
   *                 type: integer
   *               make:
   *                 type: string
   *               model:
   *                 type: string
   *               hourly_rate:
   *                 type: integer
   *               currency:
   *                 type: string
   *               tracking_device_id:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/", withUser, VehiclesController.createVehicle)


  /**
   * @openapi
   * '/api/vehicles/:vehicleId':
   *  patch :
   *     tags:
   *     - Vehicles
   *     summary: Create a new vehicle
   *     parameters:
   *      - name: vehicleId
   *        in: path
   *        description: vehicle id
   *        required: true
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - vehicle_type
   *               - market_id
   *               - seats
   *               - color
   *               - transmission
   *               - year
   *               - make
   *               - model
   *               - hourly_rate
   *               - currency
   *             properties:
   *               vehicle_type:
   *                 type: string
   *               market_id:
   *                 type: string
   *               seats:
   *                 type: integer
   *               color:
   *                 type: string
   *               plate:
   *                 type: string
   *               transmission:
   *                 type: string
   *               year:
   *                 type: integer
   *               longitude:
   *                 type: string
   *               latitude:
   *                 type: string
   *               status:
   *                 type: integer
   *               make:
   *                 type: string
   *               model:
   *                 type: string
   *               hourly_rate:
   *                 type: integer
   *               currency:
   *                 type: string
   *               tracking_device_id:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.put("/",withUser, VehiclesController.updateVehicleDetails)
router.patch("/",withUser, VehiclesController.updateVehicleDetails)

router.get("/", withUser, VehiclesController.fetchVehicles);
router.get("/list", withUser, VehiclesController.getVehicleList);

export default router 