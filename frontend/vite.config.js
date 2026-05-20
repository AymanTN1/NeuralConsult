import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three")) {
              return "three-bundle";
            }
            if (id.includes("recharts")) {
              return "recharts-bundle";
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
            if (id.includes("bootstrap")) {
              return "bootstrap-bundle";
            }
            return "vendor";
          }
        }
      }
    }
  }
});
