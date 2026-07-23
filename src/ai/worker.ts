import { MLCEngine } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;

self.onmessage = async (
  event: MessageEvent<
    | { type: "load"; model: string }
    | { type: "generate"; id: string; prompt: string }
    | { type: "unload" }
  >,
) => {
  const message = event.data;
  try {
    if (message.type === "load") {
      engine = new MLCEngine({
        initProgressCallback: (progress) => {
          self.postMessage({
            type: "progress",
            progress: progress.progress,
            text: progress.text,
          });
        },
      });
      await engine.reload(message.model);
      self.postMessage({ type: "ready" });
      return;
    }

    if (message.type === "generate") {
      if (!engine) throw new Error("O modelo ainda não foi carregado.");
      const response = await engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Você é um intérprete técnico de Tarô em português do Brasil. Analise posição, orientação, dignidade simbólica, elementos, numerologia e relações entre as cartas. Diferencie atração, afeto, desejo, medo, bloqueio, intenção e ação. Não afirme pensamentos privados, diagnósticos ou acontecimentos futuros como fatos. Apresente hipótese simbólica, evidências nas cartas, tensões da combinação, síntese direta e conselho prático. Preserve integralmente as cartas sorteadas e a autonomia do usuário.",
          },
          { role: "user", content: message.prompt },
        ],
        temperature: 0.42,
        max_tokens: 720,
      });
      self.postMessage({
        type: "result",
        id: message.id,
        text: response.choices[0]?.message?.content ?? "",
      });
      return;
    }

    if (message.type === "unload" && engine) {
      await engine.unload();
      engine = null;
      self.postMessage({ type: "unloaded" });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      id: "id" in message ? message.id : undefined,
      message: error instanceof Error ? error.message : "Falha na IA local.",
    });
  }
};
