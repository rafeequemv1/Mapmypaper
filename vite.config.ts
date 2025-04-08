
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
    react({
      plugins: mode === 'production' ? undefined : [['@swc/plugin-emotion', {}]],
    }),
    // Only use componentTagger in development mode
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure build is compatible with Netlify environment
    sourcemap: true,
    // Avoid any potential dependency conflicts during build
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.ts', '.tsx'],
    }
  }
}));
