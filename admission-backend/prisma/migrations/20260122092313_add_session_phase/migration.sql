-- CreateEnum
CREATE TYPE "SessionPhase" AS ENUM ('setup', 'registration', 'admission', 'completed');

-- AlterTable
ALTER TABLE "admission_sessions" ADD COLUMN     "currentPhase" "SessionPhase" NOT NULL DEFAULT 'setup';
