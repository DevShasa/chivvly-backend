import { SendMailWithTemplate } from "../utils/postmark/actions"

const to_email = 'support@divvly.io'


describe('Test postmark email templates', () => { 

    it("should an admin invite email", (done) => {
        
        SendMailWithTemplate(to_email, 'admin-invite', {
            email: to_email,
            invite_code: '1234',
            invite_link: 'https://google.com',
            password: '1234',
            user_name: 'test'
        }).then((res)=>{
            console.log(res)
            done()
        }).catch((e)=>{
            done(e)
        })
    })

    it("should send an auth code request email", async () => {
        await SendMailWithTemplate(to_email, 'auth-code-request', {
            host_name: 'test',
            requester_name: 'test',
            vehicle_name: 'test',
            vehicle_model: 'test',
            provide_auth_code_link: 'https://google.com'
        })
    })

    it("should send a new reservation email", async () => {
        await SendMailWithTemplate(to_email, 'new-reservation', {
            host_name: 'test',
            vehicle_name: 'test',
            vehicle_model: 'test',
            auth_code: '1234',
            client_name: 'test'
        })
    })

    it("should send an onboarding reminder email", async () => {
        await SendMailWithTemplate(to_email, 'onboard-reminder', {
            user_name: 'test',
            onboarding_link: 'https://google.com'
        })
    })

    it("should send a payout method added email", async () => {
        await SendMailWithTemplate(to_email, 'payout-method-added', undefined)
    })

    it("should send a payout sent email", async () => {
        await SendMailWithTemplate(to_email, 'payout-sent', {
            host_name: 'test',
            withdrawal_id: '1234',
            amount: '1234',
            date: '1234'
        })
    })

    it("should send a reservation reminder email", async () => {
        await SendMailWithTemplate(to_email, 'reservation-reminder', {
            reservation_id: '1234',
            vehicle_make: 'test',
            vehicle_model: 'test'
        })
    })

    it("should send a reservation started email", async () => {
        await SendMailWithTemplate(to_email, 'reservation-started', {
            host_name: 'test',
            vehicle_name: 'test',
            vehicle_model: 'test',
            auth_code: '1234',
            client_name: 'test'
        })
    })

    it("should send a payment successful email", async () => {
        await SendMailWithTemplate(to_email, 'payment-successful', {
            user_name: 'test',
            amount: '1234',
            date: '1234',
            vehicle_id: '1234'
        })
    })

    it("should send a welcome email", async () => {
        await SendMailWithTemplate(to_email, 'welcome-email', {
            user_handle: 'test'
        })
    })

    it("should send a withdrawal approved email", async () => {
        await SendMailWithTemplate(to_email, 'withdrawal-approved', {
            withdrawal_id: '1234',
            withdrawal_ammount: '1234',
            withdrawal_date: '1234',
            payout_method: '1234',
            payout_method_id: '1234'
        })
    })
})