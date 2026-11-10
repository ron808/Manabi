/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

// The browser only ever talks to this origin: Groq and Upstash are called
// from the server. 'unsafe-eval' is needed by React's dev tooling only.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Old app URLs keep working.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/today", permanent: true },
      { source: "/configure", destination: "/new", permanent: true },
      { source: "/mistakes", destination: "/review/library", permanent: true },
    ];
  },
};

export default nextConfig;
