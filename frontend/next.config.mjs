/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/kol/:handle',
        destination: '/influence/kol/:handle',
        permanent: true,
      },
      // Contracts et Disputes remplaces par « My escrows » (liste unique, tous contrats).
      { source: '/:niche/contracts', destination: '/:niche/all', permanent: false },
      { source: '/:niche/disputes', destination: '/:niche/all', permanent: false },
    ];
  },
};

export default nextConfig;
