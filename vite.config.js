// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import tailwindcss from '@tailwindcss/vite';
// import basicSsl from '@vitejs/plugin-basic-ssl';

// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//     basicSsl(),
//   ],
//   server: {
//     host: '0.0.0.0',
//     port: 3000,
//     strictPort: true,
//     proxy: {
//       '/api': {
// target: 'http://127.0.0.1:5000', // localhost ya 127.0.0.1 bilkul sahi hai        changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
  ],
  resolve: {
    // Ye line ensure karti hai ki app mein multiple React copies load na ho (fixes Invalid hook call)
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Node / Express backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});