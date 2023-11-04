

// These are just text templates and should later on be replaced by more complex HTML templates on the Postmark server
/**
 * @name inviteEmailTemplate
 * @todo replace with HTML template in postmark
 * 
 */

export const inviteEmailTemplate = (email: string, inviteCode: string, password: string) => {
    const plain_text =  `
        Hey there,
        You have been invited to be an admin on the divvly platform.
        Head over to http://localhost:3000/auth/admin?inviteCode=${inviteCode}&email=${email} to create your account.
        or use the following credentials in the signup form on http://localhost:3000/admin
        email: ${email}
        inviteCode: ${inviteCode}
        your initial password is: ${password}
        **Note** this invite code is only valid for {time not yet decided} hours.
        Thanks,
    `

    const html = `
        <p>Hey there,</p>
        <p>You have been invited to be an admin on the divvly platform.</p>
        <p>Head over to <a href="http://localhost:3000/auth/admin?inviteCode=${inviteCode}&email=${email}">http://localhost:3000/auth/admin?inviteCode=${inviteCode}&email=${email}</a> to create your account.</p>
        <p>or use the following credentials in the signup form on <a href="http://localhost:3000/admin">http://localhost:3000/admin</a></p>
        <p>email: ${email}</p>
        <p>inviteCode: ${inviteCode}</p>
        <p>your initial password is: ${password}</p>
        <p><strong>Note</strong> this invite code is only valid for {time not yet decided} hours.</p>
        <p>Thanks,</p>
    `

    return {
        plain_text,
        html
    }
}

