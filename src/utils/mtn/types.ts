/**
 * @name Payer
 *
 * @param partyIdType - MSISDN or EMAIL
 * @param partyId - the phone number or email address of the payer
 */
export interface Payer {
  partyIdType: "MSISDN"; // we will only be using MSISDN
  partyId: string;
}

/**
 * @name PaymentRequestBody
 * @description the body of the request to pay request
 * @see - https://momodeveloper.mtn.com/docs/services/collection/operations/RequesttoPay
 *
 * @param amount - the amount to be paid
 * @param currency - the currency of the amount to be paid
 * @param externalId - the id of the transaction, doesnt have to be unique
 * @param payer - the payer's information
 * @param payerMessage - the message to be displayed to the payer
 * @param payeeNote - the note to be displayed to the payee
 */
export interface PaymentRequestsBody {
  amount: string;
  currency: string;
  externalId: string;
  payer: Payer;
  payerMessage: string;
  payeeNote: string;
}

export interface PayoutRequestBody {
    amount: string;
    currency: string;
    externalId: string;
    payee: Payer; // the same as the payument request body
    payeeNote: string;
    payerMessage: string;
}

/**
 * @name PaymentRequestToCustomer
 * @description this is the data that will be sent to the payment request to customer event listener
 *
 */
export interface PaymentRequestToCustomer {
  amount: number;
  user_id: string;
  payment_type_id: string;
  vehicle_id: string;
  authorization_token: string;
  withdrawal_id?: string; // this is used when approving a withdrawal request
  refunded_from?: string; // this is used when refunding a payment
}

/**
 * @description - this data gets sent to the webhook handler for the payment request to customer
 */
export interface MtnPayment {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: Payer;
  payerMessage: string;
  payeeNote: string;
  status: string;
}


/**
 * @description - this data gets sent to the  webhook handler for payout requests
 */
export interface MtnPayout {
  financialTransactionId: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: Payer;
  payerMessage: string;
  payeeNote: string;
  status: string;
}


