import { defineConfig } from 'astro/config';
import 'dotenv/config';

import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL || 'http://localhost:4321';
const twPlugin = tailwindcss();

export default defineConfig({
    site,
    output: 'server',
    adapter: node({
        mode: 'standalone'
    }),
    integrations: [react()],
    markdown: {
        shikiConfig: {
            theme: 'catppuccin-mocha'
        }
    },
    vite: {
        // @ts-ignore
        plugins: Array.isArray(twPlugin) ? twPlugin : [twPlugin]
    }
});