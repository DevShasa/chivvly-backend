import { withAuth } from "@middleware/firebaseAuthMiddleware";
import { withUser } from "@middleware/withUser";
import express from "express";
import * as LocationControllers from "../controllers/location";

const router = express.Router()
/**
 * @openapi
 * '/api/market':
 *  get:
 *     tags:
 *     - Location
 *     summary: Fetch all locations
 *     responses:
 *       200:
 *         description: Successfuly fetched locations
 *       500:
 *         description: internal server error
 */



  /**
   * @openapi
   * '/api/location':
   *  post:
   *     tags:
   *     - Location
   *     summary: Create a new market
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - market_id
   *               - address
   *             properties:
   *               market_id:
   *                 type: string
   *               address:
   *                 type: string
   *               building_name:
   *                 type: string
   *               picture_url:
   *                 type: string
   *               directions:
   *                 type: string
   *               longitude:
   *                 type: string
   *               status:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/admin/markets",withAuth, withUser, LocationControllers.createMarket)

router.put("/admin/markets",withAuth, withUser, LocationControllers.updateMarket)


  /**
   * @openapi
   * '/api/location/:locationId':
   *  patch:
   *     tags:
   *     - Location
   *     summary: Update location details
   *     parameters:
   *      - name: locationId
   *        in: path
   *        description: location id
   *        required: true
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - market_id
   *               - address
   *             properties:
   *               market_id:
   *                 type: string
   *               address:
   *                 type: string
   *               building_name:
   *                 type: string
   *               picture_url:
   *                 type: string
   *               directions:
   *                 type: string
   *               longitude:
   *                 type: string
   *               status:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */


  /**
   * @todo add swagger documentation
   */

  router.post("/admin/submarkets", withAuth, withUser, LocationControllers.createSubMarket)

  router.put("/admin/submarkets", withAuth, withUser, LocationControllers.updateSubMarket)

  router.post("/station",withAuth, withUser, LocationControllers.createStation)

  router.put("/station",withAuth, withUser, LocationControllers.updateStation)
  
  router.patch("/station",withAuth, withUser, LocationControllers.updateStation)

  router.get("/markets", LocationControllers.getMarkets)

  router.get("/admin/markets", withAuth, withUser, LocationControllers.getMarkets)

  router.get("/submarkets", LocationControllers.getSubMarkets)

  router.get("/admin/submarkets", withAuth, withUser, LocationControllers.getSubMarkets)

  router.get("/stations",withAuth, withUser, LocationControllers.getStations)

export default router