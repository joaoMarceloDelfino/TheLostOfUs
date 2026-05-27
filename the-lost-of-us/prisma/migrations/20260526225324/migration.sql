-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_sub" TEXT NOT NULL,
    "actor_sub" TEXT,
    "post_id" UUID,
    "sighting_id" UUID,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipient_sub_read_idx" ON "notifications"("recipient_sub", "read");

-- CreateIndex
CREATE INDEX "notifications_post_id_idx" ON "notifications"("post_id");
