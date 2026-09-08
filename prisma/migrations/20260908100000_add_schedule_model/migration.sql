-- CreateTable
CREATE TABLE "schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_userId_idx" ON "schedule"("userId");

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: one default Schedule per user that currently has any rule/override,
-- carrying over that user's AvailabilitySettings.timezone (falls back to UTC).
INSERT INTO "schedule" ("id", "userId", "name", "isDefault", "timezone", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."userId",
    'Working hours',
    true,
    COALESCE(s."timezone", 'UTC'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "userId" FROM "availability_rule"
    UNION
    SELECT DISTINCT "userId" FROM "availability_override"
) AS u
LEFT JOIN "availability_settings" s ON s."userId" = u."userId";

-- AlterTable: availability_rule moves from userId to scheduleId
ALTER TABLE "availability_rule" ADD COLUMN "scheduleId" TEXT;

UPDATE "availability_rule" ar
SET "scheduleId" = sch."id"
FROM "schedule" sch
WHERE sch."userId" = ar."userId";

ALTER TABLE "availability_rule" ALTER COLUMN "scheduleId" SET NOT NULL;

DROP INDEX "availability_rule_userId_dayOfWeek_idx";
ALTER TABLE "availability_rule" DROP CONSTRAINT "availability_rule_userId_fkey";
ALTER TABLE "availability_rule" DROP COLUMN "userId";

CREATE INDEX "availability_rule_scheduleId_dayOfWeek_idx" ON "availability_rule"("scheduleId", "dayOfWeek");
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: availability_override moves from userId to scheduleId
ALTER TABLE "availability_override" ADD COLUMN "scheduleId" TEXT;

UPDATE "availability_override" ao
SET "scheduleId" = sch."id"
FROM "schedule" sch
WHERE sch."userId" = ao."userId";

ALTER TABLE "availability_override" ALTER COLUMN "scheduleId" SET NOT NULL;

DROP INDEX "availability_override_userId_date_key";
ALTER TABLE "availability_override" DROP CONSTRAINT "availability_override_userId_fkey";
ALTER TABLE "availability_override" DROP COLUMN "userId";

CREATE UNIQUE INDEX "availability_override_scheduleId_date_key" ON "availability_override"("scheduleId", "date");
ALTER TABLE "availability_override" ADD CONSTRAINT "availability_override_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: timezone moves from availability_settings to schedule (already backfilled above)
ALTER TABLE "availability_settings" DROP COLUMN "timezone";
