# Estratégia de Inteligência Artificial

## Camada 1 — motor especialista

Obrigatória, instantânea, local e offline. Usa significados, orientação, posição, tema, naipes, elementos, polaridades, vizinhança, Arcanos Maiores, repetição numérica, bloqueios, abertura e encerramento.

## Camada 2 — WebLLM

Opcional. O modelo `SmolLM2-360M-Instruct-q4f16_1-MLC` exige WebGPU e aproximadamente 380 MB no primeiro carregamento. Ele roda em Worker, informa progresso, pode ser cancelado pela terminação do Worker e utiliza o cache do WebLLM.

Essa camada recebe somente a tiragem já sorteada e a síntese local. Ela refina a linguagem e não altera cartas ou auditoria.

## Camada 3 — provedor do usuário

Aceita endpoint HTTPS OpenAI-compatible, nome de modelo e chave própria. A chave fica em `sessionStorage` por padrão. A persistência em `localStorage` depende de consentimento explícito e pode ser apagada por um botão dedicado.

Chamadas diretas podem falhar quando o provedor não permite CORS. Nenhum proxy inseguro é usado para contornar essa proteção.

## Salvaguardas interpretativas

Prompts e textos da interface exigem linguagem simbólica. O sistema não apresenta pensamentos privados, diagnósticos ou acontecimentos futuros como fatos.
