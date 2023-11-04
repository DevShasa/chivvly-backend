import { withUser } from "@middleware/withUser";
import express from "express";
import * as IssuesController from "../controllers/issues";

const router = express.Router()

  /**
   * @openapi
   * '/api/issues':
   *  post:
   *     tags:
   *     - Issues
   *     summary: Create a new issue 
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - market_id
   *               - complaint
   *             properties:
   *               market_id:
   *                 type: string
   *               complaint:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/",withUser,IssuesController.createNewIssue)

/**
 * @openapi
 * '/api/issues/':
 *  get:
 *     tags:
 *     - Issues
 *     summary: Fetch all issues
 *     responses:
 *       200:
 *         description: Fetched issues successfully
 *       500:
 *         description: internal server error
 */
router.get("/", withUser, IssuesController.fetchIssues)

export default router