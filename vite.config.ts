import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH lets the same build run at a domain root (Vercel, Netlify)
// or under a repository path on GitHub Pages, e.g. BASE_PATH=/tether/
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
