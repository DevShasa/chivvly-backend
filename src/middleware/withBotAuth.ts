import { verifyAppJWT } from "@utils/functions"
import { RequestHandler } from "express"

/**
 * @name withBotAuth 
 * @description Middleware to verify request is from a bot
 */

export const withBotAuth: RequestHandler = (req, res, next) => {
    const { authorization } = req.headers
    const jwt = authorization?.split(" ")[1]
    if (!jwt) return res.status(401).send({ message: "Unauthorized" })
    try {
        const isJwtValid = verifyAppJWT(jwt)
        if(isJwtValid) return next()
        return res.status(401).send({ message: "Unauthorized" })

    } catch (e) {
        return res.status(401).send({ message: "Unauthorized" })
    }
}