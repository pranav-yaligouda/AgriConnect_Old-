import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled',
            'react-router-dom'
          ],
          auth: ['./src/pages/Login', './src/pages/Register'],
          dashboard: ['./src/pages/Dashboard', './src/pages/Profile'],
          marketplace: [
            './src/pages/Marketplace',
            './src/pages/ProductDetails'
          ]
        }
      }
    },
    outDir: 'build',
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  resolve: {
    alias: {
      'src/utils/getApiBaseUrl': '/src/utils/getApiBaseUrl.vite.ts',
    },
  },
  root: './',
  base: './',
  publicDir: 'public',
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    open: true,
    allowedHosts: ['localhost',"rangers-la-universal-better.trycloudflare.com"],
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'react-router-dom'
    ],
    exclude: ['js-big-decimal']
  }
});