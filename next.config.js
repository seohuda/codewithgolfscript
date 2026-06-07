/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // Content Security Policy. App Router injects inline bootstrap
    // scripts and styled-jsx uses inline styles, so 'unsafe-inline' is
    // required for script/style. The CSP still blocks the highest-risk
    // vectors: plugins (object-src), <base> hijacking, framing, and
    // restricts where scripts/images/connections may originate.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      // Prevent MIME-type sniffing.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Disallow framing to mitigate clickjacking.
      { key: "X-Frame-Options", value: "DENY" },
      // Limit referrer leakage.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Lock down powerful browser features by default.
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
      // Force HTTPS for two years (production traffic is HTTPS via CloudFront).
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // Defense-in-depth against injected/inline script execution.
      { key: "Content-Security-Policy", value: csp },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
