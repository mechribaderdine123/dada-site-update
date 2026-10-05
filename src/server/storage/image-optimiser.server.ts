import sharp from "sharp";

// Uploaded photos arrive straight from an admin's phone or camera, so a single
// "site image" can be a 4 MB PNG. These settings bring a typical site photo
// down to a few tens of kilobytes without any visible quality loss.

/** Longest edge kept for an uploaded photo; anything larger is downscaled. */
const MAX_EDGE = 1920;
/** Logos are shown in small marquee tiles, so they need far less resolution. */
export const LOGO_MAX_EDGE = 480;
const WEBP_QUALITY = 78;
const WEBP_EFFORT = 5;

/** Animated GIFs must not be flattened, and AVIF is already well compressed. */
const OPTIMISED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type OptimisedImage = {
  bytes: Buffer;
  /** Extension to store under, ".webp" whenever the re-encode was worth it. */
  extension: string;
};

/**
 * Re-encodes an uploaded image as WebP, downscaling oversized photos. Returns
 * the original bytes untouched when the image cannot be improved, so logos,
 * screenshots and line art keep their exact pixels.
 */
export async function optimiseImage(
  bytes: Buffer,
  extension: string,
  maxEdge: number = MAX_EDGE,
): Promise<OptimisedImage> {
  const original = { bytes, extension };
  if (!OPTIMISED_EXTENSIONS.has(extension)) return original;

  try {
    const webp = await sharp(bytes, { failOn: "none" })
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
      .toBuffer();

    // Never make a file bigger, and never touch something tiny (a logo) that
    // WebP cannot shrink meaningfully.
    if (webp.length >= bytes.length) return original;
    return { bytes: webp, extension: ".webp" };
  } catch {
    return original;
  }
}
