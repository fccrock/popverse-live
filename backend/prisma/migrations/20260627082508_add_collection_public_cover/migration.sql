-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
