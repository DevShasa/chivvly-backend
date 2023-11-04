import { withAdmin, withUser } from '@middleware/withUser'
import { Router } from 'express'
import * as PayoutController from '../controllers/payout'

const router = Router()


/**
 * @todo add docs
 */

router.post("/",withUser, PayoutController.addPayoutMethod)

router.get("/resume", withUser,  PayoutController.resumeStripeOnboarding)

router.get("/",withUser, PayoutController.getHostPayouts)

router.post("/mpesa", withUser, withAdmin, PayoutController.sendMPesaPayout)

router.post("/mtn", withUser, withAdmin, PayoutController.sendMTNPayout)

router.post("/withdrawals", withUser, PayoutController.createWithdrawalRequest)

router.get("/withdrawals", withUser, PayoutController.fetchWithdrawalRequests)

router.patch("/withdrawals", withUser, PayoutController.updateWithdrawalStatus)

router.get("/reports", withUser, PayoutController.fetchPayoutReports)

export default router
