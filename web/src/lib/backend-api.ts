import type { Difficulty, Sessao } from "@/lib/terminal-breach";

/**
 * URL configurada (sem probe). Ordem:
 * 1) `VITE_BACKEND_URL`
 * 2) Mesmo hostname da página + :8080 (modo Network do Vite)
 * 3) `http://localhost:8080`
 */
function buildConfiguredApiBase(): string {
  const env = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim();
  if (env) return env.replace(/\/$/, "");

  if (typeof window === "undefined") {
    return "http://127.0.0.1:8080";
  }

  /* `npm run dev`: base vazia = URLs relativas → proxy no vite.config.ts */
  if (import.meta.env.DEV) {
    return "";
  }

  const h = window.location.hostname;
  if (h !== "localhost" && h !== "127.0.0.1") {
    return `${window.location.protocol}//${h}:8080`;
  }

  /* Padrão IPv4 literal: `localhost` pode ir para ::1 onde outro app responde 404 */
  return "http://127.0.0.1:8080";
}

/** Base que respondeu `/health` com sucesso (evita IPv6 localhost vs IPv4 do servidor C). */
let cachedProbeBase: string | null = null;
let probeInFlight: Promise<string | null> | null = null;

function uniqueApiCandidates(): string[] {
  const list: string[] = [];
  const add = (u: string) => {
    const x = u.replace(/\/$/, "");
    /* "" = mesma origem (proxy Vite em dev) */
    if (x === "" && !list.includes("")) {
      list.push("");
      return;
    }
    if (x && !list.includes(x)) list.push(x);
  };
  add(buildConfiguredApiBase());
  add("http://127.0.0.1:8080");
  add("http://localhost:8080");
  return list;
}

async function fetchHealthOk(base: string): Promise<boolean> {
  const ac = new AbortController();
  const timer = globalThis.setTimeout(() => ac.abort(), 6500);
  try {
    const resp = await fetch(`${base}/health`, {
      method: "GET",
      signal: ac.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) return false;
    const data = (await resp.json().catch(() => ({}))) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/**
 * Descobre em qual URL a API está de pé e guarda em cache.
 * Tenta, por exemplo, `http://localhost:8080` e `http://127.0.0.1:8080`.
 */
export async function probeBackend(): Promise<string | null> {
  if (cachedProbeBase) return cachedProbeBase;
  if (probeInFlight) return await probeInFlight;

  probeInFlight = (async (): Promise<string | null> => {
    for (const base of uniqueApiCandidates()) {
      if (await fetchHealthOk(base)) {
        cachedProbeBase = base;
        return base;
      }
    }
    return null;
  })();

  try {
    return await probeInFlight;
  } finally {
    probeInFlight = null;
  }
}

/** URL a usar nas requisições (usa cache do probe quando existir). */
export function getApiBase(): string {
  return cachedProbeBase ?? buildConfiguredApiBase();
}

export async function isBackendAvailable(): Promise<boolean> {
  return (await probeBackend()) != null;
}

export interface BackendStartResponse {
  sessionId: string;
  maxAttempts: number;
}

export interface BackendGuessResponse {
  attempts: number;
  won: boolean;
  finished: boolean;
  hint: "higher" | "lower" | "correct";
  secret?: number;
  rating?: string;
}

async function parseJsonOrThrow(resp: Response) {
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const message = typeof data?.error === "string" ? data.error : `HTTP ${resp.status}`;
    throw new Error(message);
  }
  return data;
}

async function apiBaseForRequest(): Promise<string> {
  const found = await probeBackend();
  if (found) return found;
  return getApiBase();
}

export async function startBackendGame(player: string, difficulty: Difficulty): Promise<BackendStartResponse> {
  const base = await apiBaseForRequest();
  const resp = await fetch(`${base}/api/game/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, difficulty }),
  });
  return (await parseJsonOrThrow(resp)) as BackendStartResponse;
}

export async function submitBackendGuess(sessionId: string, guess: number): Promise<BackendGuessResponse> {
  const base = await apiBaseForRequest();
  const resp = await fetch(`${base}/api/game/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, guess }),
  });
  return (await parseJsonOrThrow(resp)) as BackendGuessResponse;
}

/** Grava a sessão no mesmo `data/sessions.json` que o programa em C usa (quando a API está no ar). */
export async function recordWebSession(s: Sessao): Promise<void> {
  const base = await probeBackend();
  if (!base) return;
  const resp = await fetch(`${base}/api/session/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jogador: s.jogador,
      dificuldade: s.dificuldade,
      segredo: s.segredo,
      tentativas: s.tentativas,
      venceu: s.venceu,
      rating: s.rating,
      timestamp: s.timestamp,
    }),
  });
  await parseJsonOrThrow(resp);
}

export interface RoomCreateResponse {
  roomId: string;
  maxTotalGuesses: number;
  maxAttempts: number;
}

export interface RoomState {
  roomId: string;
  difficulty: string;
  host: string;
  guest: string;
  guestJoined: boolean;
  finished: boolean;
  turn: "host" | "guest" | "waiting";
  lastGuess: number;
  lastHint: string;
  totalGuesses: number;
  maxTotalGuesses: number;
  winner: string;
  secret: number | null;
  attemptsHost?: number;
  attemptsGuest?: number;
}

export interface RoomGuessResponse {
  ok: boolean;
  finished: boolean;
  won?: boolean;
  hint: string;
  secret?: number;
  winner?: string;
  attemptsHost?: number;
  attemptsGuest?: number;
  turn?: string;
  totalGuesses?: number;
}

export async function createMultiplayerRoom(host: string, difficulty: Difficulty): Promise<RoomCreateResponse> {
  const base = await apiBaseForRequest();
  const resp = await fetch(`${base}/api/room/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, difficulty }),
  });
  return (await parseJsonOrThrow(resp)) as RoomCreateResponse;
}

export async function joinMultiplayerRoom(roomId: string, guest: string): Promise<{ ok: boolean; host: string }> {
  const base = await apiBaseForRequest();
  const resp = await fetch(`${base}/api/room/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId: roomId.trim().toUpperCase(), guest }),
  });
  return (await parseJsonOrThrow(resp)) as { ok: boolean; host: string };
}

export async function fetchRoomState(roomId: string): Promise<RoomState> {
  const base = await apiBaseForRequest();
  const q = encodeURIComponent(roomId.trim().toUpperCase());
  const resp = await fetch(`${base}/api/room/state?roomId=${q}`);
  return (await parseJsonOrThrow(resp)) as RoomState;
}

export async function submitRoomGuess(roomId: string, player: string, guess: number): Promise<RoomGuessResponse> {
  const base = await apiBaseForRequest();
  const resp = await fetch(`${base}/api/room/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId: roomId.trim().toUpperCase(), player, guess }),
  });
  return (await parseJsonOrThrow(resp)) as RoomGuessResponse;
}
