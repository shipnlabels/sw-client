import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
const Path = require('path');
import { resolve } from 'path';
const userAgent = process.env.VITE_USER_AGENT || 'SmallWorldsClient';
//use dotenvx
// import dotenv from '@dotenvx/dotenvx';
// dotenv.config();
const baseUrl = process.env.VITE_DEFAULT_URL;


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
    }),
  ],
  build: {
    // chunkSizeWarningLimit: 1600,
    outDir: Path.join(__dirname, 'build', 'renderer'),
    emptyOutDir: true,
  },
  open: false,
  root: Path.join(__dirname, 'src', 'renderer'),
  publicDir: 'public',
  // use rollupoptions
  // rollupInputOptions: {

  // pluginOptions: {
  //   electronBuilder: {
  //     preload : 'src/preload.js',
  //   },
  // },
  // proxy
  server: {
    port: 0,
    strictPort: false,
    host: 'localhost',
    hmr:
    {
      protocol: 'ws',
      host: 'localhost',
    },
    watch: {
      usePolling: true,
      additionalPaths:(watcher) => 
      {
        watcher.add(path.resolve(__dirname, '**'));
      },
    },
    proxy: {

      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        headers: {
          'User-Agent': userAgent,
        },
      },
      // NOTE: '/space' is deliberately NOT proxied.
      //
      // Teleporting between spaces (and hitting refresh) makes the Flash client
      // set window.location to /space/<id>/. With a proxy here that full page
      // load went to the Laravel backend, which answers with
      // {"message":"Please open spaces directly inside the SmallWorldsX Electron
      // client."} - the white screen. Leaving it unproxied lets Vite's SPA
      // fallback serve the app, so vue-router handles the route and SpaceView
      // loads the new space properly.
      //
      // The game's own asset and gateway requests use absolute :8000 URLs, and
      // the Vue app talks to /api (still proxied below), so nothing else relies
      // on this.
    },
  },
  define: { 'process.env': {},
  global: {},
},
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer'),
      '@components': resolve(__dirname, './src/renderer/components'),
      '@stores': resolve(__dirname, './src/renderer/stores'),
      '@assets': resolve(__dirname, './src/renderer/public'),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ]
  },
});