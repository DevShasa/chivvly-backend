import EventEmmiter from 'events';
import { email_notification_body, notification_body } from './types';

export const notification_event_names = {
    send_auth_code_request_granted: 'send_auth_code_granted',
    send_auth_code_request_denied: 'send_auth_code_request_denied',
    send_auth_code_revoked: 'send_auth_code_revoked',
    send_reservation_started: 'send_reservation_started',
    send_reservation_cancel: 'send_reservation_cancel', 
    send_reservation_update: 'send_reservation_update',
    send_reservation_reminder: 'send_reservation_reminder', // perhaps a cronjob will make a request to a specific endpoint every 5 minutes to check if there are any reservations that are about to start in 5 minutes, then send a notification to the user
    send_complete_onboarding_customer: 'send_complete_onboarding_customer', // a cronjob can do this every 7days or so, to check if there are any users that have not completed onboarding, then send a notification to the user
    send_complete_onboarding_host: 'send_complete_onboarding_host',
    send_to_host_new_authcode_request: 'send_to_host_new_authcode_request', 
    send_to_host_payout_method_added: 'send_to_host_payout_method_added',
    send_admin_invite_email: "send_admin_invite_email",
    send_welcome_email: "send_welcome_email",
    send_payment_successful: "send_payment_successful",
    send_payout_sent: "send_payout_sent",
    send_reservation_made: "send_reservation_made",
    send_successful_withdrawal: "send_successful_withdrawal",
    send_withdrawal_approved: "send_withdrawal_approved",
    send_cash_payment_reservation_approved: "send_cash_payment_reservation_approved",
    send_cash_payment_reservation_denied: "send_cash_payment_reservation_denied",
    /**
     * @todo: add more events here
     */
}

export class NotificationEvents extends EventEmmiter {
    constructor() {
        super();
    }


    sendAuthCodeRequestGrantedNotification (data: notification_body) {
        this.emit(notification_event_names.send_auth_code_request_granted, data);
    }

    sendAuthCodeRequestDeniedNotification (data: notification_body) {
        console.log("Sending auth code request denied notification")
        this.emit(notification_event_names.send_auth_code_request_denied, data);
    }

    sendAuthCodeRevokedNotification (data: notification_body) {
        this.emit(notification_event_names.send_auth_code_revoked, data);
    }

    sendReservationNotification (data: notification_body) {
        this.emit(notification_event_names.send_reservation_started, data);
    }

    sendReservationCancelNotification (data: notification_body) {
        this.emit(notification_event_names.send_reservation_cancel, data);
    }

    sendReservationUpdateNotification (data: notification_body) {
        this.emit(notification_event_names.send_reservation_update, data);
    }

    sendReservationReminderNotification (data: notification_body) {
        this.emit(notification_event_names.send_reservation_reminder, data);
    }

    sendCompleteOnboardingCustomerNotification (data: notification_body) {
        this.emit(notification_event_names.send_complete_onboarding_customer, data);
    }

    sendCompleteOnboardingHostNotification (data: email_notification_body<'onboard-reminder'>) {
        this.emit(notification_event_names.send_complete_onboarding_host, data);
    }

    sendToHostNewAuthCodeRequestNotification (data: email_notification_body<'auth-code-request'>) {
        this.emit(notification_event_names.send_to_host_new_authcode_request, data);
    }

    sendToHostPayoutMethodAddedNotification (data: email_notification_body<'payout-method-added'>) {
        this.emit(notification_event_names.send_to_host_payout_method_added, data);
    }

    sendAdminInviteEmail (data: email_notification_body<'admin-invite'>) {
        this.emit(notification_event_names.send_admin_invite_email, data);
    }

    sendWelcomeEmail (data: email_notification_body<'welcome-email'>) {
        this.emit(notification_event_names.send_welcome_email, data);
    }

    sendPaymentSuccessfulNotification (data: email_notification_body<'payment-successful'>) {
        this.emit(notification_event_names.send_payment_successful, data);
    }

    sendPayoutSentNotification (data: email_notification_body<'payout-sent'>) {
        this.emit(notification_event_names.send_payout_sent, data);
    }

    sendReservationMadeNotification (data: email_notification_body<'new-reservation'>) {
        this.emit(notification_event_names.send_reservation_made, data);
    }

    sendSuccessfulWithdrawalNotification (data: email_notification_body<'withdrawal-successful'>) {
        this.emit(notification_event_names.send_successful_withdrawal, data);
    }

    sendWithdrawalApprovedNotification (data: email_notification_body<'withdrawal-approved'>) {
        this.emit(notification_event_names.send_withdrawal_approved, data);
    }

    sendCashPaymentReservationApprovedNotification (data: notification_body) {
        this.emit(notification_event_names.send_cash_payment_reservation_approved, data);
    }
    
    sendCashPaymentReservationDeniedNotification (data: notification_body) {
        this.emit(notification_event_names.send_cash_payment_reservation_denied, data);
    }
}

export default new NotificationEvents();