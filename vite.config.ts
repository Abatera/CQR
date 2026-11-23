import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { cqr } from './scripts/vite-plugin-cqr.ts';

export default defineConfig({
  // Relative paths, so the built site works from any folder, including a GitHub Pages project path.
  base: './',
  plugins: [svelte(), cqr()],
});
