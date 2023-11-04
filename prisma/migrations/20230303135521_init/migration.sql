-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('HOST', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'NONACTIVE', 'BANNED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('KES', 'USD', 'ZSD', 'GBP');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('COMPLETE', 'ACTIVE', 'UPCOMING', 'CANCELLED', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'REQUIRES_ACTION', 'PROCESSING', 'REQUIRES_CAPTURE', 'CANCELLED', 'SUCCEEDED');

-- CreateEnum
CREATE TYPE "tPaymentTypes" AS ENUM ('AMEX', 'DINERS', 'JCB', 'MASTERCARD', 'UNIONPAY', 'VISA', 'MPESA', 'PAYPAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "tTransmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "VehiclePicture" AS ENUM ('ACTIVE', 'NONACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ACTIVE', 'NONACTIVE', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "AuthCodeStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'NONACTIVE');

-- CreateEnum
CREATE TYPE "tPaymentTypeStatus" AS ENUM ('ACTIVE', 'NONACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "lname" TEXT,
    "fname" TEXT,
    "handle" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profile_pic_url" TEXT,
    "market_id" UUID NOT NULL,
    "sub_market_id" UUID NOT NULL,
    "user_type" "UserType" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "connected_account_id" TEXT,
    "customer_id" TEXT,
    "description" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTypes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "tPaymentTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "details" TEXT,

    CONSTRAINT "PaymentTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" UUID NOT NULL,
    "country" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubMarket" (
    "id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SubMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sub_market_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "hourly_rate" TEXT NOT NULL,
    "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "duration" DOUBLE PRECISION NOT NULL,
    "payment_id" UUID NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "payment_type" UUID NOT NULL,
    "account_number" TEXT,
    "authorization" TEXT,
    "paymentToken" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "date_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "stripe_payment_id" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "address" TEXT,
    "building_name" TEXT,
    "color" TEXT,
    "seats" INTEGER,
    "plate" TEXT,
    "transmission" "tTransmission" DEFAULT 'MANUAL',
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "hourly_rate" TEXT,
    "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
    "tracking_device_id" TEXT,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePictures" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "status" "VehiclePicture" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "VehiclePictures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" UUID NOT NULL,
    "notifications_enabled" BOOLEAN NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushTokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_settings_id" UUID NOT NULL,

    CONSTRAINT "PushTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Market_country_key" ON "Market"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Market_name_key" ON "Market"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubMarket_name_key" ON "SubMarket"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Station_name_key" ON "Station"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sub_market_id_fkey" FOREIGN KEY ("sub_market_id") REFERENCES "SubMarket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTypes" ADD CONSTRAINT "PaymentTypes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubMarket" ADD CONSTRAINT "SubMarket_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_sub_market_id_fkey" FOREIGN KEY ("sub_market_id") REFERENCES "SubMarket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_type_fkey" FOREIGN KEY ("payment_type") REFERENCES "PaymentTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePictures" ADD CONSTRAINT "VehiclePictures_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushTokens" ADD CONSTRAINT "PushTokens_user_settings_id_fkey" FOREIGN KEY ("user_settings_id") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
