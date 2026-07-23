import { secureUuid } from "./random";

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

type ProgressCallback = (progress: number, text: string) => void;
type PendingRequest = {
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
};

class LocalAIController {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private progressCallback: ProgressCallback | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;

  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof Worker !== "undefined" &&
      "gpu" in navigator
    );
  }

  load(onProgress: ProgressCallback): Promise<void> {
    if (!this.isSupported()) {
      return Promise.reject(
        new Error("Este navegador ou dispositivo não oferece WebGPU."),
      );
    }
    this.cancel();
    this.progressCallback = onProgress;
    this.worker = new Worker(new URL("../ai/worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (event) => {
      const message = event.data as {
        type: string;
        progress?: number;
        text?: string;
        id?: string;
        message?: string;
      };
      if (message.type === "progress") {
        this.progressCallback?.(
          Math.round((message.progress ?? 0) * 100),
          message.text ?? "Preparando modelo…",
        );
      } else if (message.type === "ready") {
        this.readyResolve?.();
        this.readyResolve = null;
        this.readyReject = null;
      } else if (message.type === "result" && message.id) {
        this.pending.get(message.id)?.resolve(message.text ?? "");
        this.pending.delete(message.id);
      } else if (message.type === "error") {
        const error = new Error(message.message ?? "Falha na IA local.");
        if (message.id) {
          this.pending.get(message.id)?.reject(error);
          this.pending.delete(message.id);
        } else {
          this.readyReject?.(error);
          this.readyResolve = null;
          this.readyReject = null;
        }
      }
    };
    this.worker.postMessage({ type: "load", model: MODEL_ID });
    return new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
  }

  generate(prompt: string): Promise<string> {
    if (!this.worker) {
      return Promise.reject(new Error("Carregue a IA local primeiro."));
    }
    const id = secureUuid();
    this.worker.postMessage({ type: "generate", id, prompt });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  cancel(): void {
    this.worker?.terminate();
    this.worker = null;
    const error = new Error("Carregamento cancelado.");
    this.readyReject?.(error);
    this.readyResolve = null;
    this.readyReject = null;
    this.pending.forEach((request) => request.reject(error));
    this.pending.clear();
  }
}

export const localAI = new LocalAIController();
export const LOCAL_AI_MODEL = {
  id: MODEL_ID,
  label: "Qwen 2.5 1.5B Instruct",
  approximateSize: "aprox. 1,2 GB",
};
