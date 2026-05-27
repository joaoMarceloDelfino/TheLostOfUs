-- CreateTable
CREATE TABLE "sighting_images" (
    "id" UUID NOT NULL,
    "sighting_id" UUID NOT NULL,
    "image_uri" TEXT NOT NULL,

    CONSTRAINT "sighting_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sighting_images" ADD CONSTRAINT "fk_sighting_images_sighting" FOREIGN KEY ("sighting_id") REFERENCES "sightings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
