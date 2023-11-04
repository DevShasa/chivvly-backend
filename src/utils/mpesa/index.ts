import { NotificationEvents } from "src/notifications";
import got, { RequestError } from "got";
import { B2BSetupCredentials, C2BSetupCredentials, MPesaSendPaymentRequest, MPesaSendPaymentRequestDarajaResponse, MPesaSendPayoutRequestBody, MPesaSendPayoutResponseBody } from "./types";
import { formatMpesaDate, formatPhoneNumber } from "@utils/functions";
import { captureException } from "@sentry/node";
import { generateSecurityCredential } from "./helpers";

export const mpesa_event_names = {
  send_mpesa_payment_request_to_customer:
    "send_mpesa_payment_request_to_customer",
  send_mpesa_payment_request_to_customer_callback:
    "send_mpesa_payment_request_to_customer_callback",
  send_mpesa_payment_to_host: "send_mpesa_payment_to_host",
  send_mpesa_payment_to_host_callback: "send_mpesa_payment_to_host_callback",
} as const;

export class MpesaClient extends NotificationEvents {

  c2b: Partial<C2BSetupCredentials>
  b2c: Partial<B2BSetupCredentials>
  base_url = 'https://sandbox.safaricom.co.ke'
  callback_url = ''
  app_env: 'sandbox' | 'production' = 'sandbox'

  constructor(props: {
    c2b: C2BSetupCredentials;
    b2c: B2BSetupCredentials;
    app_env: 'sandbox' | 'production';
    callback_url: string;
  }) {
    super();
    this.c2b = props.c2b;
    this.b2c = props.b2c;
    this.app_env = props.app_env
    this.base_url = props.app_env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke"
    this.callback_url = props.callback_url
  }

  /**
   * @name getAccessToken
   * @description makes a request for the daraja jwt
   */
  async getAccessToken(transaction_type: 'c2b' | 'b2c' = 'c2b'): Promise<string> {
    const { consumer_key, consumer_secret } = transaction_type === 'c2b' ? this.c2b : this.b2c
    const auth_value_string = `${consumer_key}:${consumer_secret}`;
    const auth_value = Buffer.from(auth_value_string).toString("base64");
    try {
      const res = await got.get<{ access_token: string }>(
        `${this.base_url}/oauth/v1/generate`,
        {
          searchParams: {
            grant_type: "client_credentials",
          },
          responseType: "json",
          headers: {
            Authorization: `Basic ${auth_value}`,
          },
        }
      );
      return res.body.access_token;
    } catch (e) {
      if (e instanceof RequestError) {
        captureException(e?.response, context => context.setTag("mpesa", "getAccessToken")
        .setExtra("transaction_type", transaction_type)
        .setExtra("auth_value_string", auth_value_string)
        .setExtra("auth_value", auth_value)
        .setExtra("url", `${this.base_url}/oauth/v1/generate`)
        .setExtra("Error body", JSON.stringify((e as RequestError)?.response?.body))
        .setExtra("Error response", JSON.stringify((e as RequestError)?.response))

        );
        return Promise.reject(e?.response?.body);
      }
      captureException(e);
      return Promise.reject(e);
    }
  }

  /**
   * @name generatePassword
   * @description generates a password for the daraja api
   */
  generatePassword(transaction_type: 'c2b' | 'b2c' = 'c2b'): {
    password: string;
    timestamp: string;
  } {
    const { short_code, pass_key } = transaction_type === 'c2b' ? this.c2b : this.b2c
    const timestamp = formatMpesaDate(new Date());
    const pre = `${short_code}${pass_key}${timestamp}`;
    const password = Buffer.from(pre).toString("base64");
    return {
      password,
      timestamp,
    };
  }

  /**
   * @name requestPayment
   */
  async requestPayment(data: { amount: number; phone: bigint }) {
    try {
      const request_payment_url = this.base_url + "/mpesa/stkpush/v1/processrequest";

      const { password, timestamp } = this.generatePassword("c2b");
      const token = await this.getAccessToken();
      const phone_number = Number(await formatPhoneNumber(data.phone))
      const res = await got.post<MPesaSendPaymentRequestDarajaResponse>(
        request_payment_url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            AccountReference: "DIVVLY",
            Amount: data.amount,
            BusinessShortCode: this.c2b.short_code,
            CallBackURL: `${this.callback_url}/express`,
            PartyA: phone_number,
            PartyB: this.c2b.short_code,
            Password: password,
            PhoneNumber: phone_number,
            Timestamp: timestamp,
            TransactionDesc: this.c2b.business_name,
            TransactionType: "CustomerPayBillOnline",
          } as MPesaSendPaymentRequest),
          responseType: "json",
        }
      );

      return res.body;
    } catch (e) {
      if (e instanceof RequestError) {
        captureException(e?.response, (scope)=>{
          return scope 
          .setExtra("message", "Failed to send mpesa payment request")
          .setExtra("data", data)
          .setExtra("url", this.base_url + "/mpesa/stkpush/v1/processrequest")
          
        });
        return Promise.reject(e?.response?.body);
      }
      captureException(e);
      return Promise.reject(e);
    }
  }

  /**
   * @sendPayout
   * @description send a payout to a host
   * @see - https://developer.safaricom.co.ke/APIs/BusinessToCustomer
   */
  async sendPayout(data: {
    amount: number;
    phone: bigint;
  }): Promise<MPesaSendPayoutResponseBody> {
    this.b2c.security_credential = generateSecurityCredential(this.b2c?.password as string, this.app_env ?? 'sandbox')
    const send_payout_url = this.base_url + "/mpesa/b2c/v1/paymentrequest";
    const token = await this.getAccessToken("b2c");
    const phone_number = Number(await formatPhoneNumber(data.phone))
  
    return got
      .post<MPesaSendPayoutResponseBody>(send_payout_url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Amount: data.amount,
          CommandID: "BusinessPayment",
          InitiatorName: this.b2c.business_name,
          Occassion: `DIVVLY Payout`,
          PartyA: this.b2c.short_code,
          PartyB: phone_number,
          QueueTimeOutURL: `${this.callback_url}/timeout`,
          Remarks: "DIVVLY Payout",
          ResultURL: `${this.callback_url}/disbursement`,
          SecurityCredential: this.b2c.security_credential,
        } as MPesaSendPayoutRequestBody),
        responseType: "json",
      })
      .then((res) => {
        return res.body
      })
      .catch((e) => {
        captureException(e, (scope)=>{
          return scope
          .setExtra("message", "Failed to send mpesa payout")
          .setExtra("data", data)
          .setExtra("url", send_payout_url)
          .setExtra("token", token)
          .setExtra("phone_number", phone_number)
          .setExtra("b2c", this.b2c)
          .setExtra("callback_url", this.callback_url)
          .setExtra("response body", e?.response?.body)
        });
        return e.response.body;
      });
  }

  /**
   * @name sendMpesaPaymentRequestToCustomer
   * @description send a request to the daraja api, with the user's information, this is meant to trigger a stk push notification on the user's mobile device, requesting them to complete the transaction
   * @see - https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
   * @param data
   */
  sendMpesaPaymentRequestToCustomer<T>(data: T) {
    this.emit(mpesa_event_names.send_mpesa_payment_request_to_customer, data);
  }

  /**
   * @name receivePaymentRequestToCustomerResponse
   * @description when daraja api, is done handling the payment, it'll send a request to our api. this request's body will contain details regarding the status of the payment.
   * @see - https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
   * @param - data
   */
  expressPaymentRequestCallback<T>(data: T) {
    this.emit(
      mpesa_event_names.send_mpesa_payment_request_to_customer_callback,
      data
    );
  }

  /**
   * @name sendMpesaPayout
   * @description sends a payout to
   */
  sendMpesaPayout(data: {
    amount: number;
    user_id: string;
    withdrawal_id?: string;
    payment_type_id?: string;
    refunded_from?: string;
  }) {
    this.emit(mpesa_event_names.send_mpesa_payment_to_host, data);
  }

  /**
   * @name payoutRequestCallback
   * @description when daraja api, is done handling the payment, it'll send a request to our api. this request's body will contain details regarding the status of the payment.
   */
  payoutRequestCallback<T>(data: T) {
    this.emit(mpesa_event_names.send_mpesa_payment_to_host_callback, data);
  }

  /**
   * @name setTestUrl
   * @description sets the base url to the test url
   * !!! IMPORTANT !!! only used in testing environments
   * @param url 
   */
  setTestUrl(url: string) {
    this.callback_url = url
  }
}

export default new MpesaClient({
  c2b: {
    business_name: process.env.C2B_MPESA_BUSINESS_NAME as string,
    consumer_key: process.env.C2B_MPESA_CONSUMER_KEY as string,
    consumer_secret: process.env.C2B_MPESA_CONSUMER_SECRET as string,
    pass_key: process.env.C2B_MPESA_PASS_KEY as string,
    short_code: Number(process.env.C2B_MPESA_SHORT_CODE ?? 0),
  },
  b2c: {
    business_name: process.env.B2C_MPESA_BUSINESS_NAME as string,
    consumer_key: process.env.B2C_MPESA_CONSUMER_KEY as string,
    consumer_secret: process.env.B2C_MPESA_CONSUMER_SECRET as string,
    pass_key: process.env.B2C_MPESA_PASS_KEY as string,
    password: process.env.B2C_MPESA_PASSWORD as string,
    short_code: Number(process.env.B2C_MPESA_SHORT_CODE ?? 0),
  },
  app_env: process.env.APP_ENV === "production" ? "production" : "sandbox",
  callback_url: process.env.MPESA_CALLBACK_URL as string,
});
