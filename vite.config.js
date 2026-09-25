import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// package.json declara "type": "module", asi que no hay __dirname.
const raiz = fileURLToPath(new URL('.', import.meta.url))

/// Las paginas legales son entradas HTML propias para que existan como URL
/// reales (y sean rastreables) sin depender de un router en cliente.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(raiz, 'index.html'),
        privacidad: resolve(raiz, 'privacidad/index.html'),
        eliminarCuenta: resolve(raiz, 'eliminar-cuenta/index.html'),
      },
    },
  },
})
