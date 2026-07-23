# Motor de Tarô

## Baralho

O baralho contém 22 Arcanos Maiores e quatro naipes de 14 cartas. Cada carta possui identidade, número, arcano, naipe quando aplicável, elemento, astrologia, palavras-chave, cinco domínios de significado, conselho, alerta, luz, sombra, descrição visual, relações, categorias e polaridade.

## Sorteio

1. O baralho completo é copiado.
2. Fisher–Yates percorre o array de trás para frente.
3. Cada índice usa `crypto.getRandomValues()`.
4. Rejection sampling evita viés de módulo.
5. Orientações são geradas separadamente.
6. Ordem, posição, horário, algoritmo e versão entram no registro.
7. SHA-256 é calculado antes de a interpretação começar.

`Math.random()` não participa do sorteio.

## Interpretação

O motor seleciona o domínio da consulta, aplica a orientação, cruza cartas vizinhas, mede Arcanos Maiores, naipes, elementos, números e polaridades e produz:

1. resposta direta;
2. visão geral;
3. posições;
4. combinações;
5. pontos favoráveis;
6. bloqueios;
7. conselho;
8. tendência simbólica;
9. confiança interpretativa;
10. síntese.

## Sim ou Não

A classificação combina polaridade, orientação, peso da posição e força de Arcano Maior. O resultado percorre sete faixas, de “Sim” a “Não”, sempre acompanhado de justificativa e recomendação.
