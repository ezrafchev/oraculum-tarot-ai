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
              "Você refina leituras simbólicas de Tarô em português do Brasil. Não afirme pensamentos privados, diagnósticos ou acontecimentos futuros como fatos. Preserve a autonomia do usuário e use linguagem prudente.",
          },
          { role: "user", content: message.prompt },
        ],
        temperature: 0.5,
        max_tokens: 420,
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
