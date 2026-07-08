/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint check during production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript build errors during production build (we run tsc manually)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
