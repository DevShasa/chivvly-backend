


/**
 * @name SendMailWithContent
 * @description Send mail with content
 * @params {string} to
 * @params {string} subject
 * @params {string} html
 * @params {string} text
 * @returns {Promise<boolean>}
 */

import { captureException } from "@sentry/node"
import { app_env } from "@utils/constants"
import postMarkClient from "./client"

export const SendMailWithContent = async (to: string, subject: string, html?: string, text?: string): Promise<boolean> => {
    return new Promise((res, rej)=>{
        postMarkClient.sendEmail({
            From: process.env.SUPPORT_EMAIL as string,
            To: to,
            Subject: subject,
            HtmlBody: html, 
            TextBody: text,
            /**
             * @todo add attachments
             */
            MessageStream: "outbound"
        }).then(()=>{
            res(true)
        }).catch((e: unknown)=>{
            captureException(e)
            rej(e)
        })
    })
}


export type template_variables = {
    'admin-invite': Partial<{
        invite_link: string
        email: string 
        invite_code: string
        password: string
        user_name: string
    }>
    'auth-code-request': Partial<{
        host_name: string 
        requester_name: string 
        vehicle_name: string 
        vehicle_model: string 
        provide_auth_code_link: string 
    }>
    'new-reservation': Partial<{
        host_name: string
        vehicle_name: string
        vehicle_model: string 
        auth_code: string 
        client_name: string
    }>
    'onboard-reminder': Partial<{
        user_name: string 
        onboarding_link: string
    }>
    'payout-method-added': undefined
    'payout-sent': Partial<{
      host_name: string
      withdrawal_id: string 
      amount: string
      date: string   
    }>
    'reservation-reminder': Partial<{
        reservation_id: string
        vehicle_make: string 
        vehicle_model: string
    }>
    'reservation-started': Partial<{
        host_name: string,
        vehicle_name: string
        vehicle_model: string
        auth_code: string
        client_name: string
    }>
    'payment-successful': Partial<{
        user_name: string 
        amount: string 
        date: string
        vehicle_id: string
    }>
    'welcome-email': {
        user_handle: string 
    },
    'withdrawal-approved': Partial<{
        withdrawal_id: string
        withdrawal_ammount: string
        withdrawal_date: string
        payout_method: string
        payout_method_id: string
    }>
    'withdrawal-successful': Partial<{
        withdrawal_id: string
        withdrawal_ammount: string
        withdrawal_date: string
        payout_method: string
        payout_method_id: string
    }>
}


export type template_names = keyof template_variables

/**
 * @name SendMailWithTemplate
 * @description Send mail with template
 * @params {string} to
 * @params {string} template_name
 * @params {object} template_data
 * @params {string} subject
 */
export const SendMailWithTemplate = async <T extends template_names>(to: string, template_name: T, template_data: template_variables[T]): Promise<boolean> => {
    if (app_env === "testing") return true
    return new Promise((res, rej)=>{
        postMarkClient.sendEmailWithTemplate({
            From: process.env.SUPPORT_EMAIL as string,
            To: to,
            TemplateAlias: template_name,
            TemplateModel: template_data ? template_data : {},
            MessageStream: "outbound"
        }).then(()=>{
            res(true)
        }).catch((e: unknown)=>{
            captureException({error: e, message: template_name})
            rej(e)
        })
    })
}
