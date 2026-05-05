import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Emit a stub `.d.ts` for the side-effect CSS import so consumers using
// `moduleResolution: bundler` don't get TS2882 on
// `import '@vietmap/tracking-sdk-react/styles.css'`.
const cssTypesPlugin = () => ({
  name: 'sdk-css-types',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'styles.css.d.ts',
      source: 'export {}\n',
    })
  },
})

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8'),
) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

// Externalize EVERY runtime dep (deps + peer deps) so Rolldown does NOT
// bundle CJS copies of them. Bundled CJS deps that internally call
// `require('react')` are what trigger:
//   "Calling `require` for \"react\" in an environment that doesn't expose
//    the `require` function"
// at runtime in the browser. See:
//   https://rolldown.rs/in-depth/bundling-cjs#require-external-modules
//
// Anything in `dependencies` is auto-installed for consumers when they
// install this SDK, so externalizing them is safe — pnpm/npm hoists them
// next to the SDK in node_modules.
const runtimeDeps = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
]
const externalMatcher = (id: string) =>
  runtimeDeps.some((dep) => id === dep || id.startsWith(`${dep}/`))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ['src'],
      exclude: ['src/example/**', 'src/main.tsx', 'src/App.tsx'],
      tsconfigPath: './tsconfig.build.json',
    }),
    cssTypesPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FleetworkSDK',
      fileName: (format) =>
        format === 'es' ? 'tracking-sdk-react.js' : 'tracking-sdk-react.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: externalMatcher,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: () => 'tracking-sdk-react.css',
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
