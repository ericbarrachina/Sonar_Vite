// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { existsSync } from 'fs'

const input = {
  main: resolve(__dirname, 'index.html'),
}

if (existsSync(resolve(__dirname, 'login.html'))) {
  input.login = resolve(__dirname, 'login.html')
}

if (existsSync(resolve(__dirname, 'registro.html'))) {
  input.registro = resolve(__dirname, 'registro.html')
}

export default defineConfig({
  build: {
    rollupOptions: {
      input,
    },
  },
})