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

if (existsSync(resolve(__dirname, 'registro_usuario.html'))) {
  input.registro_usuario = resolve(__dirname, 'registro_usuario.html')
}

if (existsSync(resolve(__dirname, 'registro_artista.html'))) {
  input.registro_artista = resolve(__dirname, 'registro_artista.html')
}

if (existsSync(resolve(__dirname, 'home_artista.html'))) {
  input.home_artista = resolve(__dirname, 'home_artista.html')
}

if (existsSync(resolve(__dirname, 'artista/home_artista.html'))) {
  input.artista_home = resolve(__dirname, 'artista/home_artista.html')
}

if (existsSync(resolve(__dirname, 'artista/cancion_artista.html'))) {
  input.artista_cancion = resolve(__dirname, 'artista/cancion_artista.html')
}

if (existsSync(resolve(__dirname, 'artista/album_artista.html'))) {
  input.artista_album = resolve(__dirname, 'artista/album_artista.html')
}

if (existsSync(resolve(__dirname, 'admin/admin_site.html'))) {
  input.admin_site = resolve(__dirname, 'admin/admin_site.html')
}

export default defineConfig({
  build: {
    rollupOptions: {
      input,
    },
  },
})