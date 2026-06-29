-- AlterTable
ALTER TABLE "DiscussionReply" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "DiscussionReply" ADD CONSTRAINT "DiscussionReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
