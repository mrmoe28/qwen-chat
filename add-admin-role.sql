-- Add admin role to User table
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN DEFAULT FALSE;