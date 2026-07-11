/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/kol/:handle',
        destination: '/influence/kol/:handle',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
