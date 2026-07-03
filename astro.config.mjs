import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// This page checks live services on every request, so it needs to run
// server-side rather than be pre-rendered as static HTML.
// Swap the adapter below if you're not deploying to Cloudflare Pages
// (e.g. @astrojs/vercel or @astrojs/netlify) — everything else stays the same.
export default defineConfig({
  site: 'https://status.rjmlaird.co.uk',
  output: 'server',
  adapter: cloudflare(),
  integrations: [tailwind({ applyBaseStyles: false })],
});
