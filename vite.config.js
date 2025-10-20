import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './', // ✅ critical for static hosting (Netlify, Firebase, local dist)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // allows "import x from '@/file'"
    },
  },
  optimizeDeps: {
    include: [
      'pixi.js',
      'pixi-filters',
      'firebase/app',
      'firebase/firestore',
    ],
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    modulePreload: true,
    sourcemap: false,
    minify: 'esbuild',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js', 'pixi-filters'],
          firebase: ['firebase/app', 'firebase/firestore'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
