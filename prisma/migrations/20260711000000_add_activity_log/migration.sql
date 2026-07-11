-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userid" TEXT,
    "email" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ip" TEXT,
    "useragent" TEXT,
    "status" INTEGER,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_createdat_idx" ON "ActivityLog"("createdat");

-- CreateIndex
CREATE INDEX "ActivityLog_userid_idx" ON "ActivityLog"("userid");

-- CreateIndex
CREATE INDEX "ActivityLog_email_idx" ON "ActivityLog"("email");

-- CreateIndex
CREATE INDEX "ActivityLog_ip_idx" ON "ActivityLog"("ip");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
