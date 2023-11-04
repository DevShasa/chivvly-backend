import { Router } from "express";
import * as adminController from "../controllers/admin"
import { withUser } from "@middleware/withUser";


const router = Router()

router.get("/users",withUser, adminController.fetchUserData)

router.get("/user", withUser, adminController.fetchUser)

export default router