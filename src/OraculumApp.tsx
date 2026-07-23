"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Copy,
  Cpu,
  Database,
  Download,
  Edit3,
  ExternalLink,
  FileJson,
  FileText,
  Heart,
  History,
  Home,
  Info,
  KeyRound,
  Layers3,
  LibraryBig,
  LockKeyhole,
  Menu,
  MoonStar,
  MoreHorizontal,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Star,
  Trash2,
  Upload,
  UserCircle2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { z } from "zod";
import { TarotCardBack, TarotCardFace } from "./components/TarotCard";
import { SPREAD_METHODS } from "./data/spreads";
import { TAROT_DECK } from "./data/tarot";
import { interpretReading } from "./lib/engine";
import {
  downloadText,
  readingAsMarkdown,
  readingAsText,
} from "./lib/export";
import { LOCAL_AI_MODEL, localAI } from "./lib/local-ai";
import { drawCards, secureUuid } from "./lib/random";
import {
  clearAllData,
  defaultSettings,
  deleteMethod,
  deleteReading,
  exportBackup,
  importBackup,
  listMethods,
  listReadings,
  loadFavoriteCards,
  loadSettings,
  saveFavoriteCards,
  saveMethod,
  saveReading,
  saveSettings,
} from "./lib/storage";
import type {
  AppSettings,
  InterpretationStyle,
  ProviderSettings,
  ReadingConfig,
  ReadingDepth,
  ReadingRecord,
  ReadingTheme,
  SpreadMethod,
  TarotCardData,
  ThemeName,
} from "./types";
import "./oraculum.css";

type AccountUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

type CloudSnapshot = {
  readings?: ReadingRecord[];
  methods?: SpreadMethod[];
  settings?: AppSettings;
  favoriteCards?: string[];
};

type Route =
  | "home"
  | "new"
  | "table"
  | "library"
  | "history"
  | "favorites"
  | "methods"
  | "local-ai"
  | "settings"
  | "about"
  | "privacy"
  | "terms"
  | "help";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const questionSchema = z
  .string()
  .trim()
  .min(3, "Escreva uma pergunta com pelo menos 3 caracteres.")
  .max(500, "A pergunta pode ter no máximo 500 caracteres.");

const initialConfig: ReadingConfig = {
  question: "",
  theme: "geral",
  methodId: "situation-obstacle-advice",
  reversals: true,
  deck: "Rider-Waite-Smith",
  depth: "completo",
  style: "profundo",
  objectivity: 65,
  useLocalAI: false,
};

const primaryNav = [
  { route: "home" as const, label: "Início", icon: Home },
  { route: "new" as const, label: "Nova leitura", icon: Sparkles },
  { route: "library" as const, label: "Biblioteca", icon: LibraryBig },
  { route: "history" as const, label: "Histórico", icon: History },
  { route: "favorites" as const, label: "Favoritos", icon: Star },
  { route: "methods" as const, label: "Meus métodos", icon: Layers3 },
];

const utilityNav = [
  { route: "local-ai" as const, label: "IA local", icon: Cpu },
  { route: "settings" as const, label: "Configurações", icon: Settings },
  { route: "help" as const, label: "Ajuda", icon: CircleHelp },
];

const themeLabels: Record<ThemeName, string> = {
  night: "Oráculo Noturno",
  royal: "Dourado Real",
  moon: "Lua Clara",
  minimal: "Minimalista",
  contrast: "Alto Contraste",
};

const themeOptions: { value: ReadingTheme; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "afetivo", label: "Afetivo" },
  { value: "profissional", label: "Profissional" },
  { value: "financeiro", label: "Financeiro" },
  { value: "espiritual", label: "Espiritual" },
  { value: "autoconhecimento", label: "Autoconhecimento" },
];

const styleOptions: InterpretationStyle[] = [
  "direto",
  "tradicional",
  "profundo",
  "psicológico",
  "espiritual",
  "terapêutico",
  "técnico",
  "objetivo",
  "detalhado",
];

const depthOptions: { value: ReadingDepth; label: string; copy: string }[] = [
  { value: "essencial", label: "Essencial", copy: "Síntese clara" },
  { value: "completo", label: "Completo", copy: "Padrões e posições" },
  { value: "imersivo", label: "Imersivo", copy: "Análise máxima" },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string, full = false): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: full ? "long" : "short",
    year: full ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function PageHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </header>
  );
}

function EmptyState({
  icon,
  title,
  copy,
  action,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </div>
  );
}

export default function OraculumApp({
  initialUser = null,
  hosted = false,
}: {
  initialUser?: AccountUser | null;
  hosted?: boolean;
}) {
  const [route, setRoute] = useState<Route>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [history, setHistory] = useState<ReadingRecord[]>([]);
  const [customMethods, setCustomMethods] = useState<SpreadMethod[]>([]);
  const [favoriteCards, setFavoriteCards] = useState<string[]>([]);
  const [settingsState, setSettingsState] =
    useState<AppSettings>(defaultSettings);
  const [config, setConfig] = useState<ReadingConfig>(initialConfig);
  const [activeReading, setActiveReading] = useState<ReadingRecord | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCardData | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState("todos");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("todos");
  const [auditOpen, setAuditOpen] = useState(false);
  const [methodName, setMethodName] = useState("");
  const [methodPositions, setMethodPositions] = useState<string[]>([
    "Situação",
    "Ponto de atenção",
    "Conselho",
  ]);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [aiState, setAiState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressText, setAiProgressText] = useState("");
  const [aiError, setAiError] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [provider, setProvider] = useState<ProviderSettings>({
    endpoint: "https://api.openai.com/v1",
    model: "",
    apiKey: "",
    persist: false,
  });
  const [showKey, setShowKey] = useState(false);
  const [providerBusy, setProviderBusy] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [online, setOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [syncState, setSyncState] = useState<
    "local" | "loading" | "synced" | "saving" | "error"
  >(initialUser ? "loading" : "local");

  const allMethods = useMemo(
    () => [...SPREAD_METHODS, ...customMethods],
    [customMethods],
  );
  const activeMethod =
    allMethods.find((method) => method.id === config.methodId) ??
    SPREAD_METHODS[0];

  useEffect(() => {
    const validRoutes: Route[] = [
      "home",
      "new",
      "table",
      "library",
      "history",
      "favorites",
      "methods",
      "local-ai",
      "settings",
      "about",
      "privacy",
      "terms",
      "help",
    ];
    const readHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "") as Route;
      setRoute(validRoutes.includes(hash) ? hash : "home");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    if (!initialUser || !hosted) return;
    let cancelled = false;

    async function hydrateCloud() {
      try {
        const response = await fetch("/api/sync", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("sync");
        const payload = (await response.json()) as { data?: CloudSnapshot };
        if (cancelled) return;
        const cloud = payload.data;
        if (cloud) {
          await Promise.all([
            ...(cloud.readings ?? []).map(saveReading),
            ...(cloud.methods ?? []).map(saveMethod),
          ]);
          if (cloud.settings) await saveSettings(cloud.settings);
          if (cloud.favoriteCards) {
            await saveFavoriteCards(cloud.favoriteCards);
          }
          const [savedReadings, savedMethods, savedSettings, savedFavorites] =
            await Promise.all([
              listReadings(),
              listMethods(),
              loadSettings(),
              loadFavoriteCards(),
            ]);
          if (cancelled) return;
          setHistory(savedReadings);
          setCustomMethods(savedMethods);
          setSettingsState(savedSettings);
          setFavoriteCards(savedFavorites);
        }
        setSyncState("synced");
        setCloudReady(true);
      } catch {
        if (!cancelled) {
          setSyncState("error");
          setToast(
            "A nuvem está indisponível; seus dados locais continuam seguros.",
          );
        }
      }
    }

    void hydrateCloud();
    return () => {
      cancelled = true;
    };
  }, [hosted, initialUser]);

  useEffect(() => {
    if (!initialUser || !hosted || !cloudReady) return;
    const timer = window.setTimeout(async () => {
      setSyncState("saving");
      try {
        const response = await fetch("/api/sync", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            readings: history,
            methods: customMethods,
            settings: settingsState,
            favoriteCards,
          }),
        });
        if (!response.ok) throw new Error("sync");
        setSyncState("synced");
      } catch {
        setSyncState("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    cloudReady,
    customMethods,
    favoriteCards,
    history,
    hosted,
    initialUser,
    settingsState,
  ]);

  useEffect(() => {
    Promise.all([
      listReadings(),
      listMethods(),
      loadSettings(),
      loadFavoriteCards(),
    ])
      .then(([savedReadings, savedMethods, savedSettings, savedFavorites]) => {
        setHistory(savedReadings);
        setCustomMethods(savedMethods);
        setSettingsState(savedSettings);
        setFavoriteCards(savedFavorites);
        setConfig((current) => ({
          ...current,
          reversals: savedSettings.reversals,
          objectivity: savedSettings.objectivity,
        }));
      })
      .catch(() => {
        setToast("Os dados locais não puderam ser carregados.");
      });

    const persisted =
      localStorage.getItem("oraculum:provider") ??
      sessionStorage.getItem("oraculum:provider");
    if (persisted) {
      window.setTimeout(() => {
        try {
          setProvider(JSON.parse(persisted) as ProviderSettings);
        } catch {
          sessionStorage.removeItem("oraculum:provider");
          localStorage.removeItem("oraculum:provider");
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settingsState.theme;
    root.dataset.contrast = String(settingsState.highContrast);
    root.dataset.reduceMotion = String(settingsState.reduceMotion);
    root.style.setProperty("--font-scale", String(settingsState.fontScale));
  }, [settingsState]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    const connectionTimer = window.setTimeout(
      () => setOnline(navigator.onLine),
      0,
    );

    if ("serviceWorker" in navigator) {
      const base = window.location.pathname.startsWith("/oraculum-tarot-ai")
        ? "/oraculum-tarot-ai/"
        : "/";
      navigator.serviceWorker
        .register(`${base}sw.js`, { scope: base })
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            worker?.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch(() => undefined);
    }

    return () => {
      window.clearTimeout(connectionTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);

  function navigate(next: Route) {
    window.history.pushState(null, "", `#/${next}`);
    setRoute(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: settingsState.reduceMotion ? "auto" : "smooth" });
  }

  function updateConfig<K extends keyof ReadingConfig>(
    key: K,
    value: ReadingConfig[K],
  ) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function quickStart(methodId: string) {
    setConfig((current) => ({ ...current, methodId }));
    navigate("new");
  }

  function prepareTable(event: FormEvent) {
    event.preventDefault();
    const parsed = questionSchema.safeParse(config.question);
    if (!parsed.success) {
      setQuestionError(parsed.error.issues[0]?.message ?? "Revise a pergunta.");
      return;
    }
    setQuestionError("");
    setActiveReading(null);
    setAuditOpen(false);
    navigate("table");
  }

  async function performDraw() {
    setDrawing(true);
    setQuestionError("");
    try {
      const { cards, audit } = await drawCards({
        method: activeMethod,
        reversals: config.reversals,
      });
      const interpretation = interpretReading(cards, activeMethod, config);
      const now = new Date().toISOString();
      const reading: ReadingRecord = {
        id: secureUuid(),
        title:
          config.question.length > 66
            ? `${config.question.slice(0, 63)}…`
            : config.question,
        createdAt: now,
        updatedAt: now,
        config: { ...config },
        method: activeMethod,
        cards,
        audit,
        interpretation,
        favorite: false,
      };
      await saveReading(reading);
      setActiveReading(reading);
      setHistory((current) => [
        reading,
        ...current.filter((item) => item.id !== reading.id),
      ]);
      setToast("Leitura concluída e salva neste dispositivo.");
    } catch (error) {
      setQuestionError(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o sorteio.",
      );
    } finally {
      setDrawing(false);
    }
  }

  async function toggleReadingFavorite(reading: ReadingRecord) {
    const updated = {
      ...reading,
      favorite: !reading.favorite,
      updatedAt: new Date().toISOString(),
    };
    await saveReading(updated);
    setHistory((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (activeReading?.id === updated.id) setActiveReading(updated);
  }

  async function removeReading(id: string) {
    if (!window.confirm("Excluir esta leitura do dispositivo?")) return;
    await deleteReading(id);
    setHistory((current) => current.filter((item) => item.id !== id));
    if (activeReading?.id === id) setActiveReading(null);
    setToast("Leitura excluída.");
  }

  async function renameReading(reading: ReadingRecord) {
    const title = window.prompt("Novo nome da leitura:", reading.title)?.trim();
    if (!title) return;
    const updated = {
      ...reading,
      title: title.slice(0, 100),
      updatedAt: new Date().toISOString(),
    };
    await saveReading(updated);
    setHistory((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (activeReading?.id === updated.id) setActiveReading(updated);
  }

  async function toggleCardFavorite(id: string) {
    const next = favoriteCards.includes(id)
      ? favoriteCards.filter((cardId) => cardId !== id)
      : [...favoriteCards, id];
    setFavoriteCards(next);
    await saveFavoriteCards(next);
  }

  async function persistSettings(next: AppSettings) {
    setSettingsState(next);
    await saveSettings(next);
    setConfig((current) => ({
      ...current,
      reversals: next.reversals,
      objectivity: next.objectivity,
    }));
  }

  async function handleBackupImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(await file.text());
      const [savedReadings, savedMethods, savedSettings, savedFavorites] =
        await Promise.all([
          listReadings(),
          listMethods(),
          loadSettings(),
          loadFavoriteCards(),
        ]);
      setHistory(savedReadings);
      setCustomMethods(savedMethods);
      setSettingsState(savedSettings);
      setFavoriteCards(savedFavorites);
      setToast("Backup importado com sucesso.");
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Falha ao importar o backup.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function downloadBackup() {
    downloadText(
      `oraculum-backup-${new Date().toISOString().slice(0, 10)}.json`,
      await exportBackup(),
      "application/json",
    );
  }

  async function deleteEverything() {
    const confirmed = window.confirm(
      "Apagar permanentemente leituras, métodos, favoritos e configurações deste dispositivo?",
    );
    if (!confirmed) return;
    await clearAllData();
    setHistory([]);
    setCustomMethods([]);
    setFavoriteCards([]);
    setSettingsState(defaultSettings);
    setActiveReading(null);
    setToast("Todos os dados locais foram apagados.");
  }

  function resetMethodEditor() {
    setMethodName("");
    setMethodPositions(["Situação", "Ponto de atenção", "Conselho"]);
    setEditingMethodId(null);
  }

  async function submitCustomMethod(event: FormEvent) {
    event.preventDefault();
    const name = methodName.trim();
    const positions = methodPositions
      .map((position) => position.trim())
      .filter(Boolean);
    if (name.length < 3 || positions.length === 0) {
      setToast("Dê um nome ao método e mantenha ao menos uma posição.");
      return;
    }
    const now = new Date().toISOString();
    const method: SpreadMethod = {
      id: editingMethodId ?? `custom-${secureUuid()}`,
      name: name.slice(0, 80),
      description: "Método personalizado criado neste dispositivo.",
      positions: positions.slice(0, 20),
      category: "Personalizada",
      duration: `${Math.max(2, positions.length * 2)} min`,
      custom: true,
      createdAt:
        customMethods.find((item) => item.id === editingMethodId)?.createdAt ??
        now,
    };
    await saveMethod(method);
    setCustomMethods((current) => [
      method,
      ...current.filter((item) => item.id !== method.id),
    ]);
    resetMethodEditor();
    setToast("Método salvo.");
  }

  function editMethod(method: SpreadMethod) {
    setMethodName(method.name);
    setMethodPositions([...method.positions]);
    setEditingMethodId(method.id);
    document
      .getElementById("method-editor")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function duplicateMethod(method: SpreadMethod) {
    const copy: SpreadMethod = {
      ...method,
      id: `custom-${secureUuid()}`,
      name: `${method.name} — cópia`,
      createdAt: new Date().toISOString(),
    };
    await saveMethod(copy);
    setCustomMethods((current) => [copy, ...current]);
    setToast("Método duplicado.");
  }

  async function removeMethod(method: SpreadMethod) {
    if (!window.confirm(`Excluir “${method.name}”?`)) return;
    await deleteMethod(method.id);
    setCustomMethods((current) =>
      current.filter((item) => item.id !== method.id),
    );
    if (config.methodId === method.id) updateConfig("methodId", "single");
    setToast("Método excluído.");
  }

  function movePosition(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= methodPositions.length) return;
    setMethodPositions((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function startLocalAI() {
    setAiState("loading");
    setAiError("");
    setAiProgress(0);
    try {
      await localAI.load((progress, text) => {
        setAiProgress(progress);
        setAiProgressText(text);
      });
      setAiState("ready");
      setAiProgress(100);
      setToast("IA local pronta para uso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar a IA local.";
      if (message === "Carregamento cancelado.") {
        setAiState("idle");
      } else {
        setAiState("error");
        setAiError(message);
      }
    }
  }

  function cancelLocalAI() {
    localAI.cancel();
    setAiState("idle");
    setAiProgress(0);
    setAiProgressText("");
  }

  function aiPrompt(reading: ReadingRecord): string {
    return `Refine esta leitura sem mudar as cartas sorteadas e sem afirmar fatos privados.
Pergunta: ${reading.config.question}
Método: ${reading.method.name}
Cartas: ${reading.cards
      .map(
        (item) =>
          `${item.position}: ${item.card.name} (${item.orientation === "reversed" ? "invertida" : "direta"})`,
      )
      .join("; ")}
Interpretação local: ${reading.interpretation.synthesis}
Escreva de 3 a 5 parágrafos claros, em português do Brasil, com um conselho prático.`;
  }

  async function enhanceWithLocalAI() {
    if (!activeReading || aiState !== "ready") return;
    setEnhancing(true);
    try {
      const text = await localAI.generate(aiPrompt(activeReading));
      const updated: ReadingRecord = {
        ...activeReading,
        updatedAt: new Date().toISOString(),
        interpretation: {
          ...activeReading.interpretation,
          aiEnhancement: text,
        },
      };
      await saveReading(updated);
      setActiveReading(updated);
      setHistory((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "A IA local não concluiu o refinamento.",
      );
    } finally {
      setEnhancing(false);
    }
  }

  function saveProviderSettings() {
    if (!provider.apiKey.trim()) {
      setToast("Insira sua chave própria antes de salvar.");
      return;
    }
    const storage = provider.persist ? localStorage : sessionStorage;
    const otherStorage = provider.persist ? sessionStorage : localStorage;
    storage.setItem("oraculum:provider", JSON.stringify(provider));
    otherStorage.removeItem("oraculum:provider");
    setToast(
      provider.persist
        ? "Configuração salva somente neste navegador."
        : "Configuração mantida apenas nesta sessão.",
    );
  }

  function clearProviderSettings() {
    localStorage.removeItem("oraculum:provider");
    sessionStorage.removeItem("oraculum:provider");
    setProvider({
      endpoint: "https://api.openai.com/v1",
      model: "",
      apiKey: "",
      persist: false,
    });
    setToast("Chave e configuração apagadas deste dispositivo.");
  }

  async function enhanceWithProvider() {
    if (!activeReading) {
      setToast("Abra ou faça uma leitura antes de usar o provedor.");
      return;
    }
    if (!provider.apiKey || !provider.model || !provider.endpoint) {
      setToast("Preencha endpoint, modelo e chave.");
      return;
    }
    let endpoint: URL;
    try {
      endpoint = new URL(provider.endpoint);
      if (endpoint.protocol !== "https:") throw new Error();
    } catch {
      setToast("Use um endpoint HTTPS válido.");
      return;
    }
    setProviderBusy(true);
    try {
      const response = await fetch(
        `${endpoint.toString().replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              {
                role: "system",
                content:
                  "Refine leituras simbólicas com prudência. Não trate pensamentos privados, diagnósticos ou previsões como fatos.",
              },
              { role: "user", content: aiPrompt(activeReading) },
            ],
            temperature: 0.5,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `O provedor respondeu com status ${response.status}. Verifique chave, modelo e CORS.`,
        );
      }
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("O provedor não retornou texto.");
      const updated: ReadingRecord = {
        ...activeReading,
        updatedAt: new Date().toISOString(),
        interpretation: {
          ...activeReading.interpretation,
          aiEnhancement: text,
        },
      };
      await saveReading(updated);
      setActiveReading(updated);
      setHistory((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setToast("Leitura refinada com seu provedor.");
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Falha ao acessar o provedor.",
      );
    } finally {
      setProviderBusy(false);
    }
  }

  async function installApp() {
    if (!installPrompt) {
      setToast(
        "Use a opção “Instalar aplicativo” do navegador quando disponível.",
      );
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  const filteredLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLocaleLowerCase("pt-BR");
    return TAROT_DECK.filter((card) => {
      const matchesQuery =
        !query ||
        card.name.toLocaleLowerCase("pt-BR").includes(query) ||
        card.keywordsUpright.some((keyword) =>
          keyword.toLocaleLowerCase("pt-BR").includes(query),
        );
      const matchesFilter =
        libraryFilter === "todos" ||
        (libraryFilter === "maiores" && card.arcana === "major") ||
        card.suit?.toLocaleLowerCase("pt-BR") === libraryFilter;
      return matchesQuery && matchesFilter;
    });
  }, [libraryFilter, libraryQuery]);

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLocaleLowerCase("pt-BR");
    return history.filter((reading) => {
      const matchesQuery =
        !query ||
        reading.title.toLocaleLowerCase("pt-BR").includes(query) ||
        reading.config.question.toLocaleLowerCase("pt-BR").includes(query);
      const matchesFilter =
        historyFilter === "todos" ||
        (historyFilter === "favoritos" && reading.favorite) ||
        reading.config.theme === historyFilter;
      return matchesQuery && matchesFilter;
    });
  }, [history, historyFilter, historyQuery]);

  const favoriteCardObjects = TAROT_DECK.filter((card) =>
    favoriteCards.includes(card.id),
  );
  const favoriteReadings = history.filter((reading) => reading.favorite);

  function renderHome() {
    return (
      <div className="home-screen">
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow">
              <ShieldCheck size={14} />
              Tarô completo · IA privada · sorteio auditável
            </span>
            <h1 aria-label="Consulte o invisível. Compreenda o presente.">
              Consulte o invisível.
              <br />
              <em>Compreenda o presente.</em>
            </h1>
            <p>
              Um oráculo digital de alta precisão simbólica, com 78 cartas,
              métodos profissionais e inteligência artificial que aprofunda
              cada combinação sem alterar o sorteio.
            </p>
            <div className="hero__actions">
              <button className="button button--primary" onClick={() => quickStart("situation-obstacle-advice")}>
                Iniciar leitura
                <ArrowRight size={17} />
              </button>
              <button className="button button--ghost" onClick={() => navigate("methods")}>
                Explorar métodos
              </button>
            </div>
            <div className="trust-row" aria-label="Recursos principais">
              <span>
                <LockKeyhole size={14} /> Privacidade por design
              </span>
              <span>
                <BrainCircuit size={14} /> IA local gratuita
              </span>
              <span>
                <Database size={14} /> Sincronização opcional
              </span>
            </div>
          </div>
          <div className="hero__visual hero-reading-preview" aria-label="Prévia de uma leitura de três cartas">
            <div className="celestial-orbit celestial-orbit--one" />
            <div className="celestial-orbit celestial-orbit--two" />
            <div className="hero-preview__heading">
              <span>✦</span>
              <div>
                <small>Método em destaque</small>
                <b>Passado · Presente · Caminho</b>
              </div>
            </div>
            <div className="hero-deck">
              {[0, 1, 2].map((index) => (
                <div className="hero-deck__item" key={index}>
                  <TarotCardBack index={index} active />
                  <span>{["Passado", "Presente", "Caminho"][index]}</span>
                </div>
              ))}
            </div>
            <div className="hero-proof">
              <ShieldCheck size={15} />
              <span>
                <b>{initialUser ? "Conta protegida" : "Modo privado"}</b>
                {initialUser ? "Sincronização ativada" : "Dados neste dispositivo"}
              </span>
            </div>
          </div>
        </section>

        <section className="metric-strip" aria-label="Números do aplicativo">
          <div>
            <strong>78</strong>
            <span>Arcanos completos</span>
          </div>
          <div>
            <strong>{SPREAD_METHODS.length}+</strong>
            <span>Métodos de tiragem</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Camadas de inteligência</span>
          </div>
          <div>
            <strong>0</strong>
            <span>Dados enviados pelo motor local</span>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Escolha um caminho</span>
              <h2>Leituras feitas para a sua pergunta</h2>
            </div>
            <button className="text-link" onClick={() => navigate("new")}>
              Ver todos os métodos <ChevronRight size={16} />
            </button>
          </div>
          <div className="spread-grid">
            {[
              SPREAD_METHODS[4],
              SPREAD_METHODS[9],
              SPREAD_METHODS[17],
            ].map((method, index) => (
              <button
                key={method.id}
                className="spread-card"
                onClick={() => quickStart(method.id)}
              >
                <span className="spread-card__number">0{index + 1}</span>
                <span className="spread-card__icon">
                  {index === 0 ? "△" : index === 1 ? "♡" : "☾"}
                </span>
                <h3>{method.name}</h3>
                <p>{method.description}</p>
                <span className="spread-card__meta">
                  {method.positions.length} cartas · {method.duration}
                </span>
                <ChevronRight className="spread-card__arrow" size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="local-engine-banner">
          <div className="local-engine-banner__icon">
            <BrainCircuit size={30} />
          </div>
          <div>
            <span className="eyebrow">Motor especialista 1.0</span>
            <h2>Profundo sem depender da internet.</h2>
            <p>
              O núcleo cruza posições, orientações, elementos, naipes,
              polaridades, repetições, progressões e combinações. A IA opcional
              apenas refina o texto — nunca escolhe as cartas.
            </p>
          </div>
          <button className="button button--soft" onClick={() => navigate("local-ai")}>
            Conhecer as camadas
          </button>
        </section>

        {history.length > 0 ? (
          <section className="section-block">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Seu espaço</span>
                <h2>Leituras recentes</h2>
              </div>
              <button className="text-link" onClick={() => navigate("history")}>
                Abrir histórico <ChevronRight size={16} />
              </button>
            </div>
            <div className="recent-list">
              {history.slice(0, 3).map((reading) => (
                <button
                  key={reading.id}
                  className="recent-row"
                  onClick={() => {
                    setActiveReading(reading);
                    navigate("table");
                  }}
                >
                  <span className="recent-row__glyph">
                    {reading.cards[0]?.card.symbol ?? "✦"}
                  </span>
                  <span>
                    <b>{reading.title}</b>
                    <small>
                      {reading.method.name} · {formatDate(reading.createdAt)}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  function renderNewReading() {
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Nova leitura"
          title="Qual questão pede clareza?"
          copy="Formule uma pergunta aberta e observável. O sorteio acontece somente depois que você entrar na mesa."
        />
        <form className="reading-builder" onSubmit={prepareTable}>
          <section className="builder-main">
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="reading-question">Sua pergunta</label>
                <span>{config.question.length}/500</span>
              </div>
              <textarea
                id="reading-question"
                value={config.question}
                maxLength={500}
                onChange={(event) => {
                  updateConfig("question", event.target.value.slice(0, 500));
                  if (questionError) setQuestionError("");
                }}
                placeholder="Ex.: O que preciso compreender sobre esta decisão profissional?"
                aria-describedby={
                  questionError ? "question-error" : "question-guidance"
                }
                aria-invalid={Boolean(questionError)}
              />
              {questionError ? (
                <p className="field-error" id="question-error" role="alert">
                  <AlertTriangle size={14} /> {questionError}
                </p>
              ) : (
                <p className="field-help" id="question-guidance">
                  Evite perguntas que tentem confirmar pensamentos privados de
                  outra pessoa como fatos.
                </p>
              )}
            </div>

            <div className="field-group">
              <label>Tema da consulta</label>
              <div className="chip-group">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={classNames(
                      "choice-chip",
                      config.theme === option.value && "is-selected",
                    )}
                    onClick={() => updateConfig("theme", option.value)}
                  >
                    {config.theme === option.value ? <Check size={14} /> : null}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label>Método de tiragem</label>
                <span>{allMethods.length} disponíveis</span>
              </div>
              <div className="method-picker">
                {allMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={classNames(
                      "method-option",
                      config.methodId === method.id && "is-selected",
                    )}
                    onClick={() => updateConfig("methodId", method.id)}
                  >
                    <span className="method-option__glyph">
                      {method.custom ? "✎" : method.positions.length > 7 ? "◉" : "✦"}
                    </span>
                    <span>
                      <b>{method.name}</b>
                      <small>
                        {method.positions.length}{" "}
                        {method.positions.length === 1 ? "carta" : "cartas"} ·{" "}
                        {method.duration}
                      </small>
                    </span>
                    {config.methodId === method.id ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="builder-sidebar">
            <div className="builder-card">
              <span className="eyebrow">Configuração</span>
              <h2>{activeMethod.name}</h2>
              <p>{activeMethod.description}</p>
              <div className="position-preview">
                {activeMethod.positions.slice(0, 6).map((position, index) => (
                  <span key={`${position}-${index}`}>
                    <i>{index + 1}</i>
                    {position}
                  </span>
                ))}
                {activeMethod.positions.length > 6 ? (
                  <small>
                    + {activeMethod.positions.length - 6} posições
                  </small>
                ) : null}
              </div>
            </div>

            <div className="builder-card">
              <div className="toggle-row">
                <span>
                  <b>Cartas invertidas</b>
                  <small>Orientação definida separadamente</small>
                </span>
                <button
                  type="button"
                  className={classNames(
                    "switch",
                    config.reversals && "is-active",
                  )}
                  onClick={() => updateConfig("reversals", !config.reversals)}
                  role="switch"
                  aria-checked={config.reversals}
                >
                  <span />
                </button>
              </div>
              <div className="select-field">
                <label htmlFor="deck">Tradição visual</label>
                <select
                  id="deck"
                  value={config.deck}
                  onChange={(event) =>
                    updateConfig(
                      "deck",
                      event.target.value as ReadingConfig["deck"],
                    )
                  }
                >
                  <option>Rider-Waite-Smith</option>
                  <option>Marselha</option>
                  <option>Thoth</option>
                </select>
              </div>
              <div className="select-field">
                <label htmlFor="style">Estilo da interpretação</label>
                <select
                  id="style"
                  value={config.style}
                  onChange={(event) =>
                    updateConfig(
                      "style",
                      event.target.value as InterpretationStyle,
                    )
                  }
                >
                  {styleOptions.map((style) => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group field-group--compact">
                <label>Profundidade</label>
                <div className="depth-selector">
                  {depthOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={classNames(
                        config.depth === option.value && "is-selected",
                      )}
                      onClick={() => updateConfig("depth", option.value)}
                    >
                      <b>{option.label}</b>
                      <small>{option.copy}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="range-field">
                <div>
                  <label htmlFor="objectivity">Objetividade</label>
                  <span>{config.objectivity}%</span>
                </div>
                <input
                  id="objectivity"
                  type="range"
                  min="20"
                  max="100"
                  value={config.objectivity}
                  onChange={(event) =>
                    updateConfig("objectivity", Number(event.target.value))
                  }
                />
              </div>
            </div>

            <button className="button button--primary button--wide" type="submit">
              Entrar na mesa
              <ArrowRight size={17} />
            </button>
            <div className="privacy-note">
              <LockKeyhole size={15} />
              <span>
                Sua pergunta permanece neste dispositivo e não influencia o
                sorteio.
              </span>
            </div>
          </aside>
        </form>
      </div>
    );
  }

  function renderReadingResult(reading: ReadingRecord) {
    const interpretation = reading.interpretation;
    return (
      <div className="reading-result">
        <div className="result-actions">
          <button
            className="button button--ghost button--small"
            onClick={() => toggleReadingFavorite(reading)}
          >
            <Heart
              size={15}
              fill={reading.favorite ? "currentColor" : "none"}
            />
            {reading.favorite ? "Favoritada" : "Favoritar"}
          </button>
          <button
            className="button button--ghost button--small"
            onClick={() =>
              downloadText(
                `leitura-${reading.id}.md`,
                readingAsMarkdown(reading),
                "text/markdown",
              )
            }
          >
            <Download size={15} /> Markdown
          </button>
          <button
            className="button button--ghost button--small"
            onClick={() =>
              downloadText(
                `leitura-${reading.id}.txt`,
                readingAsText(reading),
              )
            }
          >
            <FileText size={15} /> TXT
          </button>
          <button
            className="button button--ghost button--small"
            onClick={() =>
              downloadText(
                `leitura-${reading.id}.json`,
                JSON.stringify(reading, null, 2),
                "application/json",
              )
            }
          >
            <FileJson size={15} /> JSON
          </button>
          <button
            className="button button--ghost button--small"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Imprimir / PDF
          </button>
        </div>

        <section className="answer-card">
          <span className="eyebrow">Resposta direta</span>
          <h2>{interpretation.directAnswer}</h2>
          <p>{interpretation.overview}</p>
          <div className="confidence">
            <span>Confiança interpretativa</span>
            <div>
              <i style={{ width: `${interpretation.confidence}%` }} />
            </div>
            <b>{interpretation.confidence}%</b>
          </div>
        </section>

        {interpretation.yesNo ? (
          <section className="yes-no-panel">
            <div className="yes-no-panel__verdict">
              <span>Veredito graduado</span>
              <strong>{interpretation.yesNo.verdict}</strong>
              <small>Índice simbólico: {interpretation.yesNo.score}</small>
            </div>
            <div>
              <h3>Forças favoráveis</h3>
              <ul>
                {interpretation.yesNo.favorable.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Forças contrárias</h3>
              <ul>
                {interpretation.yesNo.contrary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="interpretation-section">
          <div className="section-heading section-heading--compact">
            <div>
              <span className="eyebrow">Posição por posição</span>
              <h2>A narrativa da tiragem</h2>
            </div>
          </div>
          <div className="position-interpretations">
            {interpretation.positions.map((position, index) => (
              <article key={`${position.position}-${index}`}>
                <span className="position-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <small>{position.position}</small>
                  <h3>{position.title}</h3>
                  <p>{position.body}</p>
                  <div className="keyword-row">
                    {position.keywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="result-grid">
          <article>
            <span className="result-icon result-icon--positive">✦</span>
            <h3>Pontos favoráveis</h3>
            <ul>
              {interpretation.favorable.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <span className="result-icon result-icon--warning">△</span>
            <h3>Bloqueios e riscos</h3>
            <ul>
              {interpretation.blocks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="combinations-panel">
          <div>
            <span className="eyebrow">Padrões do conjunto</span>
            <h2>Combinações e predominâncias</h2>
          </div>
          <div className="pattern-chips">
            <span>
              {interpretation.patterns.majorCount} arcanos maiores
            </span>
            {interpretation.patterns.dominantSuit ? (
              <span>{interpretation.patterns.dominantSuit} dominante</span>
            ) : null}
            {interpretation.patterns.repeatedNumbers.map((number) => (
              <span key={number}>Número {number} repetido</span>
            ))}
          </div>
          <ol>
            {interpretation.combinations.map((combination) => (
              <li key={combination}>{combination}</li>
            ))}
          </ol>
        </section>

        <section className="counsel-card">
          <span className="counsel-card__glyph">☉</span>
          <div>
            <span className="eyebrow">Conselho prático</span>
            <h2>{interpretation.advice}</h2>
            <p>{interpretation.symbolicTrend}</p>
          </div>
        </section>

        <section className="synthesis-card">
          <span className="eyebrow">Síntese final</span>
          <p>{interpretation.synthesis}</p>
        </section>

        <section className="ai-refine-card">
          <div>
            <span className="eyebrow">
              <BrainCircuit size={14} /> Camada opcional
            </span>
            <h2>Refinar a linguagem sem alterar o sorteio</h2>
            <p>
              A IA recebe apenas as cartas já registradas e a síntese local.
              Ela não pode trocar nem escolher cartas.
            </p>
          </div>
          {interpretation.aiEnhancement ? (
            <div className="ai-enhancement">
              <span>Leitura refinada</span>
              <p>{interpretation.aiEnhancement}</p>
            </div>
          ) : (
            <div className="ai-refine-actions">
              <button
                className="button button--soft"
                disabled={aiState !== "ready" || enhancing}
                onClick={enhanceWithLocalAI}
              >
                <Cpu size={16} />
                {enhancing
                  ? "Refinando…"
                  : aiState === "ready"
                    ? "Usar IA local"
                    : "IA local não carregada"}
              </button>
              <button
                className="button button--ghost"
                onClick={() => navigate("local-ai")}
              >
                Configurar camadas
              </button>
            </div>
          )}
        </section>

        <section className="audit-panel">
          <button
            className="audit-panel__header"
            onClick={() => setAuditOpen((current) => !current)}
            aria-expanded={auditOpen}
          >
            <span>
              <ShieldCheck size={20} />
              <span>
                <b>Auditoria do sorteio</b>
                <small>SHA-256 · Web Crypto · motor {reading.audit.engineVersion}</small>
              </span>
            </span>
            {auditOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {auditOpen ? (
            <div className="audit-panel__body">
              <dl>
                <div>
                  <dt>Algoritmo</dt>
                  <dd>{reading.audit.algorithm}</dd>
                </div>
                <div>
                  <dt>Data e hora</dt>
                  <dd>{formatDate(reading.audit.timestamp, true)}</dd>
                </div>
                <div>
                  <dt>Quantidade</dt>
                  <dd>
                    {reading.audit.count} de {reading.audit.deckSize} cartas
                  </dd>
                </div>
                <div>
                  <dt>Hash SHA-256</dt>
                  <dd className="hash-value">{reading.audit.hash}</dd>
                </div>
              </dl>
              <div className="audit-draws">
                {reading.audit.draws.map((draw) => (
                  <span key={`${draw.order}-${draw.cardId}`}>
                    <i>{draw.order}</i>
                    {draw.cardName}
                    <small>
                      {draw.orientation === "reversed" ? "Invertida" : "Direta"}
                    </small>
                  </span>
                ))}
              </div>
              <button
                className="button button--ghost button--small"
                onClick={() =>
                  downloadText(
                    `auditoria-${reading.id}.json`,
                    JSON.stringify(reading.audit, null, 2),
                    "application/json",
                  )
                }
              >
                <Download size={15} /> Exportar auditoria JSON
              </button>
            </div>
          ) : null}
        </section>

        <p className="reflection-disclaimer">
          <Info size={15} />
          O Tarô é apresentado como ferramenta simbólica de reflexão. Esta
          leitura não confirma pensamentos privados, diagnósticos, crimes,
          gravidez, doenças, morte ou acontecimentos futuros como fatos.
        </p>
      </div>
    );
  }

  function renderTable() {
    return (
      <div className="table-screen">
        <header className="table-header">
          <button className="back-link" onClick={() => navigate("new")}>
            <ChevronRight size={16} className="icon-back" /> Ajustar leitura
          </button>
          <div>
            <span>{activeMethod.name}</span>
            <h1>{config.question || activeReading?.config.question}</h1>
          </div>
          <span className="table-security">
            <ShieldCheck size={15} /> Sorteio auditável
          </span>
        </header>

        {!activeReading ? (
          <section className="reading-table">
            <div className="table-stars" aria-hidden="true">
              <span>✦</span>
              <span>·</span>
              <span>☾</span>
              <span>✧</span>
            </div>
            <div className="table-deck">
              {[4, 3, 2, 1, 0].map((index) => (
                <TarotCardBack key={index} index={index} active={drawing} />
              ))}
            </div>
            <div className="table-intro">
              <span className="eyebrow">O baralho completo está preparado</span>
              <h2>
                {drawing ? "Embaralhando com entropia segura…" : "Quando estiver pronto, faça o sorteio."}
              </h2>
              <p>
                {activeMethod.positions.length}{" "}
                {activeMethod.positions.length === 1 ? "posição" : "posições"} ·
                cartas {config.reversals ? "diretas e invertidas" : "somente diretas"}
              </p>
              {drawing ? (
                <div className="draw-progress" role="status">
                  <span />
                  Registrando ordem, orientações e prova SHA-256
                </div>
              ) : (
                <button
                  className="button button--primary button--large"
                  onClick={performDraw}
                >
                  <Sparkles size={18} /> Embaralhar e revelar
                </button>
              )}
              {questionError ? (
                <p className="field-error" role="alert">
                  <AlertTriangle size={14} /> {questionError}
                </p>
              ) : null}
            </div>
            <div className="position-dots">
              {activeMethod.positions.map((position, index) => (
                <span key={`${position}-${index}`} title={position}>
                  {index + 1}
                </span>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="revealed-table">
              <div className="revealed-cards">
                {activeReading.cards.map((drawn, index) => (
                  <motion.div
                    key={`${drawn.card.id}-${index}`}
                    initial={{ opacity: 0, y: 36, rotateY: 80 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    transition={{ delay: index * 0.13, duration: 0.5 }}
                  >
                    <TarotCardFace
                      card={drawn.card}
                      orientation={drawn.orientation}
                      label={drawn.position}
                      onClick={() => setSelectedCard(drawn.card)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
            {renderReadingResult(activeReading)}
          </>
        )}
      </div>
    );
  }

  function renderLibrary() {
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Biblioteca completa"
          title="Os 78 arcanos"
          copy="Pesquise símbolos, palavras-chave e significados. Cada carta inclui luz, sombra, conselho e relações."
          action={
            <span className="count-badge">{filteredLibrary.length} cartas</span>
          }
        />
        <div className="toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
              placeholder="Buscar carta ou palavra-chave"
              aria-label="Buscar na biblioteca"
            />
          </label>
          <div className="filter-tabs" role="group" aria-label="Filtrar cartas">
            {["todos", "maiores", "paus", "copas", "espadas", "ouros"].map(
              (filter) => (
                <button
                  key={filter}
                  className={classNames(
                    libraryFilter === filter && "is-selected",
                  )}
                  onClick={() => setLibraryFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>
        {filteredLibrary.length > 0 ? (
          <div className="library-grid">
            {filteredLibrary.map((card) => (
              <TarotCardFace
                key={card.id}
                card={card}
                compact
                onClick={() => setSelectedCard(card)}
                favorite={favoriteCards.includes(card.id)}
                onFavorite={() => toggleCardFavorite(card.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search size={24} />}
            title="Nenhuma carta encontrada"
            copy="Tente outro termo ou remova o filtro."
          />
        )}
      </div>
    );
  }

  function renderHistory() {
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Arquivo privado"
          title="Histórico de leituras"
          copy="Todas as leituras ficam no IndexedDB deste navegador. Pesquise, renomeie, exporte ou exclua quando quiser."
          action={
            <button className="button button--soft" onClick={downloadBackup}>
              <Download size={16} /> Backup completo
            </button>
          }
        />
        <div className="toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="Buscar pergunta ou nome"
              aria-label="Buscar no histórico"
            />
          </label>
          <select
            className="toolbar-select"
            value={historyFilter}
            onChange={(event) => setHistoryFilter(event.target.value)}
            aria-label="Filtrar histórico"
          >
            <option value="todos">Todas as leituras</option>
            <option value="favoritos">Favoritas</option>
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {filteredHistory.length > 0 ? (
          <div className="history-list">
            {filteredHistory.map((reading) => (
              <article key={reading.id} className="history-card">
                <button
                  className="history-card__open"
                  onClick={() => {
                    setConfig(reading.config);
                    setActiveReading(reading);
                    navigate("table");
                  }}
                >
                  <span className="history-card__sigil">
                    {reading.cards[0]?.card.symbol ?? "✦"}
                  </span>
                  <span className="history-card__copy">
                    <small>
                      {formatDate(reading.createdAt, true)} ·{" "}
                      {reading.config.theme}
                    </small>
                    <b>{reading.title}</b>
                    <span>
                      {reading.method.name} · {reading.cards.length} cartas
                    </span>
                    <span className="mini-card-row" aria-hidden="true">
                      {reading.cards.slice(0, 5).map((drawn) => (
                        <i key={`${reading.id}-${drawn.card.id}`}>
                          {drawn.card.symbol}
                        </i>
                      ))}
                    </span>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <div className="history-card__actions">
                  <button
                    onClick={() => toggleReadingFavorite(reading)}
                    aria-label={
                      reading.favorite
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      size={16}
                      fill={reading.favorite ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => renameReading(reading)}
                    aria-label="Renomear leitura"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      downloadText(
                        `leitura-${reading.id}.md`,
                        readingAsMarkdown(reading),
                        "text/markdown",
                      )
                    }
                    aria-label="Exportar leitura"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => removeReading(reading.id)}
                    aria-label="Excluir leitura"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<History size={26} />}
            title="Nenhuma leitura neste filtro"
            copy="Faça uma nova leitura ou altere os filtros."
            action={
              <button
                className="button button--primary"
                onClick={() => navigate("new")}
              >
                Nova leitura <ArrowRight size={16} />
              </button>
            }
          />
        )}
      </div>
    );
  }

  function renderFavorites() {
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Sua seleção"
          title="Favoritos"
          copy="Cartas e leituras importantes, reunidas somente neste dispositivo."
        />
        <section className="section-block">
          <div className="section-heading section-heading--compact">
            <div>
              <span className="eyebrow">Arcanos</span>
              <h2>Cartas favoritas</h2>
            </div>
            <span className="count-badge">{favoriteCardObjects.length}</span>
          </div>
          {favoriteCardObjects.length > 0 ? (
            <div className="library-grid library-grid--favorites">
              {favoriteCardObjects.map((card) => (
                <TarotCardFace
                  key={card.id}
                  card={card}
                  compact
                  onClick={() => setSelectedCard(card)}
                  favorite
                  onFavorite={() => toggleCardFavorite(card.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star size={24} />}
              title="Nenhuma carta favorita"
              copy="Marque cartas na biblioteca para encontrá-las aqui."
              action={
                <button
                  className="button button--ghost"
                  onClick={() => navigate("library")}
                >
                  Abrir biblioteca
                </button>
              }
            />
          )}
        </section>
        <section className="section-block">
          <div className="section-heading section-heading--compact">
            <div>
              <span className="eyebrow">Leituras</span>
              <h2>Leituras favoritas</h2>
            </div>
            <span className="count-badge">{favoriteReadings.length}</span>
          </div>
          {favoriteReadings.length > 0 ? (
            <div className="recent-list">
              {favoriteReadings.map((reading) => (
                <button
                  key={reading.id}
                  className="recent-row"
                  onClick={() => {
                    setConfig(reading.config);
                    setActiveReading(reading);
                    navigate("table");
                  }}
                >
                  <span className="recent-row__glyph">
                    {reading.cards[0]?.card.symbol}
                  </span>
                  <span>
                    <b>{reading.title}</b>
                    <small>
                      {reading.method.name} · {formatDate(reading.createdAt)}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Heart size={24} />}
              title="Nenhuma leitura favorita"
              copy="Abra o histórico e marque as leituras que deseja preservar em destaque."
            />
          )}
        </section>
      </div>
    );
  }

  function renderMethods() {
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Laboratório de métodos"
          title="Tiragens personalizadas"
          copy="Crie nomes para as posições, reorganize a sequência, duplique e exporte seus métodos."
        />
        <div className="methods-layout">
          <form
            className="method-editor"
            id="method-editor"
            onSubmit={submitCustomMethod}
          >
            <div className="method-editor__header">
              <div>
                <span className="eyebrow">
                  {editingMethodId ? "Editar método" : "Novo método"}
                </span>
                <h2>
                  {editingMethodId
                    ? "Ajuste sua estrutura"
                    : "Desenhe uma nova tiragem"}
                </h2>
              </div>
              {editingMethodId ? (
                <button
                  type="button"
                  className="icon-button"
                  onClick={resetMethodEditor}
                  aria-label="Cancelar edição"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
            <div className="select-field">
              <label htmlFor="method-name">Nome do método</label>
              <input
                id="method-name"
                value={methodName}
                onChange={(event) => setMethodName(event.target.value)}
                maxLength={80}
                placeholder="Ex.: Clareza para uma decisão"
              />
            </div>
            <div className="position-editor">
              <div className="field-label-row">
                <label>Posições</label>
                <span>{methodPositions.length}/20</span>
              </div>
              {methodPositions.map((position, index) => (
                <div className="position-editor__row" key={index}>
                  <span>{index + 1}</span>
                  <input
                    value={position}
                    onChange={(event) =>
                      setMethodPositions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      )
                    }
                    aria-label={`Nome da posição ${index + 1}`}
                    maxLength={60}
                  />
                  <button
                    type="button"
                    onClick={() => movePosition(index, -1)}
                    disabled={index === 0}
                    aria-label={`Mover posição ${index + 1} para cima`}
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePosition(index, 1)}
                    disabled={index === methodPositions.length - 1}
                    aria-label={`Mover posição ${index + 1} para baixo`}
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMethodPositions((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    disabled={methodPositions.length === 1}
                    aria-label={`Excluir posição ${index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {methodPositions.length < 20 ? (
                <button
                  type="button"
                  className="add-position"
                  onClick={() =>
                    setMethodPositions((current) => [
                      ...current,
                      `Posição ${current.length + 1}`,
                    ])
                  }
                >
                  <Plus size={15} /> Adicionar posição
                </button>
              ) : null}
            </div>
            <button className="button button--primary button--wide" type="submit">
              <Save size={16} />
              {editingMethodId ? "Salvar alterações" : "Salvar método"}
            </button>
          </form>

          <section>
            <div className="section-heading section-heading--compact">
              <div>
                <span className="eyebrow">Salvos no dispositivo</span>
                <h2>Seus métodos</h2>
              </div>
              <span className="count-badge">{customMethods.length}</span>
            </div>
            {customMethods.length > 0 ? (
              <div className="custom-method-list">
                {customMethods.map((method) => (
                  <article key={method.id}>
                    <span className="custom-method-list__glyph">✎</span>
                    <div>
                      <h3>{method.name}</h3>
                      <p>
                        {method.positions.length} posições ·{" "}
                        {method.positions.slice(0, 3).join(" · ")}
                        {method.positions.length > 3 ? "…" : ""}
                      </p>
                    </div>
                    <div className="custom-method-list__actions">
                      <button
                        onClick={() => {
                          updateConfig("methodId", method.id);
                          navigate("new");
                        }}
                        aria-label={`Usar ${method.name}`}
                      >
                        <Play size={15} />
                      </button>
                      <button
                        onClick={() => editMethod(method)}
                        aria-label={`Editar ${method.name}`}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => duplicateMethod(method)}
                        aria-label={`Duplicar ${method.name}`}
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() =>
                          downloadText(
                            `${method.id}.json`,
                            JSON.stringify(method, null, 2),
                            "application/json",
                          )
                        }
                        aria-label={`Exportar ${method.name}`}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={() => removeMethod(method)}
                        aria-label={`Excluir ${method.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Layers3 size={24} />}
                title="Seu primeiro método começa aqui"
                copy="Dê um nome à tiragem e descreva cada posição no editor."
              />
            )}
          </section>
        </div>
      </div>
    );
  }

  function renderLocalAI() {
    const supported =
      typeof window !== "undefined" ? localAI.isSupported() : false;
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Três camadas de interpretação"
          title="Inteligência com escolha e transparência"
          copy="O motor local funciona sempre. As camadas generativas são opcionais e nunca participam do sorteio."
        />
        <div className="layer-grid">
          <article className="layer-card layer-card--active">
            <div className="layer-card__number">01</div>
            <span className="layer-card__icon">
              <Sparkles size={24} />
            </span>
            <small>Ativo por padrão</small>
            <h2>Motor especialista local</h2>
            <p>
              Regras e dados próprios para 78 cartas, posições, inversões,
              elementos, naipes, padrões e combinações.
            </p>
            <ul>
              <li>
                <Check size={14} /> Offline e imediato
              </li>
              <li>
                <Check size={14} /> Sem chave ou conta
              </li>
              <li>
                <Check size={14} /> Resultado reproduzível pelo registro
              </li>
            </ul>
            <span className="status-pill status-pill--success">
              <CheckCircle2 size={13} /> Pronto
            </span>
          </article>

          <article className="layer-card">
            <div className="layer-card__number">02</div>
            <span className="layer-card__icon">
              <Cpu size={24} />
            </span>
            <small>Opcional · WebGPU</small>
            <h2>IA no navegador</h2>
            <p>
              {LOCAL_AI_MODEL.label}, modelo aberto e pequeno, carregado sob
              demanda e armazenado no cache do navegador.
            </p>
            <div className="compatibility-row">
              <span>
                {supported ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {supported ? "WebGPU detectado" : "WebGPU não detectado"}
              </span>
              <small>{LOCAL_AI_MODEL.approximateSize}</small>
            </div>
            {aiState === "loading" ? (
              <div className="ai-loader">
                <div>
                  <i style={{ width: `${aiProgress}%` }} />
                </div>
                <span>
                  <b>{aiProgress}%</b>
                  {aiProgressText || "Preparando modelo…"}
                </span>
                <button className="button button--ghost button--small" onClick={cancelLocalAI}>
                  <Square size={14} /> Cancelar
                </button>
              </div>
            ) : aiState === "ready" ? (
              <div className="ai-ready">
                <CheckCircle2 size={18} />
                <span>
                  <b>Modelo pronto</b>
                  Disponível até a página ser fechada
                </span>
                <button className="icon-button" onClick={cancelLocalAI} aria-label="Descarregar IA local">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                className="button button--soft button--wide"
                onClick={startLocalAI}
                disabled={!supported}
              >
                <Download size={16} />
                Carregar IA local
              </button>
            )}
            {aiState === "error" ? (
              <p className="field-error" role="alert">
                <AlertTriangle size={14} /> {aiError}
              </p>
            ) : null}
            <p className="microcopy">
              O primeiro carregamento pode demorar e consumir memória. Se não
              funcionar, o motor especialista continua disponível.
            </p>
          </article>

          <article className="layer-card">
            <div className="layer-card__number">03</div>
            <span className="layer-card__icon">
              <KeyRound size={24} />
            </span>
            <small>Opcional · sua própria conta</small>
            <h2>Conectar minha própria IA</h2>
            <p>
              Use um endpoint compatível com a API OpenAI. Alguns provedores
              bloqueiam chamadas diretas do navegador por CORS.
            </p>
            <div className="provider-form">
              <label>
                Endpoint HTTPS
                <input
                  value={provider.endpoint}
                  onChange={(event) =>
                    setProvider((current) => ({
                      ...current,
                      endpoint: event.target.value,
                    }))
                  }
                  placeholder="https://provedor.exemplo/v1"
                />
              </label>
              <label>
                Modelo
                <input
                  value={provider.model}
                  onChange={(event) =>
                    setProvider((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                  placeholder="nome-do-modelo"
                />
              </label>
              <label>
                Chave da API
                <span className="secret-field">
                  <input
                    type={showKey ? "text" : "password"}
                    value={provider.apiKey}
                    onChange={(event) =>
                      setProvider((current) => ({
                        ...current,
                        apiKey: event.target.value,
                      }))
                    }
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Sua chave privada"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((current) => !current)}
                    aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
                  >
                    {showKey ? <X size={15} /> : <MoreHorizontal size={15} />}
                  </button>
                </span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={provider.persist}
                  onChange={(event) =>
                    setProvider((current) => ({
                      ...current,
                      persist: event.target.checked,
                    }))
                  }
                />
                <span>
                  <b>Salvar neste navegador</b>
                  <small>
                    Desmarcado: a chave fica apenas na sessão atual.
                  </small>
                </span>
              </label>
              <div className="provider-form__actions">
                <button
                  className="button button--soft"
                  type="button"
                  onClick={saveProviderSettings}
                >
                  <Save size={15} /> Guardar configuração
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={clearProviderSettings}
                >
                  <Trash2 size={15} /> Apagar
                </button>
              </div>
              <button
                className="button button--primary button--wide"
                type="button"
                onClick={enhanceWithProvider}
                disabled={providerBusy}
              >
                <BrainCircuit size={16} />
                {providerBusy
                  ? "Consultando provedor…"
                  : "Refinar leitura aberta"}
              </button>
            </div>
            <div className="security-alert">
              <AlertTriangle size={16} />
              <span>
                Nunca use uma chave compartilhada ou vazada. Este aplicativo
                não registra a chave, mas o provedor escolhido receberá sua
                solicitação.
              </span>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="page-shell">
        <PageHeading
          eyebrow="Preferências e privacidade"
          title="Configurações"
          copy="Ajuste aparência, acessibilidade e padrões de leitura. Tudo permanece neste dispositivo."
        />
        <div className="settings-grid">
          <section className="settings-card">
            <div className="settings-card__title">
              <MoonStar size={20} />
              <div>
                <h2>Aparência</h2>
                <p>Escolha a atmosfera visual do aplicativo.</p>
              </div>
            </div>
            <div className="theme-selector">
              {(Object.keys(themeLabels) as ThemeName[]).map((theme) => (
                <button
                  key={theme}
                  className={classNames(
                    `theme-swatch theme-swatch--${theme}`,
                    settingsState.theme === theme && "is-selected",
                  )}
                  onClick={() =>
                    persistSettings({ ...settingsState, theme })
                  }
                >
                  <span />
                  <b>{themeLabels[theme]}</b>
                  {settingsState.theme === theme ? (
                    <CheckCircle2 size={16} />
                  ) : null}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__title">
              <Accessibility size={20} />
              <div>
                <h2>Acessibilidade</h2>
                <p>Contraste, movimento e escala tipográfica.</p>
              </div>
            </div>
            <div className="setting-rows">
              <div className="toggle-row">
                <span>
                  <b>Alto contraste</b>
                  <small>Reforça bordas e textos</small>
                </span>
                <button
                  className={classNames(
                    "switch",
                    settingsState.highContrast && "is-active",
                  )}
                  onClick={() =>
                    persistSettings({
                      ...settingsState,
                      highContrast: !settingsState.highContrast,
                    })
                  }
                  role="switch"
                  aria-checked={settingsState.highContrast}
                >
                  <span />
                </button>
              </div>
              <div className="toggle-row">
                <span>
                  <b>Reduzir movimento</b>
                  <small>Minimiza animações e transições</small>
                </span>
                <button
                  className={classNames(
                    "switch",
                    settingsState.reduceMotion && "is-active",
                  )}
                  onClick={() =>
                    persistSettings({
                      ...settingsState,
                      reduceMotion: !settingsState.reduceMotion,
                    })
                  }
                  role="switch"
                  aria-checked={settingsState.reduceMotion}
                >
                  <span />
                </button>
              </div>
              <div className="range-field">
                <div>
                  <label htmlFor="font-scale">Tamanho do texto</label>
                  <span>{Math.round(settingsState.fontScale * 100)}%</span>
                </div>
                <input
                  id="font-scale"
                  type="range"
                  min="0.9"
                  max="1.25"
                  step="0.05"
                  value={settingsState.fontScale}
                  onChange={(event) =>
                    persistSettings({
                      ...settingsState,
                      fontScale: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__title">
              <Sparkles size={20} />
              <div>
                <h2>Padrões de leitura</h2>
                <p>Preferências aplicadas às novas tiragens.</p>
              </div>
            </div>
            <div className="setting-rows">
              <div className="toggle-row">
                <span>
                  <b>Permitir cartas invertidas</b>
                  <small>Definidas após o embaralhamento</small>
                </span>
                <button
                  className={classNames(
                    "switch",
                    settingsState.reversals && "is-active",
                  )}
                  onClick={() =>
                    persistSettings({
                      ...settingsState,
                      reversals: !settingsState.reversals,
                    })
                  }
                  role="switch"
                  aria-checked={settingsState.reversals}
                >
                  <span />
                </button>
              </div>
              <div className="range-field">
                <div>
                  <label htmlFor="default-objectivity">
                    Objetividade padrão
                  </label>
                  <span>{settingsState.objectivity}%</span>
                </div>
                <input
                  id="default-objectivity"
                  type="range"
                  min="20"
                  max="100"
                  value={settingsState.objectivity}
                  onChange={(event) =>
                    persistSettings({
                      ...settingsState,
                      objectivity: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__title">
              <Database size={20} />
              <div>
                <h2>Dados locais</h2>
                <p>Backup, restauração e exclusão total.</p>
              </div>
            </div>
            <div className="data-actions">
              <button className="button button--soft" onClick={downloadBackup}>
                <Download size={16} /> Exportar backup
              </button>
              <label className="button button--ghost file-button">
                <Upload size={16} /> Importar backup
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleBackupImport}
                />
              </label>
              <button className="button button--danger" onClick={deleteEverything}>
                <Trash2 size={16} /> Apagar todos os meus dados
              </button>
            </div>
            <p className="microcopy">
              A exclusão remove leituras, métodos, favoritos e configurações
              armazenados por este aplicativo no navegador.
            </p>
          </section>

          <section className="settings-card settings-card--install">
            <div className="settings-card__title">
              <Download size={20} />
              <div>
                <h2>Instalar ORACULUM AI</h2>
                <p>Abra como aplicativo e mantenha o núcleo disponível offline.</p>
              </div>
            </div>
            <button className="button button--primary" onClick={installApp}>
              <Download size={16} /> Instalar PWA
            </button>
          </section>
        </div>
      </div>
    );
  }

  function renderInfoPage(kind: "about" | "privacy" | "terms" | "help") {
    const content = {
      about: {
        eyebrow: "Sobre",
        title: "Tarô, engenharia e transparência",
        copy: "ORACULUM AI foi criado por Esdra Felipe Silva de Oliveira como uma ferramenta gratuita de reflexão simbólica.",
        sections: [
          [
            "O que é",
            "Um aplicativo web instalável, sem cadastro, com baralho completo, sorteio criptográfico auditável e interpretação local baseada em regras. O projeto utiliza as tradições Rider-Waite-Smith, Marselha e Thoth como referências históricas e simbólicas, sem reproduzir ilustrações proprietárias.",
          ],
          [
            "O que não é",
            "Não é diagnóstico, aconselhamento médico, jurídico ou financeiro, nem mecanismo para confirmar pensamentos privados ou acontecimentos futuros. As leituras são possibilidades interpretativas.",
          ],
          [
            "Autoria",
            "Esdra Felipe Silva de Oliveira · GitHub @ezrafchev · software livre sob licença MIT.",
          ],
        ],
      },
      privacy: {
        eyebrow: "Privacidade",
        title: "Seus dados permanecem seus",
        copy: "O motor principal não exige conta, servidor ou analytics.",
        sections: [
          [
            "Armazenamento local",
            "Perguntas, leituras, favoritos, configurações, métodos e auditorias são salvos no IndexedDB do navegador. O aplicativo não envia esses dados por conta própria.",
          ],
          [
            "IA opcional",
            "Ao carregar a IA local, arquivos públicos do modelo são baixados e armazenados em cache. Ao configurar um provedor externo, a pergunta e a leitura são enviadas ao provedor escolhido; a política desse provedor passa a se aplicar.",
          ],
          [
            "Controle",
            "Você pode exportar um backup ou apagar todos os dados nas Configurações. Chaves externas não entram no repositório, no build, em logs ou analytics.",
          ],
        ],
      },
      terms: {
        eyebrow: "Termos",
        title: "Uso consciente do aplicativo",
        copy: "Ao usar o ORACULUM AI, considere suas leituras como linguagem simbólica e reflexiva.",
        sections: [
          [
            "Autonomia",
            "Decisões importantes devem considerar evidências, profissionais qualificados e sua realidade. Nenhuma leitura substitui sua responsabilidade ou autonomia.",
          ],
          [
            "Limites interpretativos",
            "O aplicativo não confirma traições, crimes, gravidez, doenças, morte, diagnósticos, sentimentos internos de terceiros ou eventos futuros como fatos.",
          ],
          [
            "Software livre",
            "O código é oferecido sob licença MIT, sem garantia de adequação a uma finalidade específica. Modelos e provedores opcionais possuem termos próprios.",
          ],
        ],
      },
      help: {
        eyebrow: "Central de ajuda",
        title: "Da pergunta à auditoria",
        copy: "Um guia curto para aproveitar cada camada do ORACULUM AI.",
        sections: [
          [
            "1. Formule a pergunta",
            "Prefira perguntas abertas: “o que preciso compreender?” ou “qual fator merece atenção?”. Defina contexto e evite tentar ler a mente de outras pessoas.",
          ],
          [
            "2. Escolha o método",
            "Use carta única para foco, três posições para clareza e métodos avançados para questões com várias dimensões. Você também pode criar posições próprias.",
          ],
          [
            "3. Verifique a auditoria",
            "Depois do sorteio, abra a Auditoria para conferir ordem, orientação, horário, algoritmo e hash SHA-256. A interpretação só começa após esse registro.",
          ],
          [
            "4. Preserve o que importa",
            "Favorite, renomeie, exporte como Markdown, TXT ou JSON, imprima em PDF e gere backups nas Configurações.",
          ],
        ],
      },
    }[kind];

    return (
      <div className="page-shell info-page">
        <PageHeading
          eyebrow={content.eyebrow}
          title={content.title}
          copy={content.copy}
        />
        <div className="info-layout">
          <aside>
            <span className="info-mark">◐</span>
            <b>ORACULUM AI</b>
            <small>Versão 1.0.0</small>
            <span className="status-pill status-pill--success">
              <CheckCircle2 size={13} /> Núcleo operacional
            </span>
          </aside>
          <div className="info-sections">
            {content.sections.map(([title, body]) => (
              <section key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderRoute() {
    switch (route) {
      case "new":
        return renderNewReading();
      case "table":
        return renderTable();
      case "library":
        return renderLibrary();
      case "history":
        return renderHistory();
      case "favorites":
        return renderFavorites();
      case "methods":
        return renderMethods();
      case "local-ai":
        return renderLocalAI();
      case "settings":
        return renderSettings();
      case "about":
      case "privacy":
      case "terms":
      case "help":
        return renderInfoPage(route);
      default:
        return renderHome();
    }
  }

  return (
    <div className="oraculum-app">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="mobile-header">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Ir para o início"
        >
          <span className="brand__mark">◐</span>
          <span>
            <b>ORACULUM</b>
            <small>AI</small>
          </span>
        </button>
        <button
          className="icon-button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <aside className={classNames("sidebar", menuOpen && "is-open")}>
        <div>
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="Ir para o início"
          >
            <span className="brand__mark">◐</span>
            <span>
              <b>ORACULUM</b>
              <small>AI</small>
            </span>
          </button>
          <button
            className="sidebar-new"
            onClick={() => navigate("new")}
          >
            <Plus size={17} />
            Nova leitura
          </button>
          <nav aria-label="Navegação principal">
            <span className="nav-label">Oráculo</span>
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  className={classNames(
                    route === item.route && "is-active",
                  )}
                  onClick={() => navigate(item.route)}
                  aria-current={route === item.route ? "page" : undefined}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
            <span className="nav-label">Sistema</span>
            {utilityNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.route}
                  className={classNames(
                    route === item.route && "is-active",
                  )}
                  onClick={() => navigate(item.route)}
                  aria-current={route === item.route ? "page" : undefined}
                >
                  <Icon size={17} />
                  {item.label}
                  {item.route === "local-ai" && aiState === "ready" ? (
                    <i className="nav-status" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="account-card">
            <span className="account-card__avatar">
              <UserCircle2 size={21} />
            </span>
            <span>
              <b>{initialUser?.displayName ?? "Sua conta ORACULUM"}</b>
              <small>
                {initialUser
                  ? syncState === "saving"
                    ? "Sincronizando…"
                    : syncState === "error"
                      ? "Modo local temporário"
                      : "Dados protegidos e sincronizados"
                  : hosted
                    ? "Entre para preservar seus dados"
                    : "Modo local neste dispositivo"}
              </small>
            </span>
            {hosted ? (
              <a
                href={
                  initialUser
                    ? "/signout-with-chatgpt?return_to=%2F"
                    : "/signin-with-chatgpt?return_to=%2F"
                }
              >
                {initialUser ? "Sair" : "Entrar"}
              </a>
            ) : null}
          </div>
          <button className="privacy-card" onClick={() => navigate("privacy")}>
            <ShieldCheck size={18} />
            <span>
              <b>Privado por design</b>
              <small>
                {initialUser
                  ? "Conta isolada e sincronização segura"
                  : "Seus dados ficam neste dispositivo"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
          <div className="connection-status">
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? "Online" : "Modo offline"}
            <span>v2.0.0</span>
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          className="menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}

      <main id="main-content" className="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: settingsState.reduceMotion ? 0 : 0.25 }}
          >
            {renderRoute()}
          </motion.div>
        </AnimatePresence>
        <footer className="site-footer">
          <span>
            <b>ORACULUM AI</b> · Esdra Felipe Silva de Oliveira
          </span>
          <nav aria-label="Informações legais">
            <button onClick={() => navigate("about")}>Sobre</button>
            <button onClick={() => navigate("privacy")}>Privacidade</button>
            <button onClick={() => navigate("terms")}>Termos</button>
            <a
              href="https://github.com/ezrafchev/oraculum-tarot-ai"
              target="_blank"
              rel="noreferrer"
            >
              Código <ExternalLink size={12} />
            </a>
          </nav>
        </footer>
      </main>

      <AnimatePresence>
        {selectedCard ? (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedCard(null);
            }}
          >
            <motion.section
              className="card-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="card-modal-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
            >
              <button
                className="card-modal__close"
                onClick={() => setSelectedCard(null)}
                aria-label="Fechar detalhes da carta"
                autoFocus
              >
                <X size={19} />
              </button>
              <div className="card-modal__visual">
                <TarotCardFace card={selectedCard} />
                <button
                  className="button button--ghost button--small"
                  onClick={() => toggleCardFavorite(selectedCard.id)}
                >
                  <Heart
                    size={15}
                    fill={
                      favoriteCards.includes(selectedCard.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                  {favoriteCards.includes(selectedCard.id)
                    ? "Favoritada"
                    : "Favoritar"}
                </button>
              </div>
              <div className="card-modal__content">
                <span className="eyebrow">
                  {selectedCard.arcana === "major"
                    ? "Arcano Maior"
                    : `Arcano Menor · ${selectedCard.suit}`}
                </span>
                <h2 id="card-modal-title">{selectedCard.name}</h2>
                <p className="card-modal__lead">
                  {selectedCard.meanings.general}
                </p>
                <div className="card-facts">
                  <span>
                    <small>Elemento</small>
                    <b>{selectedCard.element}</b>
                  </span>
                  <span>
                    <small>Astrologia</small>
                    <b>{selectedCard.astrology}</b>
                  </span>
                  <span>
                    <small>Número</small>
                    <b>{selectedCard.number}</b>
                  </span>
                </div>
                <div className="meaning-columns">
                  <div>
                    <h3>Luz</h3>
                    <p>{selectedCard.light}</p>
                    <div className="keyword-row">
                      {selectedCard.keywordsUpright.map((keyword) => (
                        <span key={keyword}>{keyword}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3>Sombra / invertida</h3>
                    <p>{selectedCard.shadow}</p>
                    <div className="keyword-row">
                      {selectedCard.keywordsReversed.map((keyword) => (
                        <span key={keyword}>{keyword}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="meaning-tabs">
                  {[
                    ["Afetivo", selectedCard.meanings.affective],
                    ["Profissional", selectedCard.meanings.professional],
                    ["Financeiro", selectedCard.meanings.financial],
                    ["Espiritual", selectedCard.meanings.spiritual],
                  ].map(([title, body]) => (
                    <article key={title}>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </article>
                  ))}
                </div>
                <div className="advice-box">
                  <span>Conselho</span>
                  <p>{selectedCard.advice}</p>
                  <small>{selectedCard.warning}</small>
                </div>
                <div className="relations-box">
                  <h3>Relações e combinações</h3>
                  <ul>
                    {selectedCard.relations.map((relation) => (
                      <li key={relation}>{relation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {updateAvailable ? (
        <div className="update-toast" role="status">
          <RotateCcw size={16} />
          <span>
            <b>Nova versão disponível</b>
            Recarregue para atualizar o aplicativo.
          </span>
          <button onClick={() => window.location.reload()}>Atualizar</button>
          <button
            className="icon-button"
            onClick={() => setUpdateAvailable(false)}
            aria-label="Dispensar aviso"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <CheckCircle2 size={17} />
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
