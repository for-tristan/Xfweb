-- CreateTable
CREATE TABLE "BannedDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "reason" TEXT,
    "bannedby" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedDevice_deviceId_key" ON "BannedDevice"("deviceId");
