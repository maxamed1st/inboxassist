import esbuild from 'esbuild';
import { spawn } from 'child_process';

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  console.log('⚠️  Building in development mode');

  let nodeProcess = null;

  const ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'out',
    sourcemap: true,
    minify: false,
    treeShaking: false,
    splitting: false,
    packages: 'external',
    logLevel: 'info',
  });

  const restartNode = () => {
    if (nodeProcess) nodeProcess.kill();
    nodeProcess = spawn('node', ['dist/index.js'], { stdio: 'inherit' });
  };

  // Watch files
  await ctx.watch();

  // Initial build + run
  await ctx.rebuild();
  restartNode();

  console.log('🟢 Dev server running, watching for changes...');

  // Clean up on exit
  const cleanup = () => {
    if (nodeProcess) nodeProcess.kill();
    ctx.dispose();
    process.exit();
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

} else {
  console.log('⚠️  Building in production mode');

  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'dist',
    sourcemap: false,
    minify: true,
    treeShaking: true,
    splitting: false,
    packages: 'external',
    tsconfig: 'tsconfig.json',
    logLevel: 'info',
  });

  console.log('✅ Production build complete');
}