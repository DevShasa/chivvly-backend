import prismaClient from "@prismaclient/client";
import mpesa, { MpesaClient, mpesa_event_names } from ".";
import { MPesaPayoutWebhookRequestBody, MPesaReceivePaymentRequestCallBack } from "./types";
import { isEmpty, isNull, isUndefined } from "lodash";
import { captureException, captureMessage } from "@sentry/node";
import dayjs from 'dayjs'
import { formatPhoneNumber } from "@utils/functions";

/**
 * @description - this listener contains the implementation for making the payment request
 * @see - https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */
mpesa.on(mpesa_event_names.send_mpesa_payment_request_to_customer, async (data: {
  user_id: string,
  amount: number,
  authorization: string,
  payment_type_id: string,
}) => {

  prismaClient.user.findUnique({
    where: {
      id: data.user_id
    },
    include: {
      payment_types: {
        where: {
          type: "MPESA",
          phone_number: {
            not: null
          }
        }
      }
    }
  }).then((user)=>{
    /**
     * we need a logging solution for these types of errors, for now the console.logs are valid
     */
    if(isNull(user)) return console.log("User not found")
    const active_payment_type = user.payment_types.find((payment_type)=>payment_type?.id === data?.payment_type_id && !isNull(payment_type.phone_number))
    if(isUndefined(active_payment_type)) return console.log("No active payment type found")
    if(isNull(active_payment_type.phone_number)) return console.log("No phone number found")
    return mpesa.requestPayment({
      amount: data.amount,
      phone: active_payment_type.phone_number
    }).then(async (daraja_response)=>{
      switch(daraja_response.ResponseCode){
        case '0':
          // successfully sent request to customer, create a payment in the db
          await prismaClient.payment.create({
            data: {
              amount: data.amount,
              user_id: data.user_id,
              payment_type_id: active_payment_type.id,
              status: "PROCESSING",
              paymentToken: daraja_response.CheckoutRequestID,
              authorization: data.authorization
            }
          }).then((payment)=>{
            console.log(payment)
          }).catch((e)=>{
            console.log(e)
            captureException(e)
          })
          break;
        default:
          // failed to send request to customer
          await prismaClient.payment.create({
            data: {
              amount: data.amount,
              user_id: data.user_id,
              payment_type_id: active_payment_type.id,
              status: "FAILED",
              paymentToken: daraja_response.CheckoutRequestID,
            }
          })
          break;
      }
    }).catch(async ()=>{ // already captured by sentry
      try {
        await prismaClient.payment.create({
          data: {
            amount: data.amount,
            user_id: data.user_id,
            payment_type_id: active_payment_type.id,
            status: "FAILED",
            paymentToken: "No CheckoutRequestID",
            authorization: data.authorization
          }
        })
         
      } catch (e) {
        captureException(e)
      }
    })
    
  }).catch(async (e)=>{
    captureException(e)
    try {
      await prismaClient.payment.create({
        data: {
          amount: data.amount,
          user_id: data.user_id,
          payment_type_id: data.payment_type_id,
          status: "FAILED",
          paymentToken: "No CheckoutRequestID",
          authorization: data.authorization
        }
      })
    } catch (e) {
      captureException(e)
    }
  })

  
});


/**
 * @description - this listener contains the implementation for receiving the payment request callback from daraja api
 * @see - https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */
mpesa.on(
  mpesa_event_names.send_mpesa_payment_request_to_customer_callback,
  async (data: MPesaReceivePaymentRequestCallBack) => {
    const { CheckoutRequestID, ResultCode } = data.Body.stkCallback;
    
    try {
      switch (ResultCode.toString()) {
        case "0":{
            const [, receipt,,]= data.Body.stkCallback.CallbackMetadata.Item
            // successfully received payment
            await prismaClient.payment.updateMany({ // though this is update many, in reality only one payment will have the CheckoutRequestID
              where: {
                paymentToken: CheckoutRequestID, 
              },
              data: {
                status: "SUCCEEDED",
                receipt_number: receipt.Value,
              }
            })


            const the_payment = await prismaClient.payment.findFirst({
              where: {
                paymentToken: CheckoutRequestID
              },
              include: {
                user: true
              }
            })

            if(!isNull(the_payment)){
              mpesa.sendPaymentSuccessfulNotification({
                template: 'payment-successful',
                data: {
                  amount: the_payment.amount.toFixed(2),
                  date: dayjs(the_payment?.date_time).format("dddd, MMMM D, YYYY"),
                  user_name: the_payment?.user?.email,
                },
                to: the_payment?.user?.email as string,
                subject: "Payment Successful"
              })
            }

            break;
  
        }
        case "1032":{
          // payment cancelled
          return prismaClient.payment.updateMany({
            where: {
              paymentToken: CheckoutRequestID,
            },
            data: {
              status: "CANCELLED"
            }
          }).then().catch((e)=>{
            console.log(e)
            captureException(e)
          })
          /**
           * @todo - handle other cases [1037, 1025, 9999, 1, 2001, 1019, 1001]
           */
        }
        default:
          // failed to receive payment
          return prismaClient.payment.updateMany({
            where: {
              paymentToken: CheckoutRequestID,
            },
            data: {
              status: "FAILED"
            }
          })
      }    
    } catch (e) 
    {
      captureException(e)
    }
  }
);


/**
 * @description - this listener contains the implementation for sending the payment to the host
 */
mpesa.on(mpesa_event_names.send_mpesa_payment_to_host, async (data: {
  user_id: string,
  amount: number,
  withdrawal_id: string,
  payment_type_id: string,
  refunded_from?: string,
})=>{
  await prismaClient.user.findFirst({
    where: {
      id: data.user_id
    },
    include: {
        PayoutMethod: {
          where: {
            type: "MPESA",
            status: "ACTIVE",
            // verified: true,(verification can happen in 1.5 or later versions) // not sure how we'll be able to verify this i.e the host's phone number, maybe we'll need an africastalking setup for this as well
          }
        },
        payment_types: {
          where: {
            type: "MPESA",
            id: data.payment_type_id
          }
        }
    }
  }).then(async (user)=>{
    if(isNull(user)) return captureException(new Error("User not found"))
    if(user?.user_type === "CUSTOMER") {
      try {
        if(isEmpty(user?.payment_types)) return captureException(new Error("No payment type found"))  
        const payment_type = user?.payment_types?.[0]
        if(isNull(payment_type?.phone_number)) return captureException(new Error("No phone number found"))
        const phone_number = await formatPhoneNumber(payment_type?.phone_number)

        const daraja_response = await mpesa.sendPayout({
          amount: data.amount,
          phone: phone_number // conversion to bigint is necessary i.e. 2547xxxxxxx
        })

        switch(daraja_response.ResponseCode.toString()){
          case "0":
            // successfully sent payment to customer
            await prismaClient.payout.create({
              data: {
                amount: data.amount,
                user_id: data.user_id,
                market_id: user.market_id as string,
                payout_token: daraja_response.ConversationID,
                type: 'CUSTOMER_REFUND',
                issuer_id: data.refunded_from,
              }
            })
            break;
          default:
            // failed to send payment to customer
            await prismaClient.payout.create({
              data: {
                amount: data.amount,
                user_id: data.user_id,
                market_id: user.market_id as string,
                payout_token: daraja_response.ConversationID,
                type: 'CUSTOMER_REFUND',
                status: 'FAILED',
                issuer_id: data.refunded_from,
              }
            })
        }
      } catch (e) 
      {
        captureException(e)
      }
    }else {
      /// host related checks
      if(isEmpty(user.PayoutMethod)) return captureException(new Error("No payout type found"))  
      const payout_method = user.PayoutMethod[0]
      if(isNull(payout_method.mobile_money_number)) return captureException(new Error("No phone number found"))
      const phone_number = await formatPhoneNumber(payout_method.mobile_money_number)
      mpesa.sendPayout({
        amount: data.amount,
        phone: phone_number // conversion to bigint is necessary i.e. 2547xxxxxxx
      }).then(async (daraja_response)=>{
        switch(daraja_response.ResponseCode.toString()){
          case "0":{
            // successfully sent payment to host
            const payout = await prismaClient.payout.create({
              data: {
                amount: data.amount,
                user_id: data.user_id,
                market_id: user.market_id as string,
                payout_method_id: payout_method.id,
                payout_token: daraja_response.ConversationID,
                withdrawal_id: data.withdrawal_id,
              }
            })

            if(data.withdrawal_id) {
                await prismaClient.withdrawal.update({
                  where: {
                    id: data.withdrawal_id
                  },
                  data: {
                    status: 'PROCESSING'
                  }
                })
            }

            
            captureMessage(JSON.stringify({
              message: "Payment sent to host",
              payout_id: payout.id,
              payout_method: payout_method.id,
              payout_type: "MPESA",
              withdrawal_id: data.withdrawal_id
            }), (context)=>{
              return context.setLevel("info")
            }) 
            break;
          }
          default:{
            // failed to send payment to host
            await prismaClient.payout.create({
              data: {
                amount: data.amount,
                user_id: data.user_id,
                market_id: user.market_id as string,
                payout_method_id: payout_method.id,
                payout_token: daraja_response.ConversationID,
                status: 'FAILED',
                withdrawal_id: data.withdrawal_id,
              }
            })
  
            if(data.withdrawal_id) {
                await prismaClient.withdrawal.update({
                  where: {
                    id: data.withdrawal_id
                  },
                  data: {
                    status: 'FAILED'
                  }
                })
            }
          }
        }
      }).catch(async ()=>{ // already captured by sentry
       
        try {
          await prismaClient.payout.create({
            data: {
              amount: data.amount,
              user_id: data.user_id,
              market_id: user.market_id as string,
              payout_method_id: payout_method.id,
              payout_token: "No Token",
              status: 'FAILED',
              withdrawal_id: data.withdrawal_id,
            }
          })
  
          if(data.withdrawal_id) {
              await prismaClient.withdrawal.update({
                where: {
                  id: data.withdrawal_id
                },
                data: {
                  status: 'FAILED'
                }
              })
          }

        } catch (e) {
          captureException(e)
        }
      })
    }

  }).catch((e)=>{
    captureException(e)
  })
})



/**
 * @description - this listener contains the implementation for receiving the payout request callback from daraja api
 * - still unable to test this, 
 */
mpesa.on(mpesa_event_names.send_mpesa_payment_to_host_callback, async (data: MPesaPayoutWebhookRequestBody)=>{
  const { Result: {ConversationID, ResultCode} } = data
  try {
    switch(ResultCode?.toString()){
      case "0": {
        // successfully sent payment to host
        await prismaClient.payout.updateMany({
          where: {
            payout_token: ConversationID
          },
          data: {
            status: "SUCCEEDED"
          }
        })

        const the_payout = await prismaClient.payout.findFirst({
          where: {
            payout_token: ConversationID
          },
          include: {
            user: true,
            payout_method: true
          }
        })
        
        captureMessage("Payout to host successful", (context)=>{
          return context.setLevel("info")
          .setExtras({
            ConversationID,
            ResultCode,
            data,
            the_payout
          })
        })

        if(the_payout?.withdrawal_id) {
          await prismaClient.withdrawal.updateMany({
            where: {
              id: the_payout.withdrawal_id
            },
            data: {
              status: "COMPLETED"
            }
          })

          mpesa.sendWithdrawalApprovedNotification({
            template: 'withdrawal-approved',
            to: the_payout?.user?.email as string,
            subject: "Withdrawal Approved",
            data: {
              payout_method: the_payout?.payout_method?.type,
              payout_method_id: the_payout?.payout_method?.id,
              withdrawal_ammount: the_payout?.amount?.toFixed(2),
              withdrawal_date: dayjs(the_payout?.date).format("dddd, MMMM D, YYYY"),
              withdrawal_id: the_payout?.withdrawal_id
            }
          })
        }
        break;
      }
      default: {
        // failed to send payment to host
        await prismaClient.payout.updateMany({
          where: {
            payout_token: ConversationID
          },
          data: {
            status: "FAILED"
          }
        })

        const the_payout = await prismaClient.payout.findFirst({
          where: {
            payout_token: ConversationID
          }
        })

        captureMessage("Payout to host failed", (context)=>{
          return context.setLevel("info")
          .setExtras({
            ConversationID,
            ResultCode,
            data,
            the_payout
          })
        })

        if(the_payout?.withdrawal_id) {
          await prismaClient.withdrawal.updateMany({
            where: {
              id: the_payout.withdrawal_id
            },
            data: {
              status: "FAILED"
            }
          })
        }
      }
    }
  } catch (e) {
    captureException(e)
    console.log("Error in payout callback", e)
  }
})
