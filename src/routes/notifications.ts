import { Router } from "express";

import * as NotificationController from "../controllers/notifications";

const router = Router()

router.post("/customer-onboarding-scan", NotificationController.customerOnBoardingScanHandler )

router.post("/host-onboarding-scan", NotificationController.hostOnBoardingScanHandler )

router.post("/reservation-reminders", NotificationController.reservationsIn5MinutesHandler )

export default router