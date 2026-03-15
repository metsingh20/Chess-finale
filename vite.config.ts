import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Don't emit source maps in production (reduces bundle size & hides source)
    sourcemap: false,

    // Warn if any single chunk exceeds 500kb
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Split large vendor libraries into separate cached chunks
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // Animation library (heavy — ~200kb)
          "vendor-framer": ["framer-motion"],

          // Chess logic
          "vendor-chess": ["chess.js"],

          // UI library primitives
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
          ],

          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],

          // Charts
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});