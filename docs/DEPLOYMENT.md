# Deploy

## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` executa em pushes para `main` e por acionamento manual.

Etapas:

1. checkout;
2. Node.js 24 com cache npm;
3. `npm ci`;
4. lint;
5. typecheck;
6. testes;
7. `npm run build:pages`;
8. upload de `dist-pages`;
9. deploy com o ambiente `github-pages`.

O repositório precisa configurar Pages com a origem **GitHub Actions**. A URL esperada é `https://ezrafchev.github.io/oraculum-tarot-ai/`.

## Sites

O build padrão preserva Vinext e produz `dist/server/index.js` com um Worker ESM. O manifesto `.openai/hosting.json` identifica o projeto hospedado.

## Caminhos

A compilação estática usa `base: "/oraculum-tarot-ai/"`. Manifesto e service worker usam caminhos relativos ao escopo. A navegação interna usa hash para não exigir regras de reescrita.
