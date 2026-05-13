import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Sourcemap em prod: facilita debug de TDZ/circular import minificado.
    // Os .map files nao sao baixados pelo browser por default — so quando
    // o DevTools abre — entao nao impacta load time pros usuarios.
    sourcemap: true,
    rollupOptions: {
      output: {
        // IMPORTANTE: so colocamos em manualChunks libs usadas no first paint
        // (Landing/Auth/MainMenu). Forcar lib pesada num vendor-chunk
        // separado faz o Vite injetar <link rel="modulepreload"> dela na
        // index.html, mesmo que ela so seja necessaria numa rota lazy.
        // Era o caso de jspdf/html2canvas/recharts/framer-motion antes —
        // ~1.2MB baixado a toa no primeiro acesso a landing.
        //
        // Agora cada lib pesada eh embutida no chunk lazy que a importa
        // (Dashboard puxa jspdf, AdminDashboard puxa recharts, etc) e so
        // baixa quando o user navega pra essa rota.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));
