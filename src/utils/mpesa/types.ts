export type MPesaReceivePaymentRequestCallBack = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata: {
        Item: [
          {
            Name: "Amount";
            Value: number;
          },
          {
            Name: "MpesaReceiptNumber";
            Value: string;
          },
          {
            Name: "TransactionDate";
            Value: number;
          },
          {
            Name: "PhoneNumber";
            Value: number;
          }
        ];
      };
    };
  };
};



export type MPesaSendPaymentRequest = {
  BusinessShortCode: number;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: number;
  PartyA: number;
  PartyB: number;
  PhoneNumber: number;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

export type MPesaSendPaymentRequestDarajaResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MPesaSendPayoutRequestBody {
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: string;
  Amount: number;
  PartyA: number;
  PartyB: number;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
  Occassion: string;
}

export interface MPesaSendPayoutResponseBody {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface MPesaPayoutWebhookRequestBody {
  Result: Partial<{
    ResultCode: number;
    ConversationID: string;
  }>
  /**
   * @todo this hasn't yet been determined working on it
   */
}

export type B2BSetupCredentials = Partial<{
  /**
   * The password for the initiator security credential
   */
  password: string,
  /**
   * The security credential for the initiator
   */
  security_credential: string
  /**
   * The consumer key for the app
   */
  consumer_key: string,
  /**
   * The consumer secret for the app
   */
  consumer_secret: string,
  /**
   * The pass key for the app
   */
  pass_key: string,
  /**
   * The short code for the app
   */
  short_code: number,
  /**
   * The business name for the app, will be used to identify the initiator
   */
  business_name: string,
}>


export type C2BSetupCredentials = Partial<{
  /**
   * The consumer key for the app
   */
  consumer_key: string,
  /**
   * The consumer secret for the app
   */
  consumer_secret: string,
  /**
   * The pass key for the app
   */
  pass_key: string,
  /**
   * The short code for the app
   */
  short_code: number,
  /**
   * The business name for the app, will be used for the initiator name value
   */
  business_name: string,
}>