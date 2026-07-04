import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // ← dòng này bắt buộc phải có, nếu thiếu thì Tailwind không build gì cả
  ],
})