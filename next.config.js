/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // ⬇️ Replace "YOUR-PROJECT-REF.supabase.co" with your actual Supabase hostname
      { protocol: 'https', hostname: 'YOUR-PROJECT-REF.supabase.co' },
    ],
  },
  reactStrictMode: true,
};
module.exports = nextConfig;
