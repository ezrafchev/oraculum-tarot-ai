# Segurança Técnica

## Modelo de ameaça

Os principais riscos são exposição de chave externa, injeção por entrada do usuário, dependência comprometida, persistência indevida e service worker obsoleto.

## Controles

- React renderiza perguntas como texto, sem HTML dinâmico.
- Zod limita e valida a pergunta.
- Nenhum `eval`, token embutido, analytics ou logger de chave.
- O provedor exige HTTPS.
- CSP bloqueia objetos, restringe origem de scripts e permite conexões HTTPS necessárias a modelos/provedores.
- Service worker atende somente requisições GET da mesma origem.
- Dependabot acompanha npm e GitHub Actions.
- CodeQL analisa JavaScript e TypeScript.
- `.gitignore` exclui ambientes, chaves, logs, caches e builds.

## Chaves do usuário

O padrão é `sessionStorage`. Persistência depende de consentimento explícito. A chave nunca participa de exportação, backup, audit log ou estado de leitura.

## Dependências

O lockfile é obrigatório no CI. Mudanças de dependência devem passar por `npm audit`, testes, typecheck e builds dos dois destinos.
