-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('DUE', 'PAID', 'FAILED', 'VOID');

-- CreateEnum
CREATE TYPE "public"."RoleLevel" AS ENUM ('MANAGER', 'TECHNICIAN', 'MACHINE');

-- CreateTable
CREATE TABLE "public"."Customer" (
    "customerID" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "ccExpiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerID")
);

-- CreateTable
CREATE TABLE "public"."Package" (
    "packageID" SERIAL NOT NULL,
    "monthlyCost" INTEGER NOT NULL,
    "annualCost" INTEGER NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("packageID")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "subscriptionID" SERIAL NOT NULL,
    "customerID" INTEGER NOT NULL,
    "packageID" INTEGER NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "price" INTEGER NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("subscriptionID")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "paymentID" SERIAL NOT NULL,
    "subscriptionID" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "public"."PaymentStatus" NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("paymentID")
);

-- CreateTable
CREATE TABLE "public"."DataJson" (
    "data_json_ID" SERIAL NOT NULL,
    "data_json" JSONB NOT NULL,

    CONSTRAINT "DataJson_pkey" PRIMARY KEY ("data_json_ID")
);

-- CreateTable
CREATE TABLE "public"."Analysis" (
    "analysisID" SERIAL NOT NULL,
    "analysisName" TEXT NOT NULL,
    "analysisDescription" TEXT NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("analysisID")
);

-- CreateTable
CREATE TABLE "public"."Analytics" (
    "analyticsID" SERIAL NOT NULL,
    "analysisTypeID" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,
    "ran_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_json_ID" INTEGER NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("analyticsID")
);

-- CreateTable
CREATE TABLE "public"."Level" (
    "levelID" SERIAL NOT NULL,
    "level" "public"."RoleLevel" NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("levelID")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "userID" SERIAL NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "levelID" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "public"."Customer"("email");

-- CreateIndex
CREATE INDEX "Subscription_customerID_idx" ON "public"."Subscription"("customerID");

-- CreateIndex
CREATE INDEX "Subscription_packageID_idx" ON "public"."Subscription"("packageID");

-- CreateIndex
CREATE INDEX "Payment_subscriptionID_idx" ON "public"."Payment"("subscriptionID");

-- CreateIndex
CREATE INDEX "Payment_status_dueDate_idx" ON "public"."Payment"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Analytics_analysisTypeID_idx" ON "public"."Analytics"("analysisTypeID");

-- CreateIndex
CREATE INDEX "Analytics_userID_idx" ON "public"."Analytics"("userID");

-- CreateIndex
CREATE INDEX "Analytics_data_json_ID_idx" ON "public"."Analytics"("data_json_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Level_level_key" ON "public"."Level"("level");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "public"."User"("firebaseUid");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_customerID_fkey" FOREIGN KEY ("customerID") REFERENCES "public"."Customer"("customerID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_packageID_fkey" FOREIGN KEY ("packageID") REFERENCES "public"."Package"("packageID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_subscriptionID_fkey" FOREIGN KEY ("subscriptionID") REFERENCES "public"."Subscription"("subscriptionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Analytics" ADD CONSTRAINT "Analytics_analysisTypeID_fkey" FOREIGN KEY ("analysisTypeID") REFERENCES "public"."Analysis"("analysisID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Analytics" ADD CONSTRAINT "Analytics_userID_fkey" FOREIGN KEY ("userID") REFERENCES "public"."User"("userID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Analytics" ADD CONSTRAINT "Analytics_data_json_ID_fkey" FOREIGN KEY ("data_json_ID") REFERENCES "public"."DataJson"("data_json_ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_levelID_fkey" FOREIGN KEY ("levelID") REFERENCES "public"."Level"("levelID") ON DELETE RESTRICT ON UPDATE CASCADE;
