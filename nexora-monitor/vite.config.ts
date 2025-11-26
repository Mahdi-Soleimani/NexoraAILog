import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/NexoraAILog/', // نام دقیق مخزنی که در گیت‌هاب می‌سازید باید اینجا باشد
})