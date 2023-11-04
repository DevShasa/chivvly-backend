import { PushToken, User, UserSettings } from "@prisma/client";
import prismaClient from "@prismaclient/client";
import { captureException } from "@sentry/node";
import { app_env } from "@utils/constants";
import expo from "@utils/expo";
import { SendMailWithTemplate } from "@utils/postmark/actions";
import { isEmpty, isUndefined } from "lodash";
import notifications, { notification_event_names } from ".";
import { email_notification_body, notification_body } from "./types";



/**
 * @name getUserSettings 
 * @description get the user's settings
 * @param {string} user_id
* @returns {Promise<userSettings>}
 */
const getUserSettings = async (user_id: string): Promise<UserSettings & { PushToken: PushToken | null, user: User | null } | null> => {
    return await prismaClient.userSettings.findUnique({
        where: {
            user_id
        },
        include: {
            PushToken: true,
            user: true
        }
    })
}

/**
 * @name sendExpoNotification
 * @param data 
 * @param title 
 * @param priority 
 * @returns Promise<void>
 */

const sendExpoNotification = async (data: notification_body, title: string, priority?: 'high' | 'normal' | 'default'): Promise<void> => {
    if (app_env === "testing") return console.log("Successfully sent notification ")
    const { user_id, data: notificationData} = data 
    if(isEmpty(user_id)) return // do nothing

    await getUserSettings(user_id).then(async (userSettings)=>{
        if(!userSettings) return // do nothing
        const token = userSettings.PushToken?.token
        if(!userSettings.notifications_enabled || isEmpty(token) || isUndefined(token) ) {
           // do nothing 
        }else{
            await expo.sendPushNotificationsAsync([
                {
                    to: token,
                    sound: 'default',
                    title,
                    priority,
                    body: notificationData.message,
                    data: {
                        link: notificationData.link,
                        screen: notificationData.screen,
                        ...notificationData.extra
                    }
                }
            ]).then((pushTicket)=>{
                // do nothing
                console.log(pushTicket)
            }).catch((e)=>{
                captureException(e)
            })
        }
    }).catch((e)=>{
        console.log(e)
        captureException(e)
    })
}


/**
 * @name send_auth_code_request_granted
 * @description send a notification to the user when their auth code request has been granted
 * @param {notification_body} data
 */
notifications.on(notification_event_names.send_auth_code_request_granted, async (data: notification_body)=>{
    await sendExpoNotification(data, 'Auth Code Request Granted', 'high')
})


/**
 * @name send_auth_code_request_denied
 * @description send a notification to the user when their auth code request has been denied
 * @param {notification_body} data
 */
notifications.on(notification_event_names.send_auth_code_request_denied, async (data: notification_body)=>{
    await sendExpoNotification(data, 'Auth Code Request Denied', 'high')
})


/**
 * @name send_auth_code_revoked
 * @description send a notification to the user when their auth code has been revoked
 */
notifications.on(notification_event_names.send_auth_code_revoked, async (data: notification_body)=>{
    await sendExpoNotification(data, 'Auth Code Revoked', 'high')
})


/**
 * @name send_reservation_started
 * @description send a notification to the user when their reservation has started
 */
notifications.on(notification_event_names.send_reservation_started, async (data: notification_body)=>{
    await sendExpoNotification(data, 'Reservation Started', 'high')
})


/**
 * @name send_reservation_ended
 * @description send a notification to the user when their reservation has ended
 */
notifications.on(notification_event_names.send_reservation_cancel, async (data: notification_body)=>{
    await sendExpoNotification(data, 'Reservation Cancelled', 'high')
})


/**
 * @name send_reservation_update
 * @description send a notification to the user when their reservation has been updated
 */
notifications.on(notification_event_names.send_reservation_update, async (data: notification_body)=>{
    await sendExpoNotification(data, 'Reservation Updated', 'high')
})


/**
 * @name send_to_host_new_authcode_request
 * @description send an email notification to the host when a new auth code request has been made
 */

notifications.on(notification_event_names.send_to_host_new_authcode_request, async (data: email_notification_body<'auth-code-request'>)=>{
    SendMailWithTemplate(data.to, 'auth-code-request', data.data)
})

/**
 * @name send_to_host_payout_method_added
 * @description send an email notification to the host when a new payout method has been added
 */

notifications.on(notification_event_names.send_to_host_payout_method_added, async (data: email_notification_body<'payout-method-added'>)=>{
    SendMailWithTemplate(data.to, 'payout-method-added',undefined)
})


/**
 * @name send_complete_onboarding_customer
 * @description send a notification to the user when they haven't completed onboarding to be sent after a week
 */

notifications.on(notification_event_names.send_complete_onboarding_customer, async (data: notification_body)=>{
    sendExpoNotification(data, 'Complete Your Onboarding', 'high')
})

/**
 * @name send_complete_onboarding_host
 * @description send a notification to the user when they haven't completed onboarding to be sent after a week
 */

notifications.on(notification_event_names.send_complete_onboarding_host, async (data: email_notification_body<'onboard-reminder'>) =>{
    await SendMailWithTemplate(data.to, 'onboard-reminder', data.data)
})

/**
 * @name send_reservation_reminder
 * @description send a notification to the user when their reservation is about to start
 */

notifications.on(notification_event_names.send_reservation_reminder, async (data: notification_body)=>{
    try {
        sendExpoNotification(data, 'Reservation Reminder', 'high')
    } catch (e) 
    {
        captureException(e)
    }
})

/**
 * @name send_admin_invite_email
 * @description send an email to the user when they have been invited to be an admin
 */

notifications.on(notification_event_names.send_admin_invite_email, async (data: email_notification_body<'admin-invite'>)=>{
    SendMailWithTemplate(data.to, 'admin-invite', data.data)
})

/**
 * @name send_welcome_email
 * @description send an email to the user when they have been invited to be an admin
 */
notifications.on(notification_event_names.send_welcome_email, async (data: email_notification_body<'welcome-email'>)=>{
    SendMailWithTemplate(data.to, 'welcome-email', data.data)
})


/**
 * @name send_payment_successful
 * @description send an email to the user when their payment has been successful
 * @param {email_notification_body} data
 * @returns {Promise<void>}
 */
notifications.on(notification_event_names.send_payment_successful, async (data: email_notification_body<'payment-successful'>)=>{
   SendMailWithTemplate(data.to, 'payment-successful', data.data)
})

/**
 * @name send_payout_sent 
 * @description send an email to the user when their payout has been sent
 * @param {email_notification_body} data
 * @returns {Promise<void>}
 */
notifications.on(notification_event_names.send_payout_sent, async (data: email_notification_body<'payout-sent'>)=>{
    SendMailWithTemplate(data.to, 'payout-sent', data.data)
})

/**
 * @name send_reservation_made
 * @description send an email to the user when their reservation has been made
 * @param {email_notification_body} data
 * @returns {Promise<void>}
 */
notifications.on(notification_event_names.send_reservation_made, async (data: email_notification_body<'new-reservation'>)=>{
   SendMailWithTemplate(data.to, 'new-reservation', data.data)
})

notifications.on(notification_event_names.send_cash_payment_reservation_approved, async (data: notification_body)=>{
    sendExpoNotification(data, 'Reservation Payment Accepted', 'high')
})

notifications.on(notification_event_names.send_cash_payment_reservation_denied, async (data: notification_body)=>{
    sendExpoNotification(data, 'Reservation Payment Refused', 'high')
})