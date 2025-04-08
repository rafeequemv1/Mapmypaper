
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Conditionally import componentTagger to handle potential version mismatches
let componentTagger;
try {
  // Dynamically import the tagger to avoid build errors
  componentTagger = require("lovable-tagger").componentTagger;
} catch (error) {
  console.warn("Could not load lovable-tagger, skipping component tagging:", error.message);
  componentTagger = null;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      plugins: mode === 'production' ? undefined : 
        // Only include the emotion plugin if we're in development mode
        (() => {
          try {
            // Try to require the plugin, if it fails, return an empty array
            require.resolve('@swc/plugin-emotion');
            return [['@swc/plugin-emotion', {}]];
          } catch (e) {
            console.warn('Could not load @swc/plugin-emotion, skipping:', e.message);
            return [];
          }
        })(),
    }),
    // Only use componentTagger in development mode and if it loaded successfully
    mode === 'development' && componentTagger ? componentTagger() : null,
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
