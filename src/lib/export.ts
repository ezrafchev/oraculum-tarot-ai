import type { ReadingRecord } from "../types";

export function readingAsMarkdown(reading: ReadingRecord): string {
  const cardLines = reading.cards
    .map(
      (drawn) =>
        `- **${drawn.position}:** ${drawn.card.name}${
          drawn.orientation === "reversed" ? " (invertida)" : ""
        }`,
    )
    .join("\n");
  const positions = reading.interpretation.positions
    .map(
      (position) =>
        `### ${position.position} — ${position.title}\n\n${position.body}`,
    )
    .join("\n\n");

  return `# ${reading.title}

**Data:** ${new Date(reading.createdAt).toLocaleString("pt-BR")}
**Pergunta:** ${reading.config.question}
**Método:** ${reading.method.name}

## Cartas

${cardLines}

## Resposta direta

${reading.interpretation.directAnswer}

## Visão geral

${reading.interpretation.overview}

${positions}

## Combinações

${reading.interpretation.combinations.map((item) => `- ${item}`).join("\n")}

## Conselho

${reading.interpretation.advice}

## Tendência simbólica

${reading.interpretation.symbolicTrend}

## Auditoria

- Algoritmo: ${reading.audit.algorithm}
- Hash SHA-256: \`${reading.audit.hash}\`
- Motor: ${reading.audit.engineVersion}

> Esta leitura é simbólica, voltada à reflexão. Ela não confirma pensamentos privados, diagnósticos ou acontecimentos futuros como fatos.
`;
}

export function readingAsText(reading: ReadingRecord): string {
  return readingAsMarkdown(reading)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^>\s?/gm, "");
}

export function downloadText(
  filename: string,
  content: string,
  type = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
