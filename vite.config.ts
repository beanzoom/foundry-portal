import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { ConfigEnv } from "vite";

export default defineConfig(({ mode }: ConfigEnv) => ({
  esbuild: {
    // Strip console statements in production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    host: "::",
    port: 8082,
    hmr: mode === 'development' ? {
      host: 'localhost',
      protocol: 'ws',
      overlay: false,
      timeout: 120000
    } : false,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}));
