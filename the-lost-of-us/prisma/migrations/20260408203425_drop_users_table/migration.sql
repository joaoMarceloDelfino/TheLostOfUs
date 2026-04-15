/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "fk_comments_user";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "fk_posts_user";

-- DropTable
DROP TABLE "users";
