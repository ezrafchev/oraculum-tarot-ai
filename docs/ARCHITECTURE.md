# Arquitetura

## Objetivos

A arquitetura prioriza funcionamento gratuito, hospedagem estática, privacidade, auditabilidade, offline e degradação segura.

## Camadas

### Interface

`src/OraculumApp.tsx` concentra navegação por hash, telas, estados e fluxos. `src/oraculum.css` fornece o sistema visual responsivo. Componentes de carta ficam isolados em `src/components`.

### Domínio

`src/data/tarot.ts` produz o baralho imutável de 78 cartas a partir de dados completos para Arcanos Maiores e matrizes semânticas de naipe e número para Arcanos Menores. `src/data/spreads.ts` define os métodos.

### Sorteio e interpretação

`src/lib/random.ts` controla entropia, embaralhamento, orientação e prova. `src/lib/engine.ts` recebe somente cartas já registradas e monta as dez seções interpretativas.

### Persistência

`src/lib/storage.ts` usa IndexedDB por meio de `idb`, com fallback local apenas em ambientes sem IndexedDB. Nenhum dado obrigatório depende de servidor.

### IA opcional

`src/ai/worker.ts` isola WebLLM em Worker. `src/lib/local-ai.ts` controla progresso, geração e cancelamento. O provedor externo é chamado diretamente somente por ação explícita.

## Destinos de build

- `npm run build`: Vinext/Sites, com artefato Worker.
- `npm run build:pages`: Vite estático, base `/oraculum-tarot-ai/`.

O HashRouter manual evita 404 em atualizações de rota no GitHub Pages.
