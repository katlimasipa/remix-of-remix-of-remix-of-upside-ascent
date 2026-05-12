import fs from 'fs';
import path from 'path';

const distServer = path.resolve('dist/server');
const distClient = path.resolve('dist/client');
const outputDir = path.resolve('.vercel/output');

console.log('Generating Vercel Build Output API v3 structure...');

// 1. Clean and create directories
if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, 'static'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'functions/index.func'), { recursive: true });

// 2. Copy static files
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(distClient)) {
  copyRecursive(distClient, path.join(outputDir, 'static'));
  console.log('Copied static assets.');
}

// 3. Setup SSR function
if (fs.existsSync(distServer)) {
  // Copy server files to function directory
  copyRecursive(distServer, path.join(outputDir, 'functions/index.func'));
  
  // Create bridge index.js inside the function directory
  // We use require/import bridge to TanStack Start
  const bridgeContent = `
import server from './server.js';
import { toNodeHandler } from 'srvx/node';

export default toNodeHandler(server.fetch);
`;
  fs.writeFileSync(path.join(outputDir, 'functions/index.func/index.js'), bridgeContent);

  // Create .vc-config.json for the function
  const vcConfig = {
    runtime: 'nodejs22.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    shouldAddHelpers: true,
    shouldAddVarsToContext: true
  };
  fs.writeFileSync(path.join(outputDir, 'functions/index.func/.vc-config.json'), JSON.stringify(vcConfig, null, 2));
  
  console.log('Configured SSR function.');
}

// 4. Create config.json
const config = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: 'index' }
  ]
};
fs.writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 2));

console.log('Vercel Build Output API v3 structure successfully generated.');
