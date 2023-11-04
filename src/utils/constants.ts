/**
 * @name authCodeExpiresIn
 * @description - the time in milliseconds that an auth code is valid for probably needs to be longer
 */

export const authCodeExpiresIn = 5 * 60 * 1000;

/**
 * @name userTypes
 * @description - the user types that are allowed
 */
export const appUserTypes = {
    host: "HOST",
    customer: "CUSTOMER",
}


/**
 * @name reservationStatusColor
 * @description the color of the reservation
 */

export const reservationStatusColor: {
    [key: string]: string
} = {
    ACTIVE: "#008000",
    COMPLETE: "#0000FF",
    UPCOMING: "#D3D3D3",
    CANCELLED: "#FF0000",
    PENDING_CONFIRMATION: "#FFA500" 
}


type tAppEnv = "development" | "testing" | "staging" | "production";
/**
 * @name app_env 
 * @description - the environment that the app is running in
 */
export const app_env: tAppEnv = process.env.APP_ENV as tAppEnv || "development";

/**
 * @name control_panel_url
 * @description - the url of the host control panel
 */
export const control_panel_url = ["testing", "development"].includes(app_env) ? process.env.DEV_CONTROL_PANEL_URL as string : process.env.CONTROL_PANEL_URL as string;


/**
 * @name mpesa_consumer_key
 */
export const mpesa_consumer_key = process.env.MPESA_CONSUMER_KEY as string;

/**
 * @name mpesa_consumer_secret
 * @description - the mpesa consumer secret
 */
export const mpesa_consumer_secret = process.env.MPESA_CONSUMER_SECRET as string;

/**
 * @name mpesa_shortcode
 * @description - the mpesa shortcode
 */
export const mpesa_shortcode = parseInt(process.env.MPESA_SHORT_CODE as string);

/**
 * @name mpesa_passkey
 * @description - the mpesa passkey
 */
export const mpesa_passkey = process.env.MPESA_PASSKEY as string;

/**
 * @name mpesa_url 
 * @description - mpesa's api url
 */
export const mpesa_url = process.env.MPESA_URL as string;

/**
 * @name app_url
 * @description - the url of the app
 */
export const app_url = ["testing", "development"].includes(app_env) ? process.env.DEV_APP_URL as string : process.env.APP_URL as string;



// ------------------------------- MAGIC NUMBERS --------------------------------------------

/**
 * @name SECONDS_IN_A_MONTH
 * @description - the number of seconds in a month
 */
export const SECONDS_IN_A_MONTH = 30 * 24 * 60 * 60;
