import 'dotenv/config'
import prismaClient from "@prismaclient/client";
import { app_env } from "./constants";


(async ()=>{
    if (app_env !== "testing") return console.log("You can only run this script in testing environment")
    await prismaClient.inspection.deleteMany({})
    await prismaClient.reservation.deleteMany({})
    await prismaClient.vehiclePictures.deleteMany({})
    await prismaClient.authCode.deleteMany({})
    await prismaClient.vehicle.deleteMany({})
    await prismaClient.payment.deleteMany({})
    await prismaClient.paymentTypes.deleteMany({})
    await prismaClient.payout.deleteMany({})
    await prismaClient.withdrawal.deleteMany({})
    await prismaClient.payoutMethod.deleteMany({})
    await prismaClient.driverCredentials.deleteMany({})
    await prismaClient.pushToken.deleteMany({})
    await prismaClient.userSettings.deleteMany({})
    await prismaClient.invitation.deleteMany({})
    await prismaClient.station.deleteMany({})
    await prismaClient.issue.deleteMany({})
    await prismaClient.user.deleteMany({})
    await prismaClient.subMarket.deleteMany({})
    await prismaClient.market.deleteMany({})
    await prismaClient.$disconnect()
})();
