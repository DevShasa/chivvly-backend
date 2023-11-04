import { withAdmin, withUser } from "@middleware/withUser";
import express from "express";
import * as UsersController from "../controllers/users";

const router = express.Router()


  /**
   * @openapi
   * '/api/users':
   *  post :
   *     tags:
   *     - Users
   *     summary: Create a new user after user has logged into firebase
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fname
   *               - lname
   *               - email
   *               - phone
   *               - market_id
   *               - status
   *               - user_type
   *             properties:
   *               company_id:
   *                 type: string
   *               handle:
   *                 type: string
   *               fname:
   *                 type: integer
   *               lname:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *               profile_pic_url:
   *                 type: integer
   *               market_id:
   *                 type: string
   *               connected_account_id:
   *                 type: integer
   *               status:
   *                 type: string
   *               user_type:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/", UsersController.createNewUser)

  /**
   * @openapi
   * '/api/users':
   *  post :
   *     tags:
   *     - Users
   *     summary: Update User details
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fname
   *               - lname
   *               - email
   *               - phone
   *               - market_id
   *               - status
   *               - user_type
   *             properties:
   *               company_id:
   *                 type: string
   *               handle:
   *                 type: string
   *               fname:
   *                 type: integer
   *               lname:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *               profile_pic_url:
   *                 type: integer
   *               market_id:
   *                 type: string
   *               connected_account_id:
   *                 type: integer
   *               status:
   *                 type: string
   *               user_type:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.put("/",withUser, UsersController.updateUserDetails)


  /**
   * @openapi
   * '/api/users/user':
   *  get :
   *     tags:
   *     - Users
   *     summary: Get User details
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.get("/",withUser, UsersController.getUserDetails)

router.get("/onboarding", withUser, UsersController.onBoarding)

router.put("/drivercredentials", withUser, UsersController.updateDriversLicense)

router.patch("/drivercredentials", withUser, UsersController.updateDriversLicense) // using both for easier interfacing with the frontend for now

router.post("/admin/invite", withUser, withAdmin, UsersController.createInvite)

router.get("/dashboard", withUser, UsersController.getDashboardData)

// // accepting invites is a public route
// router.patch("/admin/accept", UsersController.acceptInvite)

export default router