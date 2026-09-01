import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three")) {
              return "three-bundle";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "recharts-bundle";
            }
            if (id.includes("bootstrap")) {
              return "bootstrap-bundle";
            }
            if (id.includes("firebase")) {
              return "firebase-bundle";
            }
            if (id.includes("tesseract")) {
              return "tesseract-bundle";
            }
            if (id.includes("gsap")) {
              return "gsap-bundle";
            }
            return "vendor";
          }
        }
      }
    }
  }
});
