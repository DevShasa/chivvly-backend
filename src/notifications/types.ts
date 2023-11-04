import { template_names, template_variables } from "@utils/postmark/actions"

export type notification_body = {
    user_id: string,
    data: {
        message: string,
        screen?: string, // you can use this to navigate to a specific screen
        link?: string, // this can ablso be used to navigate to a specific screen,
        extra?: Record<string, string>
    }
}

export type email_notification_body<T extends template_names> = {
    template: T,
    data: template_variables[T],
    to: string,
    subject: string
}