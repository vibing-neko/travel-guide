import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	base: '/travel-guide/',
	plugins: [vue()],
})
