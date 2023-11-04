import { auth, config, logger, pubsub } from 'firebase-functions/v1'
import axios from 'axios'

export const generateRandomPlaceholderHandle = (): string => {
    const random = Math.floor(Math.random() * 1000000);
    return `user@${random}`;
}

export const getNames = (name?: string): {fname: string, lname: string} => {
    const names = name?.split(" ")
    const fname = names?.[0]  ? names[0] : ""
    const lname = names?.[1] ? names[1] : ""
    return {fname, lname}
}

export const getPhotoUrl = (name?: string): string => {
    return `https://api.dicebear.com/6.x/initials/png?seed=${name}`
}

// when a new user gets created
exports.createNewUser = auth.user().onCreate(async (user)=>{
    const baseURL = config().api.url // the backend url
    const url = `${baseURL}/api/webhooks/firebase/users/new` // the endpoint to create a new user
    const auth = config().api.auth // the auth token
    const names = getNames(user.displayName)
    const user_object = {
        email: user.email,
        handle: user?.displayName ? user?.displayName : user?.email ? user?.email?.split("@")?.[0] : generateRandomPlaceholderHandle(),
        user_type: "HOST",
        uid: user.uid,
        fname: names?.fname,
        lname: names.lname,
        profile_pic_url: getPhotoUrl(user.displayName ?? user?.email)
    }

    try {
        await axios.post(url, user_object,{
            headers: {
                Authorization: `Bearer ${auth}`,
                'user-type': 'BOT'
            }
        })
        logger.info(`Created new user: ${user_object.email}`)
    } catch (e) {
        logger.error(e) // logs available on firebase
    }
})


// host onboarding scan - every 7 days
exports.hostOnBoardingScan = pubsub. 
schedule('0 9 * * 1')
.timeZone('America/New_York') // will choose later
.onRun(async (context)=>{
    const baseURL = config().api.url // the backend url
    const url = `${baseURL}/api/notifications/host-onboarding-scan` // the endpoint to create a new user
    const auth = config().api.auth // the auth token

    try {
        await axios.post(url, null, {
            headers: {
                Authorization: `Bearer ${auth}`,
            }
        })
        logger.info(`Host onboarding scan completed successfully`)
    } catch (e) {
        logger.error(e)
    }
})