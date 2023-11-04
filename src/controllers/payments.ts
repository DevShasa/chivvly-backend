import { tPaymentStatus } from "@prisma/client";
import prismaClient from "@prismaclient/client";
import { captureException } from "@sentry/node";
import { getMonthName, isPaymentAuthorizationTokenValid, timeSleep } from "@utils/functions";
import { generatePaymentAuthorizationToken } from "@utils/functions";
import generateDataTransferObject from "@utils/generateDto";
import mpesa from "@utils/mpesa";
import mtn from "@utils/mtn";
import { createPaymentIntent, refundCustomer, tPaymentIntentDetails } from "@utils/stripe/actions";
import { tCreateMTNPaymentIntent, tMPesaPaymentIntentSchema, tPaymentQuerySchema } from "@validators/payment";
import { RequestHandler } from "express";
import { isEmpty, isNull, last } from "lodash";
import { z } from "zod";

/**
 * this will also create the payment in the database
 */
export const createStripePaymentIntent: RequestHandler = async (req, res) => {
  const user_id = req.headers.user_id as string;
  await tPaymentIntentDetails
    .required({
      amount: true,
      currency: true,
      payment_method: true,
    })
    .parseAsync(req.body)
    .then(async (payment_intent_data) => {

      if (payment_intent_data?.reservation_id) {
        try {
          const reservation = await prismaClient.reservation.findUnique({
            where: {
              id: payment_intent_data.reservation_id
            },
            include: {
              payment: true,
              vehicle: {
                select: {
                  host: true
                }
              }
            }
          })

          if (reservation?.payment?.status !== "SUCCEEDED") return res.status(400).send(generateDataTransferObject(null, "Reservation has not been paid for", "error"))

          // send a payout to the cutomer
          await refundCustomer(reservation?.payment?.stripe_payment_id ?? "")

          // create a payout
          prismaClient.payout.create({
            data: {
              amount: reservation?.payment?.amount ?? 0,
              user_id,
              market_id: reservation?.vehicle?.host?.market_id ?? "",
              payout_token: crypto.getRandomValues(new Uint32Array(1))[0].toString(16),
              status: "SUCCEEDED",
              issuer_id: reservation?.vehicle?.host?.id ?? "",
            }
          })

        } catch (e) 
        {
          captureException(e)
          return res.status(500).send(generateDataTransferObject(e, "An error occured creating the payment intent", "error"))
        }
      }
      await prismaClient.user
        .findUniqueOrThrow({
          where: {
            id: user_id,
          },
          select: {
            customer_id: true,
            payment_types: {
              where: {
                type: "STRIPE",
                user_id,
                stripe_payment_method_id: {
                  equals: payment_intent_data.payment_method,
                }
              }
            },
            market: {
              select: {
                currency: true
              }
            }
          },
        })
        .then(async ({ customer_id, payment_types, market }) => {
          if (isNull(customer_id))
            return res
              .status(400)
              .send(
                generateDataTransferObject(null, "Customer not found", "error")
              );
          await createPaymentIntent({
                ...payment_intent_data,
                currency: market?.currency ?? "USD"
            }, customer_id)
            .then(async (payment_intent) => {
              // expo has no support for cookies so, will send down authorization in the response body, to be used for creating reservations and confirming payments
              const authorization = generatePaymentAuthorizationToken(user_id, payment_intent.amount)
              await prismaClient.payment
                .create({
                  data: {
                    amount: ['RWF']?.includes(payment_intent_data?.currency) ?  payment_intent.amount : payment_intent.amount / 100, // stripe uses cents as the base unit except for rwf and other currencies that dont have cents
                    date_time: new Date(payment_intent.created),
                    stripe_payment_id: payment_intent.id,
                    user_id,
                    payment_type_id: last(payment_types)?.id,
                    authorization: authorization
                  },
                })
                .then(() => {
                  res
                    .status(201)
                    .send(
                      generateDataTransferObject(
                        {
                          ...payment_intent,
                          authorization
                        },
                        "Payment intent created successfully",
                        "success"
                      )
                    );
                })
                .catch((e) => {
                  res
                    .status(500)
                    .send(
                      generateDataTransferObject(
                        e,
                        "An error occured creating the payment intent",
                        "error"
                      )
                    );
                  captureException(e)
                });
            })
            .catch((e) => {
              res
                .status(500)
                .send(
                  generateDataTransferObject(
                    e,
                    "An error occured creating the payment intent",
                    "error"
                  )
                );
              captureException(e)
            });
        })
        .catch((e) => {
          res
            .status(500)
            .send(
              generateDataTransferObject(
                e,
                "An error occured creating the payment intent",
                "error"
              )
            );
          captureException(e)
        });
    })
    .catch((e) => {
      res
        .status(400)
        .send(generateDataTransferObject(e, "Invalid request", "error"));
    });
};


export const createMpesaPaymentIntent: RequestHandler = async (req, res) => {
  const user_id = req.headers.user_id as string;
  tMPesaPaymentIntentSchema.required({
    amount: true,
    payment_type_id: true,
    vehicle_id: true,
  }).parseAsync(req.body).then(async (data)=>{

    if(data.reservation_id){
      const reservation = await prismaClient.reservation.findUnique({
        where: {
          id: data.reservation_id
        },
        include: {
          payment: true
        }
      })

      try {
        if(!(reservation?.payment?.status === "SUCCEEDED")) return res.status(400).send(generateDataTransferObject(null, "Reservation has not been paid for", "error"))
        // send a payout to the cutomer
        mpesa.sendMpesaPayout({
          amount: reservation?.payment?.amount ?? 0,
          user_id,
          payment_type_id: reservation?.payment?.payment_type_id ?? "",
        })
      } catch(e)
      {
        captureException(e)
        return res.status(500).send(generateDataTransferObject(e, "An error occured creating the payment intent", "error"))
      }
    }

    const authorization_token  = generatePaymentAuthorizationToken(user_id, data.amount);
    
    res.status(200).send(generateDataTransferObject({
      status: "PROCESSING",
      authorization: authorization_token
    }, "Successfully created the payment intent", "success"))
    // the mpesa client will handle the rest from here
    mpesa.sendMpesaPaymentRequestToCustomer({
      amount: data.amount,
      user_id,
      authorization: authorization_token,
      payment_type_id: data.payment_type_id
    })
  }).catch((e)=>{
    res.status(400).send(generateDataTransferObject(e, "Invalid request", "error"));
  })
}

export const fetchPayments: RequestHandler = async (req, res) => {
  const user_id = req.headers.user_id as string;
  await tPaymentQuerySchema
    .parseAsync(req.query)
    .then(async (query) => {
      const {
        stripe_payment_id,
        payment_type_id,
      } = query;

      /**
       * currently have no use case for pagination, or finding by payment_type_id, but i will leave it here
       */

      await prismaClient.payment.findFirst({
        where: {
          stripe_payment_id,
          user_id,
          payment_type_id
        },
      }).then((data)=>{
        res.status(200).send(generateDataTransferObject(data, "Successfully fetched the payments", "success"))
      }).catch((e)=>{
        res.status(500).send(generateDataTransferObject(e, "An error occured fetching the payments", "error"))
        captureException(e)
      });
    })
    .catch((e) => {
      res
        .status(400)
        .send(generateDataTransferObject(e, "Invalid request", "error"));
    });
};



export const createMTNPaymentIntent: RequestHandler = async (req, res) => {
  const user_id = req.headers.user_id as string;

  const parsed = tCreateMTNPaymentIntent.safeParse(req.body)

  if(!parsed.success){
    return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request", "error"))
  }

  const data = parsed.data 

  if(data?.reservation_id) {
    try {
      const reservation = await prismaClient.reservation.findUnique({
        where: {
          id: data.reservation_id
        },
        include: {
          payment: true,
          vehicle: {
          }
        }
      })
      if(!(reservation?.payment?.status === "SUCCEEDED")) return res.status(400).send(generateDataTransferObject(null, "Reservation has not been paid for", "error"))
      // send a payout to the cutomer
      mtn.sendMTNPayout({
        amount: reservation?.payment?.amount ?? 0,
        user_id,
        payment_type_id: reservation?.payment?.payment_type_id ?? "",
        refunded_from: reservation?.vehicle?.user_id ?? ""
      })
    } catch (e)
    {
      captureException(e)
      return res.status(500).send(generateDataTransferObject(e, "An error occured creating the payment intent", "error"))      
    }
  }

  const payment_autorization_token = generatePaymentAuthorizationToken(user_id, parsed.data.amount)

  res.status(200).send(generateDataTransferObject({
    status: "PROCESSING",
    authorization: payment_autorization_token
  }, "Creating Payment Intent", "success"))

  // the mtn client will handle the rest from here
  mtn.sendMTNPaymentRequestToCustomer({
    ...parsed.data,
    user_id,
    authorization_token: payment_autorization_token
  })
}


class CheckPaymentStatus {
  check_counts: number
  constructor() {
    this.check_counts = 0
  }

  async check(authorization: string): Promise<tPaymentStatus>{
    try {
      const payment = await prismaClient.payment.findFirst({
        where: {
          authorization
        },
        select: {
          status: true
        }
      })
      if(isNull(payment)) return Promise.reject("Payment not found")
      if(payment.status !== "PROCESSING") return payment.status
      if(this.check_counts === 10) return Promise.reject("Payment timed out") // 10 checks is 20 seconds
      this.check_counts++
      await timeSleep(2000) // check every 2 second
      return await this.check(authorization)
    } catch (e) {
      if(e === "Payment not found" || e === "Payment timed out") return Promise.reject(e)
      captureException(e)
      return Promise.reject(e)
    }
    
  }

}

export const confirmPayment: RequestHandler = async (req, res) => {
  const parsed = z.string().safeParse(req.headers["x-payment-authorization"])
  if (!parsed.success) return res.status(400).send(generateDataTransferObject(parsed.error, "Invalid request", "error"))
  const authorization = parsed.data
  if(!isPaymentAuthorizationTokenValid(authorization)) return res.status(400).send(generateDataTransferObject(null, "Invalid authorization token", "error"))

  const checker = new CheckPaymentStatus()

  try {
    const status = await checker.check(authorization)

    res.status(200).send(generateDataTransferObject(status, "Payment status finalized", "success"))
  } catch (e) {
    if (e === "Payment not found") return res.status(404).send(generateDataTransferObject(null, "Payment not found", "error"))
    if (e === "Payment timed out") return res.status(408).send(generateDataTransferObject(null, "Payment timed out", "error"))
    return res.status(500).send(generateDataTransferObject(e, "An error occured confirming the payment", "error"))
  }


}

export const getEarningsReport: RequestHandler = async (req, res) => {
  const interval: 'monthly' | 'yearly' = req.query.interval as unknown as 'monthly' | 'yearly' ?? 'monthly'
  let vehicle_id = req.query.vehicle_id 
  vehicle_id = (isEmpty(vehicle_id) || vehicle_id === "all") ? undefined : vehicle_id as string
  const user_id = req.headers.user_id as string
  const year = req.query.year as string ?? new Date().getFullYear().toString()

  let start_date_time: Date
  let end_date_time: Date

  try {
    if (interval === "monthly") {
      start_date_time = new Date(`${year}-01-01`)
      end_date_time = new Date(`${year}-12-31`)
      
      
      const month_payments = await prismaClient.payment.findMany({
        where: {
          Reservation: {
            vehicle: {
              host: {
                id: user_id
              },
              id: vehicle_id
            },
            start_date_time: {
              gte: start_date_time,
            },
            end_date_time: {
              lte: end_date_time
            },
            status: "COMPLETE"
          }
        },
        include: {
          Reservation: true
        }
      })

      const months = Array.from({length: 12}, (_, i)=>{
        const month_payments_filtered = month_payments.filter((payment)=>payment.Reservation?.start_date_time.getMonth() === i)
        const month_reservations = month_payments_filtered.map((payment)=>payment.Reservation)?.length
        const amount = month_payments_filtered.reduce((acc, curr)=>acc + curr.amount, 0)
        return {
          month: getMonthName(i),
          amount,
          reservations: month_reservations
        }
      })

      const parsed = months?.map((month)=>({
        value: month.amount,
        name: month.month,
        reservations: month.reservations
      }))

      return res.status(200).send(generateDataTransferObject(parsed, "Successfully fetched the earnings", "success"))


    } else {
      const year_payments = await prismaClient.payment.findMany({
        where: {
          Reservation: {
            vehicle: {
              host: {
                id: user_id
              }
            },
            vehicle_id: vehicle_id === "all" ? undefined : vehicle_id,
            status: "COMPLETE",
          }
        },
        include: {
          Reservation: true
        }
      })

      const all_payment_years = year_payments?.map((payment)=>payment.Reservation?.start_date_time.getFullYear())
      const year_reservations = year_payments?.map((payment)=>payment.Reservation)?.length
      const unique_years = Array.from(new Set(all_payment_years))

      const years = unique_years?.map((year)=>{
        const year_payments_filtered = year_payments.filter((payment)=>payment.Reservation?.start_date_time.getFullYear() === year)
        const amount = year_payments_filtered.reduce((acc, curr)=>acc + curr.amount, 0)
        return {
          year,
          amount,
          reservations: year_reservations
        }
      })

      const parsed = years?.map((year)=>({
        value: year.amount,
        name: year.year,
        reservations: year.reservations
      }))

      return res.status(200).send(generateDataTransferObject(parsed, "Successfully fetched the earnings", "success"))

    }

  } 
  catch (e)
  {
    captureException(e)
    res.status(500).send(generateDataTransferObject(e, "An error occured fetching the earnings", "error"))
  }

}