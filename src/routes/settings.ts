import { withUser } from "@middleware/withUser";
import express from "express";
import * as SettingsController from "../controllers/settings";

const router = express.Router()

  /**
   * @openapi
   * '/api/settings':
   *  patch:
   *     tags:
   *     - Settings
   *     summary: Update or create user settings
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - notifications_enabled
   *             properties:
   *               notifications_enabled:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.put("/", withUser ,SettingsController.updateSettings)
router.patch("/", withUser ,SettingsController.updateSettings)

  /**
   * @openapi
   * '/api/settings':
   *  get:
   *     tags:
   *     - Settings
   *     summary: Check user settings
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      404:
   *        description: User does not have any settings
   */
router.get("/", withUser, SettingsController.getSettings)

router.post("/tokens",withUser,  SettingsController.addPushToken)

export default router