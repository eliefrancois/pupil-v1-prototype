/** @type {import('next').NextConfig} */
const nextConfig = {
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
