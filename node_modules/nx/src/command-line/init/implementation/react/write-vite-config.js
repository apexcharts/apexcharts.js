"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeViteConfig = writeViteConfig;
const fs_1 = require("fs");
function writeViteConfig(appName, isStandalone, isJs) {
    let port = 4200;
    // Use PORT from .env file if it exists in project.
    if ((0, fs_1.existsSync)(`../.env`)) {
        const envFile = (0, fs_1.readFileSync)(`../.env`).toString();
        const result = envFile.match(/\bport=(?<port>\d{4})/i);
        const portCandidate = Number(result?.groups?.port);
        if (!isNaN(portCandidate)) {
            port = portCandidate;
        }
    }
    (0, fs_1.writeFileSync)(isStandalone ? 'vite.config.js' : `apps/${appName}/vite.config.js`, `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: ${isStandalone ? `'./dist/${appName}'` : `'../../dist/apps/${appName}'`}
  },
  server: {
    port: ${port},
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/setupTests.${isJs ? 'js' : 'ts'}',
    css: true,
  },
  plugins: [react()],
});
`);
}
