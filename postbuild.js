import fs from 'fs';
import path from 'path';

const distServer = path.resolve('dist/server');
const distClient = path.resolve('dist/client');
const apiDir = path.resolve('api');
const publicDir = path.resolve('public');

console.log('Staging files for Vercel...');

if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

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

// 1. Copy client assets to public/ for static serving
if (fs.existsSync(distClient)) {
  copyRecursive(distClient, publicDir);
  console.log('Copied client files to public/');
}

// 2. Resolve the hashed server entry and create a static bridge in api/index.js
if (fs.existsSync(distServer)) {
  const assetsDir = path.join(distServer, 'assets');
  const files = fs.readdirSync(assetsDir);
  const serverEntry = files.find(f => f.startsWith('server-') && f.endsWith('.js'));
  
  if (serverEntry) {
    console.log(`Found server entry: ${serverEntry}`);
    
    // Create a self-contained bridge in api/index.js
    // We import the hashed entry STATICALLY so Vercel's bundler can find it.
    const bridgeContent = `
import { toNodeHandler } from 'srvx/node';
import serverEntry from '../dist/server/assets/${serverEntry}';

// Replicate the error wrapping from src/server.ts if needed, 
// but for now let's just bridge the core handler.
export default toNodeHandler(serverEntry.fetch || serverEntry.default?.fetch || serverEntry);
`;
    fs.writeFileSync(path.join(apiDir, 'index.js'), bridgeContent);
    console.log('Created static bridge in api/index.js');
  } else {
    console.error('Could not find server entry in dist/server/assets');
    process.exit(1);
  }
}
