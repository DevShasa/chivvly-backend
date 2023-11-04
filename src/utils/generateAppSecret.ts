import { captureException } from '@sentry/node'
import crypto from 'crypto'
(async()=>{
    try {
        const secret = crypto.getRandomValues(new Uint8Array(32))
        const secretString = Buffer.from(secret).toString('base64')
        console.log("Here is the secret::", secretString)
    } catch (e) {
        captureException(e)
        console.log("Something went  wrong", e)
    }
})()