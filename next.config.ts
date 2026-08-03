import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

function readRemoteMediaPattern(value: string | undefined) {
  if (!value?.trim()) {
    return undefined
  }

  try {
    const url = new URL(value)

    if (url.protocol !== 'https:') {
      return undefined
    }

    return {
      protocol: 'https' as const,
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    }
  } catch {
    return undefined
  }
}

const configuredMediaPattern = readRemoteMediaPattern(process.env.NEXT_PUBLIC_MEDIA_ORIGIN)

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms.yufavor.com',
        pathname: '/**',
      },
      ...(configuredMediaPattern ? [configuredMediaPattern] : []),
    ],
  },
}

export default withNextIntl(nextConfig)
