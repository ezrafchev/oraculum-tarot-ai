import type {
  DrawnCard,
  InterpretationResult,
  ReadingConfig,
  SpreadMethod,
  Suit,
} from "../types";

const themeKey = {
  geral: "general",
  afetivo: "affective",
  profissional: "professional",
  financeiro: "financial",
  espiritual: "spiritual",
  autoconhecimento: "spiritual",
} as const;

const connectiveTone: Record<ReadingConfig["style"], string> = {
  direto: "Em termos diretos",
  tradicional: "Na leitura tradicional",
  profundo: "Em uma leitura profunda",
  psicológico: "Em linguagem psicológica e simbólica",
  espiritual: "No plano espiritual e simbólico",
  terapêutico: "Como convite de reflexão",
  técnico: "Pela estrutura técnica da tiragem",
  objetivo: "De forma objetiva",
  detalhado: "Considerando os detalhes do conjunto",
};

function orientationText(card: DrawnCard): string {
  if (card.orientation === "upright") {
    return "Em posição direta, o símbolo tende a se manifestar com mais fluidez e disponibilidade.";
  }
  return "Na inversão, o tema pode aparecer como bloqueio, excesso, atraso ou processo internalizado.";
}

function keywordList(card: DrawnCard): string[] {
  return card.orientation === "upright"
    ? card.card.keywordsUpright
    : card.card.keywordsReversed;
}

function countBy<T extends string>(values: T[]): Partial<Record<T, number>> {
  return values.reduce<Partial<Record<T, number>>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function confidenceFor(cards: DrawnCard[], contradictions: number): number {
  const base = 62 + Math.min(cards.length * 3, 18);
  const majors = cards.filter((item) => item.card.arcana === "major").length;
  return Math.max(42, Math.min(92, base + majors * 2 - contradictions * 6));
}

function verdictFromScore(score: number): NonNullable<
  InterpretationResult["yesNo"]
>["verdict"] {
  if (score >= 8) return "Sim";
  if (score >= 5) return "Provavelmente sim";
  if (score >= 2) return "Tendência favorável";
  if (score > -2) return "Indefinido";
  if (score > -5) return "Tendência desfavorável";
  if (score > -8) return "Provavelmente não";
  return "Não";
}

function buildYesNo(cards: DrawnCard[]): NonNullable<
  InterpretationResult["yesNo"]
> {
  const weighted = cards.map((drawn, index) => {
    const orientationFactor = drawn.orientation === "upright" ? 1 : -0.7;
    const positionWeight = index === 0 ? 2 : 1;
    const arcanaWeight = drawn.card.arcana === "major" ? 1.35 : 1;
    return drawn.card.polarity * orientationFactor * positionWeight * arcanaWeight;
  });
  const score = Number(weighted.reduce((sum, value) => sum + value, 0).toFixed(1));
  const favorable = cards
    .filter(
      (card) =>
        card.card.polarity > 0 && card.orientation === "upright",
    )
    .map((card) => `${card.card.name}: ${card.card.light}`);
  const contrary = cards
    .filter(
      (card) =>
        card.card.polarity < 0 || card.orientation === "reversed",
    )
    .map((card) => `${card.card.name}: ${card.card.shadow}`);

  return {
    verdict: verdictFromScore(score),
    score,
    favorable:
      favorable.length > 0
        ? favorable
        : ["Não há um apoio inequívoco; o cenário depende da sua ação."],
    contrary:
      contrary.length > 0
        ? contrary
        : ["Não há bloqueio dominante no conjunto."],
    recommendation:
      Math.abs(score) < 2
        ? "Reformule a pergunta com prazo e critério verificável antes de decidir."
        : "Use a tendência como reflexão e confirme a decisão com fatos observáveis.",
  };
}

export function interpretReading(
  cards: DrawnCard[],
  method: SpreadMethod,
  config: ReadingConfig,
): InterpretationResult {
  if (cards.length === 0) {
    throw new Error("A interpretação exige ao menos uma carta sorteada.");
  }

  const suitValues = cards
    .map((drawn) => drawn.card.suit)
    .filter((suit): suit is Suit => Boolean(suit));
  const suitCounts = countBy(suitValues);
  const suitEntries = Object.entries(suitCounts) as [Suit, number][];
  const dominantSuit = suitEntries.sort((a, b) => b[1] - a[1])[0]?.[0];
  const elements = cards.reduce<Record<string, number>>((accumulator, drawn) => {
    accumulator[drawn.card.element] =
      (accumulator[drawn.card.element] ?? 0) + 1;
    return accumulator;
  }, {});
  const numberCounts = countBy(cards.map((drawn) => String(drawn.card.number)));
  const repeatedNumbers = Object.entries(numberCounts)
    .filter(([, count]) => (count ?? 0) > 1)
    .map(([number]) => Number(number));
  const majorCount = cards.filter(
    (drawn) => drawn.card.arcana === "major",
  ).length;
  const positive = cards.filter(
    (drawn) => drawn.card.polarity > 0 && drawn.orientation === "upright",
  );
  const blocked = cards.filter(
    (drawn) =>
      drawn.orientation === "reversed" ||
      drawn.card.categories.includes("bloqueio"),
  );
  const contradictions = cards.filter(
    (drawn) => drawn.card.polarity < 0,
  ).length * positive.length > 0
    ? 1
    : 0;

  const positions = cards.map((drawn, index) => {
    const selectedMeaning =
      drawn.card.meanings[themeKey[config.theme]] ?? drawn.card.meanings.general;
    const neighbor = cards[index + 1] ?? cards[index - 1];
    const relation = neighbor
      ? ` Em relação a ${neighbor.card.name}, a carta ${
          drawn.card.element === neighbor.card.element
            ? "ganha continuidade pelo elemento compartilhado"
            : "introduz um contraste que pede integração"
        }.`
      : "";
    return {
      position: drawn.position,
      cardName: drawn.card.name,
      orientation: drawn.orientation,
      title: `${drawn.card.name}${
        drawn.orientation === "reversed" ? " · invertida" : ""
      }`,
      body: `${selectedMeaning} ${orientationText(drawn)}${relation}`,
      keywords: keywordList(drawn),
    };
  });

  const combinations: string[] = [];
  for (let index = 0; index < cards.length - 1; index += 1) {
    const current = cards[index];
    const next = cards[index + 1];
    if (current.card.element === next.card.element) {
      combinations.push(
        `${current.card.name} + ${next.card.name}: o elemento ${current.card.element} se repete e intensifica o tema.`,
      );
    } else if (current.card.polarity * next.card.polarity < 0) {
      combinations.push(
        `${current.card.name} + ${next.card.name}: forças contraditórias indicam ambivalência e necessidade de critério.`,
      );
    } else {
      combinations.push(
        `${current.card.name} + ${next.card.name}: a sequência conecta ${keywordList(current)[0]} a ${keywordList(next)[0]}.`,
      );
    }
  }
  if (majorCount >= Math.ceil(cards.length / 2)) {
    combinations.push(
      `Predominância de Arcanos Maiores (${majorCount}/${cards.length}): o tema simbolicamente toca decisões estruturais, não apenas eventos cotidianos.`,
    );
  }
  if (dominantSuit) {
    combinations.push(
      `Predominância de ${dominantSuit}: esse campo organiza o ritmo geral da leitura.`,
    );
  }
  if (repeatedNumbers.length > 0) {
    combinations.push(
      `Repetição numérica (${repeatedNumbers.join(", ")}): o mesmo estágio de desenvolvimento aparece em mais de uma área.`,
    );
  }

  const first = cards[0];
  const last = cards[cards.length - 1];
  const directAnswer =
    method.id === "yes-no"
      ? `${buildYesNo(cards).verdict}. A classificação vem do balanço de polaridade, orientação, força simbólica e posições — não de uma carta isolada.`
      : `${connectiveTone[config.style]}, a tiragem sugere uma passagem de ${keywordList(first)[0]} para ${keywordList(last)[0]}.`;
  const confidence = confidenceFor(cards, contradictions);

  const result: InterpretationResult = {
    directAnswer,
    overview: `A pergunta “${config.question}” foi lida no tema ${config.theme}, pelo método ${method.name}. ${
      dominantSuit
        ? `${dominantSuit} predomina entre os Arcanos Menores`
        : "Não há um naipe dominante"
    }, e ${majorCount} de ${cards.length} cartas são Arcanos Maiores. A leitura é simbólica e não confirma pensamentos privados ou acontecimentos como fatos.`,
    positions,
    combinations:
      combinations.length > 0
        ? combinations
        : ["Uma carta concentra o tema sem combinações adjacentes."],
    favorable:
      positive.length > 0
        ? positive.map(
            (drawn) => `${drawn.card.name}: ${drawn.card.light}.`,
          )
        : ["O principal recurso está em observar antes de intensificar a ação."],
    blocks:
      blocked.length > 0
        ? blocked.map(
            (drawn) => `${drawn.card.name}: ${drawn.card.warning}`,
          )
        : ["Nenhum bloqueio domina o conjunto; preserve clareza e proporção."],
    advice: last.card.advice,
    symbolicTrend: `A tendência indicada é ${
      last.orientation === "upright"
        ? `de desenvolvimento por ${last.card.keywordsUpright[0]}`
        : `de revisão do padrão de ${last.card.keywordsReversed[0]}`
    }. Ela descreve uma direção simbólica, não uma previsão garantida.`,
    confidence,
    synthesis: `${first.card.name} abre o campo com ${keywordList(first)[0]}; ${last.card.name} encerra pedindo ${last.card.advice.toLowerCase()} A síntese é transformar o símbolo em uma atitude concreta, proporcional e verificável.`,
    patterns: {
      majorCount,
      dominantSuit,
      suitCounts,
      repeatedNumbers,
      elements,
    },
  };

  if (method.id === "yes-no") {
    result.yesNo = buildYesNo(cards);
  }

  return result;
}
