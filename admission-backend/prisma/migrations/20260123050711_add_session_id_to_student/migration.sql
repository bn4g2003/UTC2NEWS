/*
  Warnings:

  - You are about to drop the column `currentPhase` on the `admission_sessions` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admission_sessions" DROP COLUMN "currentPhase";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "documentPdf" TEXT,
ADD COLUMN     "idCardPhoto" TEXT,
ADD COLUMN     "photo3x4" TEXT,
ADD COLUMN     "scores" JSONB,
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SessionPhase";

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "admission_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
