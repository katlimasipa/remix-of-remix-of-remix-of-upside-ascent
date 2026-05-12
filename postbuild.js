import fs from 'fs';
import path from 'path';
import { build } from 'esbuild';

const distServer = path.resolve('dist/server');
const distClient = path.resolve('dist/client');
const apiDir = path.resolve('api');
const publicDir = path.resolve('public');

async function run() {
  console.log('Starting ultimate Vercel staging process...');

  if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // 1. Copy client assets to public/
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
    copyRecursive(distClient, publicDir);
    console.log('✓ Staged static assets in public/');
  }

  // 2. Find server entry and bundle it into a single file
  if (fs.existsSync(distServer)) {
    const assetsDir = path.join(distServer, 'assets');
    const files = fs.readdirSync(assetsDir);
    const serverEntryFile = files.find(f => f.startsWith('server-') && f.endsWith('.js'));
    
    if (!serverEntryFile) {
      console.error('✗ Could not find server entry.');
      process.exit(1);
    }

    const serverEntryPath = path.join(assetsDir, serverEntryFile);
    console.log(`✓ Found server entry: ${serverEntryFile}`);

    // Create a temporary bridge to be the entry point for esbuild
    const bridgePath = path.join(apiDir, '_bridge.js');
    const bridgeContent = `
import { toNodeHandler } from 'srvx/node';
import serverEntry from '${serverEntryPath.replace(/\\/g, '/')}';
export default toNodeHandler(serverEntry.fetch || serverEntry.default?.fetch || serverEntry);
`;
    fs.writeFileSync(bridgePath, bridgeContent);

    console.log('Bundling SSR function with esbuild...');
    try {
      await build({
        entryPoints: [bridgePath],
        bundle: true,
        outfile: path.join(apiDir, 'index.js'),
        platform: 'node',
        format: 'esm',
        target: 'node22',
        minify: true,
        sourcemap: false,
        external: ['node:*', 'aws-sdk', 'mock-aws-s3', 'nock'], // Standard Node externals + optional ones that sometimes break bundling
        banner: {
          js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
        },
      });
      console.log('✓ Successfully bundled entire SSR engine into api/index.js');
      
      // Cleanup bridge
      fs.unlinkSync(bridgePath);
    } catch (err) {
      console.error('✗ Bundling failed:', err);
      process.exit(1);
    }
  }

  console.log('Ready for Vercel deployment.');
}

run();
