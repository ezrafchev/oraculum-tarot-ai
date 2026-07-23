import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import OraculumApp from "./OraculumApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento raiz não encontrado.");
}

createRoot(root).render(
  <StrictMode>
    <OraculumApp />
  </StrictMode>,
);
