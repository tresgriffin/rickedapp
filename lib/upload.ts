import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

/**
 * SWAP_POINT: Replace this entire file's implementation to switch from local
 * disk to S3, Cloudinary, or another provider. The call signature and return
 * value (a public URL string) stay the same — no callers need to change.
 *
 * For S3: install @aws-sdk/client-s3, call PutObjectCommand, return the CDN URL.
 * For Cloudinary: use cloudinary.uploader.upload(), return secure_url.
 *
 * FUTURE: multi-image uploads. Currently each post/review/recipe supports one
 * image. When multi-image lands, this function should accept File[] and return
 * string[], and callers will need to store mediaUrls as a JSON array.
 */
export async function uploadFile(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
