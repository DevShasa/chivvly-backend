import fs from 'fs'
import path from 'path'
import crypto from 'crypto'




export function generateSecurityCredential(password: string, env: 'sandbox' | 'production'){
    const password_array = Buffer.from(password)
    let cert;
    if(env === 'sandbox'){
        cert = fs.readFileSync(path.join(__dirname, 'certs/sandbox.cer')) 
    }else if (env === 'production'){
        cert = fs.readFileSync(path.join(__dirname, 'certs/production.cer'))
    }

    const public_key = String(cert) 

    const encrypted = crypto.publicEncrypt({
        key: public_key,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, password_array)

    const security_credential = encrypted.toString('base64')

    return security_credential
}