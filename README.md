# ORACULUM AI

Aplicativo completo e gratuito de Tarô com sorteio criptográfico auditável, motor especialista local, 78 arcanos, múltiplos métodos, histórico privado e experiência premium instalável.

[Abrir demonstração no GitHub Pages](https://ezrafchev.github.io/oraculum-tarot-ai/) · [Relatar uma falha com segurança](SECURITY.md)

## Visão geral

ORACULUM AI foi desenhado para oferecer interpretações simbólicas profundas sem depender de uma API paga. O sorteio usa a Web Crypto API, e a interpretação principal acontece no dispositivo por meio de regras e dados próprios. Nenhuma IA escolhe cartas.

O aplicativo não apresenta adivinhação como certeza objetiva. Pensamentos privados, diagnósticos e acontecimentos futuros não são tratados como fatos verificáveis.

## Recursos

- Baralho completo com 22 Arcanos Maiores e 56 Arcanos Menores.
- Significados diretos e invertidos para os temas geral, afetivo, profissional, financeiro e espiritual.
- Mais de vinte métodos, incluindo Cruz Celta, Ferradura e Mandala Astrológica.
- Construtor de tiragens personalizadas com edição, duplicação e exportação.
- Fisher–Yates com `crypto.getRandomValues()` e rejection sampling.
- Prova SHA-256, registro de ordem, orientação, horário e versão do motor.
- Motor especialista que analisa posição, vizinhança, elementos, naipes, polaridade, repetições e predominâncias.
- Modo Sim ou Não graduado, com fatores favoráveis e contrários.
- IA WebLLM opcional no navegador, carregada somente sob demanda.
- Provedor OpenAI-compatible opcional com chave do próprio usuário.
- IndexedDB para leituras, métodos, favoritos e configurações.
- Exportação em Markdown, TXT e JSON, impressão em PDF e backup completo.
- PWA com cache, instalação e funcionamento offline do núcleo.
- Cinco temas, escala tipográfica, alto contraste e movimento reduzido.
- Interface responsiva, navegação por teclado e cuidados WCAG 2.2 AA.

## Arquitetura

```text
Pergunta e configuração
        │
        ▼
Embaralhamento criptográfico ──► Auditoria + SHA-256
        │
        ▼
Motor especialista local
        │
        ├──► Resultado completo e offline
        ├──► WebLLM opcional no navegador
        └──► Provedor opcional configurado pelo usuário
```

A mesma base React atende dois destinos:

- **Sites:** Vinext gera um Worker compatível com Cloudflare.
- **GitHub Pages:** Vite produz uma aplicação estática em `dist-pages` com base `/oraculum-tarot-ai/`.

Detalhes adicionais estão em [Arquitetura](docs/ARCHITECTURE.md), [Motor de Tarô](docs/TAROT_ENGINE.md) e [Inteligência artificial](docs/AI.md).

## Tecnologias

React 19, TypeScript, Vite, Vinext, Framer Motion, Lucide React, Zod, IndexedDB por `idb`, WebLLM, Vitest, Testing Library, ESLint, Web Crypto API, Service Worker e GitHub Actions.

## Instalação

Requisitos: Node.js 22.13 ou superior e npm 11 ou superior.

```bash
git clone https://github.com/ezrafchev/oraculum-tarot-ai.git
cd oraculum-tarot-ai
npm ci
```

## Desenvolvimento

Ambiente Sites/Vinext:

```bash
npm run dev
```

Compilação estática do GitHub Pages:

```bash
npm run build:pages
npm run preview:pages
```

## Qualidade

```bash
npm run lint
npm run typecheck
npm run test
npm run build:pages
npm run build
```

A suíte verifica integridade das 78 cartas, ausência de duplicidades, estrutura dos métodos, embaralhamento sem reposição, inversões, hash, interpretação, modo Sim ou Não, persistência, backup, exportação, navegação básica, PWA, acessibilidade estrutural e configuração responsiva.

## Deploy

Todo push na branch `main` executa lint, checagem de tipos, testes e build antes da publicação. O workflow usa permissões mínimas do GitHub Pages.

Consulte [Deploy](docs/DEPLOYMENT.md) para a configuração completa.

## Privacidade

O núcleo não exige cadastro, analytics ou chave. Leituras e preferências ficam no IndexedDB. A IA local baixa arquivos públicos do modelo e os mantém em cache. Quando um provedor externo é usado, a solicitação é enviada diretamente a ele sob a política escolhida pelo usuário.

Leia [PRIVACY.md](PRIVACY.md).

## Segurança

- Nenhuma chave é incluída no código, build ou repositório.
- A chave externa fica apenas na sessão, salvo consentimento explícito para armazenamento local.
- Entradas são limitadas, validadas e renderizadas como texto.
- A aplicação não usa `eval`.
- CSP, Dependabot e CodeQL fazem parte do projeto.

Consulte [SECURITY.md](SECURITY.md) e [Segurança técnica](docs/SECURITY.md).

## Limitações reais

- O WebLLM exige navegador compatível com WebGPU, memória disponível e um download aproximado de 380 MB.
- O primeiro carregamento do modelo pode demorar; o motor especialista continua funcionando sem ele.
- Provedores externos podem bloquear chamadas do navegador por CORS.
- Dados locais não sincronizam automaticamente entre dispositivos.
- A auditoria prova a integridade do registro produzido pelo aplicativo, mas não transforma interpretações simbólicas em fatos.
- Ilustrações são uma linguagem gráfica original e abstrata; não reproduzem baralhos proprietários.

## Autoria

**Esdra Felipe Silva de Oliveira**  
GitHub: [@ezrafchev](https://github.com/ezrafchev)

## Licença

[MIT](LICENSE)
