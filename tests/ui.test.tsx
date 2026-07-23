// @vitest-environment jsdom

import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import OraculumApp from "../src/OraculumApp";

describe("interface principal", () => {
  afterEach(() => {
    window.location.hash = "";
    localStorage.clear();
    sessionStorage.clear();
  });

  it("oferece navegação e chamada principal acessíveis", async () => {
    render(<OraculumApp />);
    expect(
      await screen.findByRole("heading", {
        name: /Clareza para o que ainda não tem nome/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Nova leitura/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Sem cadastro/i)).toBeInTheDocument();
  });

  it("abre o fluxo de nova leitura", async () => {
    const user = userEvent.setup();
    render(<OraculumApp />);
    await user.click(
      await screen.findByRole("button", { name: /Iniciar uma leitura/i }),
    );
    expect(
      await screen.findByRole("heading", {
        name: /Qual questão pede clareza/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Sua pergunta/i)).toHaveAttribute(
      "maxlength",
      "500",
    );
  });
});
