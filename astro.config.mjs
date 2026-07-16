import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// This page checks live services on every request, so it needs to run
// server-side rather than be pre-rendered as static HTML.
export default defineConfig({
  site: 'https://status.rjmlaird.co.uk',
  output: 'server',
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
