import { NotificationEvents } from "src/notifications";
import {
  MtnPayment,
  PaymentRequestToCustomer,
  PaymentRequestsBody,
  PayoutRequestBody,
} from "./types";
import got, { RequestError } from "got";
import { captureException } from "@sentry/node";


export const mtn_event_names = {
  send_mtn_payment_request_to_customer: "send_mtn_payment_request_to_customer",
  send_mtn_payment_request_to_customer_callback:
    "send_mtn_payment_request_to_customer_callback",
  send_mtn_payout_to_host: "send_mtn_payout_to_host",
  send_mtn_payout_to_host_callback: "send_mtn_payout_to_host_callback",
} as const;

class MTNMoMoClient extends NotificationEvents {
  constructor() {
    super();
  }

  static getAccessToken(type: "collection" | "disbursement"): Promise<string> {
    const app_env = process.env.APP_ENV || "development";
    const mtn_base_url =
      app_env === "production"
        ? process.env.MTN_PROD_URL
        : process.env.MTN_TEST_URL;
    const basic_auth =
      type === "collection"
        ? Buffer.from(
            `${process.env.MTN_COLLECTION_USER_ID}:${process.env.MTN_COLLECTION_API_KEY}`
          ).toString("base64")
        : Buffer.from(
            `${process.env.MTN_DISBURSEMENT_USER_ID}:${process.env.MTN_DISBURSEMENT_API_KEY}`
          ).toString("base64");
    return got
      .post<{
        access_token: string;
        expires_in: number;
        token_type: string;
      }>(`${mtn_base_url}/${type}/token/`, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key":
            type === "collection"
              ? process.env.MTN_COLLECTION_SUBSCRIPTION_KEY
              : process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY,
          Authorization: `Basic ${basic_auth}`,
        },
      })
      .then((data) => {
        return data.body.access_token;
      })
      .catch((e) => {
        captureException(e, context => context.setTag("mtn", "getAccessToken")
        .setExtra("type", type)
        .setExtra("mtn_base_url", mtn_base_url)
        .setExtra("basic_auth", basic_auth)
        .setExtra("mtn_collection_user_id", process.env.MTN_COLLECTION_USER_ID)
        .setExtra("mtn_collection_api_key", process.env.MTN_COLLECTION_API_KEY)
        .setExtra("error body", JSON.stringify((e as RequestError)?.response?.body))
        .setExtra("error response", JSON.stringify((e as RequestError)?.response))

        );
        return Promise.reject(e);
      });
  }

  /**
   * @name requestToPay
   * @param data The data to send to the mtn api
   * @param reference_id The paymentToken passed to the newly created payment request
   * @description make a request to the mtn api to request funds from a specific customer's account
   */
  async requestToPay(
    data: PaymentRequestsBody,
    reference_id: string
  ): Promise<void> {
    const app_env = process.env.APP_ENV || "development";
    const mtn_base_url =
      app_env === "production"
        ? process.env.MTN_PROD_URL
        : process.env.MTN_TEST_URL;
    try {
      const token = await MTNMoMoClient.getAccessToken("collection");
      await got.post(`${mtn_base_url}/collection/v1_0/requesttopay`, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_COLLECTION_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": reference_id,
          "X-Target-Environment": process.env.MTN_ENVIRONMENT,
          "X-Callback-Url":
            app_env === "testing"
              ? process.env.TESTING_CALLBACK_URL
              : `${process.env.MTN_CALLBACK_URL}/request/`, // mtn's api has some constraints around what can be used as a callback url and so for testing I'll pass in an actual url
        },
        body: JSON.stringify(data),
      });
    } catch (e) {
      captureException(e, context => context.setTag("mtn", "requestToPay")
      .setExtra("request_body", data)
      .setExtra("reference_id", reference_id)
      .setExtra("mtn_base_url", mtn_base_url)
      .setExtra("app_env", app_env)
      .setExtra("mtn_collection_subscription_key", process.env.MTN_COLLECTION_SUBSCRIPTION_KEY) 
      .setExtra("mtn_environment", process.env.MTN_ENVIRONMENT)
      .setExtra("mtn_callback_url", process.env.MTN_CALLBACK_URL)
      .setExtra("Error body", JSON.stringify((e as RequestError)?.response?.body))
      .setExtra("Error response", JSON.stringify((e as RequestError)?.response))
      
      );
      return Promise.reject(e);
    }
  }

  /**
   * @name requestTransfer
   * @param data The data to send to the mtn api
   * @param reference_id The id of the payout being made
   * @description make a request to the mtn api to send funds to a specific host's account
   */
  async requestTransfer(data: PayoutRequestBody, reference_id: string) {
    const app_env = process.env.APP_ENV || "development";
    const mtn_base_url =
      app_env === "production"
        ? process.env.MTN_PROD_URL
        : process.env.MTN_TEST_URL;
    try {
      const token = await MTNMoMoClient.getAccessToken("disbursement");

      await got.post(`${mtn_base_url}/disbursement/v1_0/transfer`, {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": reference_id,
          "X-Target-Environment": process.env.MTN_ENVIRONMENT,
          "X-Callback-Url":
            app_env === "testing"
              ? process.env.TESTING_CALLBACK_URL
              : `${process.env.MTN_CALLBACK_URL}/disbursment/`, // mtn's api has some constraints around what can be used as a callback url and so for testing I'll pass in an actual url
        },
        body: JSON.stringify(data),
      });
    } catch (e) {
      if (e instanceof RequestError) {
        captureException(e?.response, context => context.setTag("mtn", "requestTransfer")
        .setExtra("request_body", data)
        .setExtra("reference_id", reference_id)
        .setExtra("mtn_base_url", mtn_base_url)
        .setExtra("app_env", app_env)
        .setExtra("mtn_disbursement_subscription_key", process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY)
        .setExtra("mtn_environment", process.env.MTN_ENVIRONMENT)
        .setExtra("mtn_callback_url", process.env.MTN_CALLBACK_URL)
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
   * @name sendMTNPaymentRequestToCustomer
   * @description make a request to the mtn api to send funds to a specific customer's account
   * @see - https://momodeveloper.mtn.com/docs/services/collection/operations/RequesttoPay
   */
  sendMTNPaymentRequestToCustomer(data: Partial<PaymentRequestToCustomer>) {
    this.emit(mtn_event_names.send_mtn_payment_request_to_customer, data);
  }

  /**
   * @name sendMTNPayoutToHost
   * @description makes a request to the mtn api to deposit funds in the host's account
   * @see - https://momodeveloper.mtn.com/docs/services/disbursment/operations/Deposit-V1
   */
  sendMTNPayout(data: Partial<PaymentRequestToCustomer>) {
    this.emit(mtn_event_names.send_mtn_payout_to_host, data);
  }

  /**
   * @name sendMTNPaymentRequestToCustomerCallback
   * @description callback for the sendMTNPaymentRequestToCustomer event
   */
  sendMTNPaymentRequestToCustomerCallback(data: MtnPayment) {
    this.emit(
      mtn_event_names.send_mtn_payment_request_to_customer_callback,
      data
    );
  }

  /**
   * @name sendMTNPayoutToHostCallback
   * @description callback for the sendMTNPayoutToHost event
   */
  sendMTNPayoutToHostCallback(data: MtnPayment) {
    this.emit(mtn_event_names.send_mtn_payout_to_host_callback, data);
  }
}

export { MTNMoMoClient };

export default new MTNMoMoClient();
