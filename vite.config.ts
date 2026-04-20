import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ include: ['src'], rollupTypes: true, tsconfigPath: './tsconfig.json' }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FleetworkTrackingSDK',
      fileName: (format) =>
        format === 'es'
          ? 'fleetwork-tracking-sdk-react.js'
          : 'fleetwork-tracking-sdk-react.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@vietmap/vietmap-gl-js',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (asset) =>
          asset.name === 'style.css' ? 'styles.css' : (asset.name ?? 'asset'),
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
