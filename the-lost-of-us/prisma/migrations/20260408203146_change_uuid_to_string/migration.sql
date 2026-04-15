-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "fk_comments_user";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "fk_posts_user";

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "user_sub" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "user_sub" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "user_sub" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "fk_comments_user" FOREIGN KEY ("user_sub") REFERENCES "users"("user_sub") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "fk_posts_user" FOREIGN KEY ("user_sub") REFERENCES "users"("user_sub") ON DELETE CASCADE ON UPDATE NO ACTION;
