// Configuração do Astro (o "motor" que monta o site).
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Endereço do site (usado no mapa do site para o Google). Troque quando tiver o domínio definitivo.
  site: 'https://statworld.nathanjulho180.workers.dev',
  integrations: [
    // Mapa do site (sitemap-index.xml) para buscadores.
    // O painel do administrador (/admin) fica fora do mapa do site.
    sitemap({ filter: (pagina) => !pagina.includes('/admin') }),
  ],
});
