import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("images");
  const savedUrls: string[] = [];

  for (const file of files) {
    if (typeof file === "object" && "arrayBuffer" in file && file.name) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || ".jpg";
      const filename = `${crypto.randomUUID()}${ext}`;
      const savePath = path.join(process.cwd(), "public", "images", "sighting-images", filename);
      await fs.mkdir(path.dirname(savePath), { recursive: true });
      await fs.writeFile(savePath, buffer);
      savedUrls.push(`/images/sighting-images/${filename}`);
    }
  }

  return NextResponse.json({ urls: savedUrls });
}
