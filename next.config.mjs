/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qctqgifnvhfstvqfnafn.supabase.co",
      },
    ],
  },
};

export default nextConfig;
