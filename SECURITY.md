# Política de Segurança

## Versões suportadas

A versão estável mais recente recebe correções de segurança.

## Relato responsável

Use a opção **Report a vulnerability** na aba Security do repositório. Não abra uma issue pública com chaves, dados pessoais, prova de conceito destrutiva ou detalhes que facilitem exploração antes da correção.

Inclua:

- componente e versão afetados;
- impacto observado;
- passos mínimos para reproduzir;
- navegador e sistema;
- sugestão de mitigação, quando houver.

## Segredos

O projeto não possui chave embutida. Nunca envie tokens em issues, commits, pull requests, capturas ou arquivos de configuração versionados. Caso um segredo seja publicado acidentalmente, revogue-o no provedor antes de qualquer outra medida.

## Escopo

Falhas no aplicativo, service worker, armazenamento local, build e workflows pertencem ao escopo. Problemas próprios de navegadores, modelos públicos ou provedores externos devem ser confirmados no componente de origem, sem expor credenciais.
