-- CreateTable
CREATE TABLE "AnalyticsDefinition" (
    "analyticsID" SERIAL NOT NULL,
    "analyticsName" TEXT NOT NULL,
    "analyticsDescription" TEXT,
    "nameOfJSONFile" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDefinition_pkey" PRIMARY KEY ("analyticsID")
);
