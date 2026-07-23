import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../src/oraculum.css", import.meta.url),
  "utf8",
);
const manifest = JSON.parse(
  readFileSync(
    new URL("../public/manifest.webmanifest", import.meta.url),
    "utf8",
  ),
) as { start_url: string; display: string };
const pagesConfig = readFileSync(
  new URL("../vite.pages.config.ts", import.meta.url),
  "utf8",
);

describe("qualidade estática", () => {
  it("inclui breakpoints críticos e preferência por movimento reduzido", () => {
    expect(css).toContain("@media (max-width: 500px)");
    expect(css).toContain("@media (max-width: 980px)");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(":focus-visible");
  });

  it("configura PWA e navegação por hash", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toContain("#/home");
  });

  it("usa a base correta do GitHub Pages", () => {
    expect(pagesConfig).toContain('base: "/oraculum-tarot-ai/"');
  });
});
