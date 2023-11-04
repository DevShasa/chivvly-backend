import { captureException } from "@sentry/node"
import { auth } from "src/config/firebase/firebaseConfig"


/**
 * @name createToken 
 * @description create a custom token from a uid for testing purposes
 */
export const createToken = async (user_type: "HOST" | "CUSTOMER", is_admin?: boolean) => {
    const app = auth?.[user_type === "CUSTOMER" ? "customer" : "host"]
    try{
        const token = await app?.createCustomToken(
            is_admin ? process.env.TEST_ADMIN_UID as string :
            user_type === "CUSTOMER" ? process.env.TEST_CUSTOMER_UID as string : process.env.TEST_HOST_UID as string,
            is_admin  ? {
                admin: true
            } : undefined
        )
        return token
    }catch(e){
        captureException(e)
        console.log(e)
        console.log("Unable to create token")
        return null
    }
    
}