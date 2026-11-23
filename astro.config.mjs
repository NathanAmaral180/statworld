// Configuração do Astro (o "motor" que monta o site).
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Endereço do site (usado no mapa do site para o Google). Troque quando tiver o domínio definitivo.
  site: 'https://statworld.nathanjulho180.workers.dev',
  integrations: [
    // Mapa do site (sitemap-index.xml) para buscadores. Páginas de teste (Estados Unidos) ficam de fora.
    sitemap({ filter: (pagina) => !pagina.includes('/estados-unidos/') }),
  ],
});
