/** @type {import('next').NextConfig} */

let userConfig = {}

try {
  // Essayons d'importer dynamiquement un fichier de config personnalisé (optionnel)
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    userConfig = await import('./v0-user-next.config.js')
  } catch (err) {
    // aucun fichier trouvé, on garde la config par défaut
    userConfig = {}
  }
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  ...userConfig.default // on merge si userConfig existe
}

export default nextConfig
