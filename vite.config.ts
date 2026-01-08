
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Aumenta il limite di avviso per la dimensione dei chunk a 2000kb (2MB)
    // per gestire librerie grafiche e di generazione PDF.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Organizza le librerie più pesanti in chunk separati (Code Splitting)
        // per ottimizzare il caching del browser e silenziare gli avvisi di build.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('chart.js')) {
              return 'vendor-charts';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
