/*
  Warnings:

  - The values [AMEX,DINERS,JCB,MASTERCARD,UNIONPAY,VISA] on the enum `tPaymentTypes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "tPaymentTypes_new" AS ENUM ('STRIPE', 'MPESA', 'PAYPAL', 'UNKNOWN');
ALTER TYPE "tPaymentTypes" RENAME TO "tPaymentTypes_old";
ALTER TYPE "tPaymentTypes_new" RENAME TO "tPaymentTypes";
DROP TYPE "tPaymentTypes_old";
COMMIT;
