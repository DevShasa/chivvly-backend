import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin/app";
import customer_cert from "./customer.json";
import host_cert from "./host.json";
import host_prod_cert from "./host.prod.json";
import customer_prod_cert from "./customer.prod.json";
import jwt from "jsonwebtoken"

const app_env = process.env.APP_ENV as 'testing' | 'staging' | 'production'

let host, customer;

const app_names = admin.apps.map((app)=> app?.name)

if(!app_names.includes("host")){
    host = admin.initializeApp({
        credential: admin.credential.cert((app_env === "production" ? host_prod_cert : host_cert) as ServiceAccount)
    }, "host");
}

if(!app_names.includes("customer")){
    customer = admin.initializeApp({
        credential: admin.credential.cert((app_env === "production" ? customer_prod_cert : customer_cert) as ServiceAccount)
    }, "customer");
}


export const auth = {
    host: host?.auth(),
    customer: customer?.auth(),
    test: {
        verifyIdToken: (token:string): Promise<{uid: string}> =>{
            return new Promise((resolve, )=>{
                const t = jwt.decode(token)
                resolve({
                    uid: (t as {uid: string})?.uid
                })
            })
        }
    }
}
