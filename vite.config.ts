import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
let revision = 'unknown';
try { revision = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {encoding:'utf8',windowsHide:true}).trim() + (execFileSync('git', ['status','--porcelain'], {encoding:'utf8',windowsHide:true}).trim() ? '-modified' : ''); } catch { /* Source archives may have no Git metadata. */ }
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __GAME_BUILD__: JSON.stringify({version,revision,builtAt:new Date().toISOString()}) },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/]react(?:-dom|-router|-router-dom)?[\\/]/ },
            { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/ },
            { name: 'game-data', test: /src[\\/]data[\\/]gameSeedData\.ts$/ },
          ],
        },
      },
    },
  },
})
