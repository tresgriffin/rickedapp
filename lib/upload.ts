import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// FUTURE: multi-image uploads. Currently each post/review/recipe supports one
// image. When multi-image lands, accept File[] and return string[].

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif", // HEIC container variant
  "image/gif",
]);

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code: "TOO_LARGE" | "WRONG_FORMAT" | "NETWORK_ERROR"
  ) {
    super(message);
    this.name = "UploadError";
  }
}

function validate(file: File): void {
  if (file.size > MAX_BYTES) {
    throw new UploadError(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
      "TOO_LARGE"
    );
  }

  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new UploadError(
      "Only JPEG, PNG, WebP, HEIC, and GIF images are accepted.",
      "WRONG_FORMAT"
    );
  }
}

/**
 * Upload a file to Vercel Blob (production) or local disk (dev without token).
 * Returns a public URL. Throws UploadError for validation failures.
 *
 * Callers: lib/actions/post.ts, recipe.ts, review.ts, and avatar upload.
 * The signature is stable — switching providers only changes this file.
 */
export async function uploadFile(file: File): Promise<string> {
  validate(file);

  // Production path: Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
      const pathname = `uploads/${randomUUID()}.${ext}`;
      const blob = await put(pathname, file, { access: "public" });
      return blob.url;
    } catch (err) {
      // Rethrow as UploadError so callers can show a specific message
      throw new UploadError(
        "Upload failed. Check your connection and try again.",
        "NETWORK_ERROR"
      );
    }
  }

  // Local dev fallback: write to public/uploads/
  const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
