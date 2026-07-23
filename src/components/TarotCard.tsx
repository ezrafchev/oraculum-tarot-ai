"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { DrawnCard, TarotCardData } from "../types";

function numberLabel(card: TarotCardData): string {
  if (card.arcana === "major") {
    return card.number === 0
      ? "0"
      : ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"][card.number];
  }
  return String(card.number);
}

export function TarotCardFace({
  card,
  orientation = "upright",
  compact = false,
  onClick,
  favorite,
  onFavorite,
  label,
}: {
  card: TarotCardData;
  orientation?: DrawnCard["orientation"];
  compact?: boolean;
  onClick?: () => void;
  favorite?: boolean;
  onFavorite?: () => void;
  label?: string;
}) {
  const keywords =
    orientation === "upright"
      ? card.keywordsUpright
      : card.keywordsReversed;
  const content = (
    <motion.article
      className={`tarot-card ${compact ? "tarot-card--compact" : ""} ${
        orientation === "reversed" ? "tarot-card--reversed" : ""
      }`}
      whileHover={{ y: -6, rotateY: 2, rotateX: -2 }}
      transition={{ duration: 0.28 }}
      aria-label={`${card.name}${
        orientation === "reversed" ? ", invertida" : ""
      }`}
    >
      <div className="tarot-card__frame">
        <div className="tarot-card__topline">
          <span>{numberLabel(card)}</span>
          <span>{card.element}</span>
        </div>
        <div className="tarot-card__art" aria-hidden="true">
          <span className="tarot-card__orbit tarot-card__orbit--a" />
          <span className="tarot-card__orbit tarot-card__orbit--b" />
          <span className="tarot-card__symbol">{card.symbol}</span>
          <span className="tarot-card__star tarot-card__star--one">✦</span>
          <span className="tarot-card__star tarot-card__star--two">·</span>
          <span className="tarot-card__star tarot-card__star--three">✧</span>
        </div>
        <div className="tarot-card__copy">
          {label ? <span className="tarot-card__position">{label}</span> : null}
          <h3>{card.name}</h3>
          {!compact ? (
            <p>
              {keywords.slice(0, 2).join(" · ")}
              {orientation === "reversed" ? " · invertida" : ""}
            </p>
          ) : null}
        </div>
      </div>
    </motion.article>
  );

  return (
    <div className="tarot-card-wrap">
      {onClick ? (
        <button
          type="button"
          className="tarot-card-button"
          onClick={onClick}
          aria-label={`Abrir detalhes de ${card.name}`}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {onFavorite ? (
        <button
          type="button"
          className={`card-favorite ${favorite ? "is-active" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
          aria-label={
            favorite
              ? `Remover ${card.name} dos favoritos`
              : `Adicionar ${card.name} aos favoritos`
          }
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} />
        </button>
      ) : null}
    </div>
  );
}

export function TarotCardBack({
  index = 0,
  active = false,
}: {
  index?: number;
  active?: boolean;
}) {
  return (
    <motion.div
      className={`tarot-card tarot-card--back ${active ? "is-active" : ""}`}
      style={{ "--stack-index": index } as React.CSSProperties}
      animate={
        active
          ? {
              y: [0, -8, 0],
              rotate: [index * 0.8, index * 0.8 + 1, index * 0.8],
            }
          : undefined
      }
      transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.08 }}
      aria-hidden="true"
    >
      <div className="tarot-card__frame">
        <div className="tarot-card__back-art">
          <span className="back-moon">◐</span>
          <span className="back-ring back-ring--one" />
          <span className="back-ring back-ring--two" />
          <span className="back-star back-star--a">✦</span>
          <span className="back-star back-star--b">✧</span>
          <span className="back-star back-star--c">·</span>
        </div>
        <span className="tarot-card__back-name">ORACULUM</span>
      </div>
    </motion.div>
  );
}
