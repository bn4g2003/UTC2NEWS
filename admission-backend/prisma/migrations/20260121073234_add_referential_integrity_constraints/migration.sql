-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_majorId_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_sessionId_fkey";

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "admission_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
