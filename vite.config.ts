
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Define environment variables that will be available on the client
  define: {
    // Ensure environment variables are exposed to the client
    'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_API_KEY || '')
  }
}));
