import Expo from 'expo-server-sdk'

const app_env = process.env.APP_ENV || 'development'

const expo = new Expo({
    accessToken: app_env === "production" ? process.env.EXPO_ACCESS_TOKEN as string : process.env.DEV_EXPO_ACCESS_TOKEN as string,
})

export const expo_app_scheme =  ["production", "staging"].includes(app_env) ? process.env.MOBILE_APP_SCHEME as string : process.env.DEV_MOBILE_APP_SCHEME as string

export default expo