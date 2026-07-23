export type Arcana = "major" | "minor";
export type Suit = "Paus" | "Copas" | "Espadas" | "Ouros";
export type Orientation = "upright" | "reversed";
export type ReadingTheme =
  | "geral"
  | "afetivo"
  | "profissional"
  | "financeiro"
  | "espiritual"
  | "autoconhecimento";
export type InterpretationStyle =
  | "direto"
  | "tradicional"
  | "profundo"
  | "psicológico"
  | "espiritual"
  | "terapêutico"
  | "técnico"
  | "objetivo"
  | "detalhado";
export type ReadingDepth = "essencial" | "completo" | "imersivo";

export interface TarotMeanings {
  general: string;
  affective: string;
  professional: string;
  financial: string;
  spiritual: string;
}

export interface TarotCardData {
  id: string;
  name: string;
  number: number;
  arcana: Arcana;
  suit?: Suit;
  element: string;
  astrology: string;
  keywordsUpright: string[];
  keywordsReversed: string[];
  meanings: TarotMeanings;
  advice: string;
  warning: string;
  light: string;
  shadow: string;
  visualDescription: string;
  relations: string[];
  categories: string[];
  polarity: -2 | -1 | 0 | 1 | 2;
  symbol: string;
}

export interface SpreadMethod {
  id: string;
  name: string;
  description: string;
  positions: string[];
  category: string;
  duration: string;
  custom?: boolean;
  createdAt?: string;
}

export interface DrawnCard {
  card: TarotCardData;
  orientation: Orientation;
  order: number;
  position: string;
}

export interface AuditDraw {
  order: number;
  cardId: string;
  cardName: string;
  orientation: Orientation;
  position: string;
}

export interface AuditRecord {
  algorithm: string;
  engineVersion: string;
  timestamp: string;
  deckSize: number;
  count: number;
  draws: AuditDraw[];
  hash: string;
}

export interface ReadingConfig {
  question: string;
  theme: ReadingTheme;
  methodId: string;
  reversals: boolean;
  deck: "Rider-Waite-Smith" | "Marselha" | "Thoth";
  depth: ReadingDepth;
  style: InterpretationStyle;
  objectivity: number;
  useLocalAI: boolean;
}

export interface PositionInterpretation {
  position: string;
  cardName: string;
  orientation: Orientation;
  title: string;
  body: string;
  keywords: string[];
}

export interface InterpretationResult {
  directAnswer: string;
  overview: string;
  positions: PositionInterpretation[];
  combinations: string[];
  favorable: string[];
  blocks: string[];
  advice: string;
  symbolicTrend: string;
  confidence: number;
  synthesis: string;
  patterns: {
    majorCount: number;
    dominantSuit?: Suit;
    suitCounts: Partial<Record<Suit, number>>;
    repeatedNumbers: number[];
    elements: Record<string, number>;
  };
  yesNo?: {
    verdict:
      | "Sim"
      | "Provavelmente sim"
      | "Tendência favorável"
      | "Indefinido"
      | "Tendência desfavorável"
      | "Provavelmente não"
      | "Não";
    score: number;
    favorable: string[];
    contrary: string[];
    recommendation: string;
  };
  aiEnhancement?: string;
}

export interface ReadingRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  config: ReadingConfig;
  method: SpreadMethod;
  cards: DrawnCard[];
  audit: AuditRecord;
  interpretation: InterpretationResult;
  favorite: boolean;
}

export type ThemeName =
  | "night"
  | "royal"
  | "moon"
  | "minimal"
  | "contrast";

export interface AppSettings {
  theme: ThemeName;
  fontScale: number;
  reduceMotion: boolean;
  highContrast: boolean;
  reversals: boolean;
  objectivity: number;
}

export interface ProviderSettings {
  endpoint: string;
  model: string;
  apiKey: string;
  persist: boolean;
}
