import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs"; // important for Cloudinary Node SDK

function bufferFromFile(file: File) {
  return file.arrayBuffer().then((ab) => Buffer.from(ab));
}

function uploadBufferToCloudinary(
  buffer: Buffer,
  opts: { folder: string; publicId?: string }
): Promise<{ url: string; publicId: string; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder,
        public_id: opts.publicId,
        resource_type: "image",
      },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );

    stream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // accepts:
    // - cover (optional single)
    // - images (optional multiple)
    const cover = form.get("cover");
    const images = form.getAll("images");

    const files: { kind: "cover" | "image"; file: File }[] = [];

    if (cover instanceof File && cover.size > 0) files.push({ kind: "cover", file: cover });
    for (const it of images) {
      if (it instanceof File && it.size > 0) files.push({ kind: "image", file: it });
    }

    // guardrails
    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "No files uploaded." }, { status: 400 });
    }
    if (files.length > 10) {
      return NextResponse.json({ ok: false, error: "Max 10 images per upload." }, { status: 400 });
    }

    const uploaded: { kind: "cover" | "image"; url: string }[] = [];

    for (const item of files) {
      // simple file type check
      if (!item.file.type.startsWith("image/")) {
        return NextResponse.json(
          { ok: false, error: "Only image files are allowed." },
          { status: 400 }
        );
      }

      const buf = await bufferFromFile(item.file);
      const out = await uploadBufferToCloudinary(buf, { folder: "sensory-directory" });
      uploaded.push({ kind: item.kind, url: out.url });
    }

    const coverUrl = uploaded.find((u) => u.kind === "cover")?.url ?? null;
    const imageUrls = uploaded.filter((u) => u.kind === "image").map((u) => u.url);

    return NextResponse.json({ ok: true, coverUrl, imageUrls });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Upload failed." },
      { status: 500 }
    );
  }
}
