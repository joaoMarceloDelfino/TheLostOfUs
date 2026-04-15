-- DropForeignKey
ALTER TABLE "comment_reports" DROP CONSTRAINT "comment_reports_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_votes" DROP CONSTRAINT "comment_votes_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "fk_comments_parent_comment";

-- DropIndex
DROP INDEX "idx_comments_rank";

-- AlterTable
ALTER TABLE "comment_reports" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comment_votes" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_comment_reports_comment" RENAME TO "comment_reports_comment_id_idx";

-- RenameIndex
ALTER INDEX "uq_comment_reports_comment_user" RENAME TO "comment_reports_comment_id_user_sub_key";

-- RenameIndex
ALTER INDEX "idx_comment_votes_comment" RENAME TO "comment_votes_comment_id_idx";

-- RenameIndex
ALTER INDEX "uq_comment_votes_comment_user" RENAME TO "comment_votes_comment_id_user_sub_key";

-- RenameIndex
ALTER INDEX "idx_comments_post_parent" RENAME TO "comments_post_id_parent_comment_id_idx";
