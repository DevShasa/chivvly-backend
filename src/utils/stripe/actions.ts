import { z } from "zod"
import stripeClient from "."
import { generateDataTransferObject } from ".."
import { Stripe } from "stripe"
import { isEmpty, toLower, toUpper } from "lodash"
import { captureException } from "@sentry/node"

// zod object schemas

/**
 * @name tPaymentMethod
 */
export const tPaymentMethod = z.object({
    type: z.enum(['card']).default('card'), 
    card_number: z.string().min(16, {
        message: "Card number must be at least 16 characters long"
    }).max(16, {
        message: "Card number must be at most 16 characters long"
    }).nonempty({
        message: "Card number must not be empty"
    }),
    exp_month: z.number().min(1, {
        message: "Expiration month must be at least 1"
    }).default(1),
    exp_year: z.number().min(new Date().getFullYear(), {
        message: "Expiration year must be at least the current year"
    }),
    cvc: z.string().min(3, {
        message: "CVC must be at least 3 characters long"
    }).max(3, {
        message: "CVC must be at most 3 characters long"
    }).nonempty({
        message: "CVC must not be empty"
    }).optional(),
    customer_id: z.string().nonempty({
        message: "Customer id must not be empty"
    }),
    billingDetails: z.object({
        name: z.string().optional(),
        email: z.string().email({}).optional(),
    }).optional()
})


/**
 * @name tCustomer
 */

const tCustomer = z.object({
    email: z.string().email({
        message: "Email must be a valid email"
    }).optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    uid: z.string().nonempty({}).optional(),
})


/**
 * @name tPaymentIntentDetails
 */

export const tPaymentIntentDetails = z.object({
    amount: z.number().min(0.5, {
        message: "Amount must be at least 0.5" // this is a stripe requirement
    }),
    currency: z.enum(['USD', 'KES', 'GBP', 'ZSD', 'CAD', 'THB']).transform((v)=>toLower(v)).default('USD'),
    /**
     *   Amount intended to be collected by this PaymentIntent. A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency). The minimum amount is $0.50 US or equivalent in charge currency. The amount value supports up to eight digits (e.g., a value of 99999999 for a USD charge of $999,999.99).
     */
    payment_method: z.string().optional(),
    reservation_id: z.string().optional(),
})



/**
 * @name createPaymentMethod 
 * @description - creates a payment method for a customer
 * @params customer_id - the id of the customer
 * 
 */

export const createPaymentMethod = async (payment_method: typeof tPaymentMethod._type): Promise<Stripe.PaymentMethod|null> => {
    return new Promise((res, rej)=>{
        tPaymentMethod.parseAsync(payment_method).then((data)=>{
            stripeClient.paymentMethods.create({
                type: data.type,
                card: {
                    number: data.card_number,
                    exp_month: data.exp_month,
                    exp_year: data.exp_year,
                    cvc: data.cvc
                },
                billing_details: data.billingDetails
            }).then((pm)=>{
                stripeClient.paymentMethods.attach(pm.id, {
                    customer: data.customer_id
                }).then(()=>{
                    // pasing the data transfer object so that it can be directly passed to the client
                    res(pm)
                })
            }).catch((e)=>{
                captureException(e)
                rej(e)
            })
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
        
    })
    
}

/**
 * @name createCustomer
 * @description - creates a customer
 * @params customer - the customer object
 */

export const createCustomer = async (customer: typeof tCustomer._type): Promise<Stripe.Customer> => {
    return new Promise((res, rej)=>{
        tCustomer.parseAsync(customer).then((data)=>{
            stripeClient.customers.create({
               email: data.email,
               name: data.name,
               description: "Customer created by the app",
               phone: data.phone,
            }).then((customer)=>{
                res(customer)
            }).catch((e)=>{
                captureException(e)
                rej(e)
            })
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
    
}


/**
 * @name createPaymentIntent 
 * @description - creates a payment intent for the user
 * @param paymentIntentDetails
 */

export const createPaymentIntent = async (paymentIntentDetails: typeof tPaymentIntentDetails._type, customer_id: string): Promise<Stripe.PaymentIntent & { ephemeralKey?: string }> => {
    return new Promise((res, rej)=>{
        if (isEmpty(customer_id)) return rej("Customer id must not be empty")
        tPaymentIntentDetails.parseAsync({
            ...paymentIntentDetails,
            currency: toUpper(paymentIntentDetails.currency)
        }).then(async (data)=>{
            const ephemeralKey = await stripeClient.ephemeralKeys.create(
                {customer: customer_id},
                {apiVersion: "2022-11-15"}
              );
            await stripeClient.paymentIntents.create({
                amount: data.amount,
                currency: data.currency.toLocaleLowerCase(),
                payment_method: data.payment_method,
                confirm: true,
                payment_method_types: ['card'],
                customer: customer_id,
            }).then((paymentIntent)=>{
                res({
                    ...paymentIntent,
                    ephemeralKey: ephemeralKey.secret
                })
            }).catch((e)=>{
                captureException(e)
                rej(e)
            })
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
}


/**
 * @name getPaymentMethods 
 * @description - gets all payment methods for a customer
 */

export const getPaymentMethods = (customer_id: string) => {
    return new Promise((res, rej)=>{
        stripeClient.paymentMethods.list({
            customer: customer_id,
        }).then((paymentMethods)=> {
            /**
             * @todo return simple object instead, will phase this out later
             */
            // passing the data transfer object so that it can be directly passed to the client
            res(generateDataTransferObject(paymentMethods.data, "Successfully retrieved payment methods", "success"))
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
}


/**
 * @name createConnectedAccount 
 * @description - creates a connected account intent 
 *              - this is how we will handle payouts for the hosts
 *              - note this onboarding flow has yet to be added to the site
 */


export const tCreateConnectedAccount = z.object({
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    country: z.string().max(3, {
        message: "The country's iso code"
    }),
    city: z.string().optional(), // will be the name of the submarket
})

export const createConnectedAccount =  (data: typeof tCreateConnectedAccount._type): Promise<Stripe.Account> => {
    return new Promise((res, rej)=>{
        stripeClient.accounts.create({
            type: "standard",
            email: data.email,
            business_type: "individual",
            country: data.country,
            individual: {
                first_name: data.first_name,
                email: data.email,
                last_name: data.email,
                phone: data.phone,
                address: {
                    city: data.city,
                    country: data.country,
                },
            },
            business_profile: {
                product_description: "Vehicle Rental Services",
            },
        }).then((account)=>{
            res(account)
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
}


/**
 * @name createAccountOnboardingLink
 * @param account_id 
 * @returns 
 */
export const createAccountOnboardingLink = (account_id: string): Promise<Stripe.AccountLink> => {
    return new Promise((res, rej)=> {
        stripeClient.accountLinks.create({
            account: account_id,
            type: "account_onboarding",
            /**
             * @todo - update these with the correct urls
             */
            refresh_url: process.env.APP_URL + "/theonboardingendpoint",
            return_url:  process.env.APP_URL + "/theonboardingendpoint",
        }).then((link)=>{
            res(link)
        }).catch((e)=>{
            captureException(e)
            rej(e)
        })
    })
}


type stripeEventHandlerFunction = (event: Stripe.Event, filters: string[], handler: (event: Stripe.Event)=> Promise<boolean>) => {eventHander: stripeEventHandlerFunction}

/**
 * @name stripeEventHandler 
 * @description - this is a chainable function that will handle stripe events
 * @param event - the stripe event object reeived in the requst body
 * @param filters - the list of events that a handler can work with
 * @param handler - the handler function for the events listed in the filter list
 * @returns - the stripeEventHandler function
 * @example 
 *  stripeEventHandler(event, ["payment_intent.succeeded"], (event)=>{
 *     // do something with the event
 * }).eventHander(event, ["payment_intent.succeeded"], (event)=>{
 *    // do something with the event
 * }).eventHander(event, ["payment_intent.succeeded"], (event)=>{
 *   // do something with the event 
 * })
 * @returns 
 */
export const stripeEventHandler:stripeEventHandlerFunction = (event, filters, handler) => {
    if (filters.includes(event.type)) {
        handler(event).then(()=>{
            console.log(`Successfully handled event ${event.type}`)
        }).catch((e)=>{
            captureException(e)
            console.log(`An error occured while handling event ${event.type}`)
        })  
        return {eventHander: stripeEventHandler}
    }else{
        return {eventHander: stripeEventHandler}
    }
}

/**
 * @name refundCustomer
 * @param payment_intent 
 * @returns 
 */
export const refundCustomer = (payment_intent: string) => {
    return stripeClient.refunds.create({
        payment_intent
    })
}