import type { Difficulty, Sessao } from "@/lib/terminal-breach";

const API_BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8080";

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

export async function isBackendAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/health`);
    if (!resp.ok) return false;
    const data = (await resp.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function startBackendGame(player: string, difficulty: Difficulty): Promise<BackendStartResponse> {
  const resp = await fetch(`${API_BASE}/api/game/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, difficulty }),
  });
  return (await parseJsonOrThrow(resp)) as BackendStartResponse;
}

export async function submitBackendGuess(sessionId: string, guess: number): Promise<BackendGuessResponse> {
  const resp = await fetch(`${API_BASE}/api/game/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, guess }),
  });
  return (await parseJsonOrThrow(resp)) as BackendGuessResponse;
}

/** Grava a sessão no mesmo `data/sessions.json` que o programa em C usa (quando a API está no ar). */
export async function recordWebSession(s: Sessao): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/session/save`, {
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
  const resp = await fetch(`${API_BASE}/api/room/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, difficulty }),
  });
  return (await parseJsonOrThrow(resp)) as RoomCreateResponse;
}

export async function joinMultiplayerRoom(roomId: string, guest: string): Promise<{ ok: boolean; host: string }> {
  const resp = await fetch(`${API_BASE}/api/room/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId: roomId.trim().toUpperCase(), guest }),
  });
  return (await parseJsonOrThrow(resp)) as { ok: boolean; host: string };
}

export async function fetchRoomState(roomId: string): Promise<RoomState> {
  const q = encodeURIComponent(roomId.trim().toUpperCase());
  const resp = await fetch(`${API_BASE}/api/room/state?roomId=${q}`);
  return (await parseJsonOrThrow(resp)) as RoomState;
}

export async function submitRoomGuess(roomId: string, player: string, guess: number): Promise<RoomGuessResponse> {
  const resp = await fetch(`${API_BASE}/api/room/guess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId: roomId.trim().toUpperCase(), player, guess }),
  });
  return (await parseJsonOrThrow(resp)) as RoomGuessResponse;
}
