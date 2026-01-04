import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/auth/rateLimit";

/**
 * Server-side file upload validation
 * Validates file type, size, and basic content checks
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

/**
 * Validate file extension
 */
function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validate file MIME type
 */
function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Validate file size
 */
function isValidSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * POST /api/upload/validate
 * Validates file before upload
 * Requires admin authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(req, RATE_LIMITS.admin);
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
      return (authResult as { authorized: false; response: NextResponse }).response;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { valid: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidSize(file.size)) {
      return NextResponse.json(
        {
          valid: false,
          error: `File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!isValidExtension(file.name)) {
      return NextResponse.json(
        {
          valid: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          valid: false,
          error: `Invalid MIME type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Additional validation: Check file signature (magic bytes)
    // This helps prevent file type spoofing
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));

    // JPEG: FF D8 FF
    const isJPEG = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPNG =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;
    // GIF: 47 49 46 38
    const isGIF =
      bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
    // WebP: Check for RIFF...WEBP signature
    const isWebP =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    if (!isJPEG && !isPNG && !isGIF && !isWebP) {
      return NextResponse.json(
        {
          valid: false,
          error: "File content does not match file type. Possible file spoofing detected.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("File validation error:", error);
    return NextResponse.json(
      { valid: false, error: error.message || "File validation failed" },
      { status: 500 }
    );
  }
}

