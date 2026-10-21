import config from '/Users/User/.codex/worktrees/verify-hal-base/personal-site/astro.config.mjs';
import cloudflare from '/Users/User/.codex/worktrees/verify-hal-base/personal-site/node_modules/@astrojs/cloudflare/dist/index.js';
export default {...config, adapter: cloudflare({imageService:'passthrough',inspectorPort:9253}), vite:{...config.vite,cacheDir:'/tmp/pr9-base-vite-cache'}};
