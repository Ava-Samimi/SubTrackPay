/*
  Warnings:

  - Added the required column `postalCode` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "postalCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "name" TEXT NOT NULL;
