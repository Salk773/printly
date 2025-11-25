/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qctqgifnvhfstvqfnafn.supabase.co"
      }
    ]
  }
};

module.exports = nextConfig;
