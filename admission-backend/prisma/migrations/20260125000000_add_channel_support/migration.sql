-- Add new fields to chat_rooms table
ALTER TABLE "chat_rooms" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_rooms" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "chat_rooms" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- Add new CHANNEL type to RoomType enum
ALTER TYPE "RoomType" ADD VALUE IF NOT EXISTS 'CHANNEL';

-- Add role field to chat_room_participants
ALTER TABLE "chat_room_participants" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- Add foreign key for createdBy
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_createdBy_fkey" 
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL;

-- Create index for public channels
CREATE INDEX IF NOT EXISTS "chat_rooms_isPublic_type_idx" ON "chat_rooms"("isPublic", "type");
