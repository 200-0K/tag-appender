import path, { resolve } from 'path'
import { glob } from 'glob'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          glob.sync(resolve(__dirname, "./src/main/**/*.js")).map(file => [
            path.relative("src/main", file.slice(0, file.length - path.extname(file).length)),
            file
          ])
        )
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
