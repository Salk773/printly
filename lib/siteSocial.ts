/** Default public profiles (override with NEXT_PUBLIC_SOCIAL_* on Vercel if needed). */
const DEFAULT_INSTAGRAM = "https://www.instagram.com/printlyae";
const DEFAULT_TIKTOK = "https://www.tiktok.com/@printly.ae";

export function getPublicSocialUrls(): {
  instagram: string;
  tiktok: string;
} {
  return {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || DEFAULT_INSTAGRAM,
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK?.trim() || DEFAULT_TIKTOK,
  };
}
