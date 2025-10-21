import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // rutas relativas (ideal para hosting estático o subcarpetas)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
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
      // 👇 aquí definimos las páginas HTML que queremos compilar
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        send: resolve(__dirname, 'send.html'),
      },
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
