import "dotenv/config";
import got, { RequestError } from "got";
import crypto from "crypto";
import { captureException } from "@sentry/node";

export async function createMTNUser(
  type: "disbursement" | "collection"
): Promise<{
  reference_id: string;
  type: "disbursement" | "collection";
}> {
  const reference_id = crypto.randomUUID();
  const subscription_key =
    type === "collection"
      ? process.env.MTN_COLLECTION_SUBSCRIPTION_KEY
      : process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY;
  console.log("Sub key::", subscription_key);
  try {
    const res = await got.post(
      `https://ericssonbasicapi2.azure-api.net/v1_0/apiuser`,
      {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": subscription_key,
          "X-Reference-Id": reference_id,
        },
        body: JSON.stringify({
          providerCallbackHost: "webhook.site", // using webhook.site for testing, it's the only valid option for the mtn callbacks for now
        }),
        responseType: "json",
      }
    );

    if (res.statusCode !== 201) throw new Error("Failed to create mtn user");

    return { reference_id, type };
  } catch (e) {
    captureException(e)
    const a: RequestError = e as RequestError;
    return Promise.reject(a.response?.body);
  }
}

export async function createAPIKey(data: {
  reference_id: string;
  type: "disbursement" | "collection";
}) {
  const subscription_key =
    data.type === "collection"
      ? process.env.MTN_COLLECTION_SUBSCRIPTION_KEY
      : process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY;
  try {
    const res = await got.post<{
      apiKey: string;
    }>(
      `https://ericssonbasicapi2.azure-api.net/v1_0/apiuser/${data.reference_id}/apikey`,
      {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": subscription_key,
          "X-Reference-Id": data.reference_id,
        },
        responseType: "json",
      }
    );

    if (res.statusCode !== 201) throw new Error("Failed to create mtn api key");

    return res.body.apiKey;
  } catch (e) {
    captureException(e)
    const a: RequestError = e as RequestError;
    return Promise.reject(a.response?.body);
  }
}

export async function createUserToken(data: {
  reference_id: string;
  type: "disbursement" | "collection";
  apiKey: string;
}) {
  const subscription_key =
    data.type === "collection"
      ? process.env.MTN_COLLECTION_SUBSCRIPTION_KEY
      : process.env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY;
  try {
    console.log(data);
    console.log(subscription_key);

    const res = await got.post<{
      access_token: string;
      expires_in: number;
      token_type: string;
    }>(`https://sandbox.momodeveloper.mtn.com/${data.type}/token/`, {
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": subscription_key,
        Authorization: `Basic ${Buffer.from(
          data.reference_id + ":" + data.apiKey
        ).toString("base64")}`,
        "X-Reference-Id": data.reference_id,
      },
      responseType: "json",
    });

    if (res.statusCode !== 200)
      throw new Error("Failed to create mtn user token");

    return res.body.access_token;
  } catch (e) {
    captureException(e)
    const a: RequestError = e as RequestError;
    return Promise.reject(a.response?.body);
  }
}
