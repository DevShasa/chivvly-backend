import express from 'express'
import * as Mail from "../controllers/mail";


const router  = express.Router()

router.post("/", Mail.mailWithContent)

router.post("/template", Mail.mailWithTemplate)

export default router