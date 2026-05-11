import type { Difficulty } from "@/lib/terminal-breach";

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
