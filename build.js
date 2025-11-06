import esbuild from 'esbuild';
import { spawn } from 'child_process';

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  console.log('⚠️  Building in development mode');

  let nodeProcess = null;

  // restart process on build
  const restartPlugin = {
    name: 'restart',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length === 0) {
          console.log('✅ Build OK, restarting node process...');
          if (nodeProcess) {
            nodeProcess.kill('SIGTERM');
          }
          nodeProcess = spawn('node', ['.out/index.js'], { stdio: 'inherit' });
          console.log("process restarted")
        }
      });
    }
  };

  const ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: '.out',
    sourcemap: true,
    minify: false,
    treeShaking: false,
    splitting: false,
    packages: 'external',
    logLevel: 'info',
    plugins: [ restartPlugin ]
  });

  // Watch files
  await ctx.watch();

  // Initial build
  await ctx.rebuild();

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