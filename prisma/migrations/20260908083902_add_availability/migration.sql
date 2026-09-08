-- CreateTable
CREATE TABLE "availability_rule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "availability_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_override" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "availability_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_override_block" (
    "id" TEXT NOT NULL,
    "overrideId" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "availability_override_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "minNoticeHours" INTEGER NOT NULL DEFAULT 0,
    "maxAdvanceDays" INTEGER,

    CONSTRAINT "availability_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_rule_userId_dayOfWeek_idx" ON "availability_rule"("userId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "availability_override_userId_date_key" ON "availability_override"("userId", "date");

-- CreateIndex
CREATE INDEX "availability_override_block_overrideId_idx" ON "availability_override_block"("overrideId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_settings_userId_key" ON "availability_settings"("userId");

-- AddForeignKey
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_override" ADD CONSTRAINT "availability_override_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_override_block" ADD CONSTRAINT "availability_override_block_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "availability_override"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_settings" ADD CONSTRAINT "availability_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
