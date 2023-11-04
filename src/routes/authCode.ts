import express from "express";
import * as AuthCodeController from "../controllers/authCode"

const router = express.Router()

  /**
   * @openapi
   * '/api/authcode/:authCodeId':
   *  get :
   *     tags:
   *     - Auth Code
   *     summary: Get Auth code status
   *     parameters:
   *      - name: authCodeId
   *        in: path
   *        description: The id of the auth code
   *        required: true
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.get("/",AuthCodeController.fetchAuthCodes)


  /**
   * @openapi
   * '/api/authcode':
   *  post :
   *     tags:
   *     - Auth Code
   *     summary: Generate a new auth code
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exp
   *               - vehicle
   *             properties:
   *               exp:
   *                 type: string
   *               vehicle_id:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.post("/", AuthCodeController.activateAuthCode);

router.post("/request", AuthCodeController.requestAuthcode)

  /**
   * @openapi
   * '/api/authcode':
   *  patch :
   *     tags:
   *     - Auth Code
   *     summary: Change status of auth code
   *     requestBody:
   *      required: true
   *      content:
   *        application/json:
   *           schema:
   *             type: object
   *             required:
   *               - authcodeId
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *               authcodeId:
   *                 type: string
   *     responses:
   *      200:
   *        description: Success
   *      500:
   *        description: Server error
   *      400:
   *        description: Bad request
   */
router.put("/",AuthCodeController.changeAuthCodeStatus)


router.patch("/",AuthCodeController.changeAuthCodeStatus)


export default router

