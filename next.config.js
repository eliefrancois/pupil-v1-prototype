const posthogHost = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
).replace(/\/$/, '')
const posthogAssetsHost = posthogHost.replace(
  /^https:\/\/(us|eu)\.i\.posthog\.com$/,
  'https://$1-assets.i.posthog.com'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostHog's ingestion endpoints use trailing slashes (/e/, /decide/).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogAssetsHost}/static/:path*` },
      { source: '/ingest/:path*', destination: `${posthogHost}/:path*` },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
    // DiceBear serves avatars as SVG. Next/Image blocks SVG by default
    // because untrusted SVG can contain <script>. We trust the dicebear
    // host (only loaded for ghost mentors via our import script) and
    // the CSP below sandboxes any rendered SVG to prevent script exec.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      // The former "For Students" marketing page was repurposed into "For Schools".
      { source: '/students', destination: '/schools', permanent: true },
    ]
  },
}

module.exports = nextConfig
