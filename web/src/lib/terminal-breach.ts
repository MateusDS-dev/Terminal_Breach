// Faithful TS port of the C game logic.

export type Difficulty = "kiddie" | "analyst" | "operative" | "ghost";

export const DIFFICULTIES: { id: Difficulty; label: string; max: number; desc: string }[] = [
  { id: "kiddie",    label: "Script Kiddie", max: 0,  desc: "Tentativas ilimitadas" },
  { id: "analyst",   label: "Analista",      max: 10, desc: "10 tentativas" },
  { id: "operative", label: "Operativo",     max: 7,  desc: "7 tentativas" },
  { id: "ghost",     label: "Ghost",         max: 5,  desc: "5 tentativas" },
];

export function difficultyMax(d: Difficulty) {
  return DIFFICULTIES.find((x) => x.id === d)!.max;
}
export function difficultyLabel(d: Difficulty) {
  return DIFFICULTIES.find((x) => x.id === d)!.label;
}

// rating logic mirrored from game.c::calcular_rating
export function calcRating(tentativas: number, venceu: boolean): string {
  if (!venceu) return "Script Kiddie";
  if (tentativas <= 4) return "Ghost";
  if (tentativas <= 6) return "Operativo";
  if (tentativas === 7) return "Analista";
  return "Script Kiddie";
}

export function genSecret(): number {
  return Math.floor(Math.random() * 100) + 1;
}

export interface Sessao {
  jogador: string;
  dificuldade: string;
  segredo: number;
  tentativas: number;
  venceu: boolean;
  rating: string;
  timestamp: string;
  tempoMs?: number;
  modo?: "normal" | "daily";
}

const STORAGE_KEY = "terminal_breach_audit_log_v1";

export function loadSessions(): Sessao[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Sessao[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(s: Sessao) {
  const all = loadSessions();
  all.push(s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

// ---- Recursive stats (mirroring stats.c) ----
function sumRec(s: Sessao[], n: number): number {
  if (n <= 0) return 0;
  return s[n - 1].tentativas + sumRec(s, n - 1);
}
export function meanRec(s: Sessao[], n: number): number {
  if (n <= 0) return 0;
  return sumRec(s, n) / n;
}
function sumDevRec(s: Sessao[], n: number, mean: number): number {
  if (n <= 0) return 0;
  const d = s[n - 1].tentativas - mean;
  return d * d + sumDevRec(s, n - 1, mean);
}
export function varianceRec(s: Sessao[], n: number, mean: number): number {
  if (n <= 1) return 0;
  return sumDevRec(s, n, mean) / n;
}
export function stddevRec(s: Sessao[], n: number, mean: number): number {
  return Math.sqrt(varianceRec(s, n, mean));
}
export function bestIdxRec(s: Sessao[], n: number, best = -1): number {
  if (n <= 0) return best;
  const i = n - 1;
  if (s[i].venceu && (best < 0 || s[i].tentativas < s[best].tentativas)) best = i;
  return bestIdxRec(s, n - 1, best);
}
export function worstIdxRec(s: Sessao[], n: number, worst = -1): number {
  if (n <= 0) return worst;
  const i = n - 1;
  if (!s[i].venceu && (worst < 0 || s[i].tentativas > s[worst].tentativas)) worst = i;
  return worstIdxRec(s, n - 1, worst);
}
export function winsRec(s: Sessao[], n: number): number {
  if (n <= 0) return 0;
  return (s[n - 1].venceu ? 1 : 0) + winsRec(s, n - 1);
}

export const MAX_HIST = 15;
export function buildHistogram(list: Sessao[]) {
  const freq = new Array(MAX_HIST + 1).fill(0);
  for (const s of list) {
    if (s.tentativas >= 1 && s.tentativas <= MAX_HIST) freq[s.tentativas]++;
  }
  const max = Math.max(1, ...freq);
  return { freq, max };
}

// Strategy advisor (advisor.c style)
export function advisorTips(list: Sessao[]): string[] {
  const tips: string[] = [];
  if (list.length === 0) return tips;
  const wins = winsRec(list, list.length);
  const winRate = wins / list.length;
  const avg = meanRec(list, list.length);

  if (winRate < 0.4) tips.push("Taxa de invasão baixa — comece sempre testando 50 (centro do range).");
  if (avg > 7) tips.push("Você gasta muitas tentativas. Aplique busca binária: divida o intervalo ao meio.");
  if (avg <= 5 && wins > 0) tips.push("Excelente eficiência — considere subir para o nível Ghost.");
  if (list.slice(-3).every((s) => !s.venceu)) tips.push("Três falhas seguidas detectadas. Recalibre o range após cada feedback.");
  if (tips.length === 0) tips.push("Padrão estável. Continue dividindo o intervalo pela metade após cada dica.");
  return tips;
}

// ---- Ghost mode: recursive binary search with steps ----
export interface GhostStep { step: number; low: number; high: number; mid: number; result: "found" | "lower" | "higher" }

export function ghostSolve(secret: number): GhostStep[] {
  const steps: GhostStep[] = [];
  function rec(low: number, high: number, step: number) {
    if (low > high) return;
    const mid = Math.floor((low + high) / 2);
    if (mid === secret) { steps.push({ step, low, high, mid, result: "found" }); return; }
    if (mid < secret) { steps.push({ step, low, high, mid, result: "higher" }); rec(mid + 1, high, step + 1); }
    else { steps.push({ step, low, high, mid, result: "lower" }); rec(low, mid - 1, step + 1); }
  }
  rec(1, 100, 1);
  return steps;
}

export function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---- Composite scoring (memorable competitive metric) ----
// Multiplier per difficulty mirrors the C rules:
//   Kiddie (unlimited) is "training" → low weight
//   Analista 10 → x2, Operativo 7 → x3, Ghost 5 → x5
export function difficultyMultiplier(d: string): number {
  if (d === "Ghost") return 5;
  if (d === "Operativo") return 3;
  if (d === "Analista") return 2;
  return 1;
}

// Score = base(1000) * diffMult / max(1, attempts) - timePenalty
// Loss = 0. Encourages fewer attempts AND faster solves.
export function computeScore(s: Sessao): number {
  if (!s.venceu) return 0;
  const mult = difficultyMultiplier(s.dificuldade);
  const att = Math.max(1, s.tentativas);
  const tBonus = s.tempoMs ? Math.max(0, 200 - Math.floor(s.tempoMs / 250)) : 0;
  return Math.round((1000 * mult) / att) + tBonus;
}

export function totalScore(list: Sessao[]): number {
  return list.reduce((acc, s) => acc + computeScore(s), 0);
}

// ---- Streak (consecutive wins, most recent first) ----
export function currentStreak(list: Sessao[]): number {
  let n = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].venceu) n++;
    else break;
  }
  return n;
}

// ---- Daily challenge: deterministic seed of the day ----
// Same secret for every player on the same UTC day → fair leaderboard
export function dailySeed(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  // simple hash → 1..100
  let h = (y * 73856093) ^ (m * 19349663) ^ (d * 83492791);
  h = (h >>> 0) % 100;
  return h + 1;
}

export function dailyKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---- Educational: optimal attempts to guarantee any number in [low,high] ----
// = ceil(log2(range+1)). For 1..100 → 7.
export function optimalAttempts(low: number, high: number): number {
  return Math.ceil(Math.log2(high - low + 1 + 1e-9));
}

// Returns suggested "binary mid" given current known range
export function midOf(low: number, high: number): number {
  return Math.floor((low + high) / 2);
}

// Post-game lesson — short, didactic
export function postGameLesson(s: Sessao): string {
  const ideal = optimalAttempts(1, 100); // 7
  if (!s.venceu) {
    return `O algoritmo ótimo (busca binária) garante a invasão em até ${ideal} tentativas. Comece sempre pelo meio do intervalo (50) e divida o range pela metade após cada [SCAN]/[WARN].`;
  }
  if (s.tentativas <= 4) return `Performance Ghost: você convergiu em ${s.tentativas} passos. Limite teórico para 1..100 é ${ideal} — você superou a média humana.`;
  if (s.tentativas <= 7) return `Você atingiu o ótimo teórico (≤ ${ideal} tentativas). Isso é exatamente o que a busca binária garante. Tente o nível Ghost (5) para forçar precisão.`;
  return `Você venceu, mas acima do ótimo (${ideal}). Aplique busca binária: a cada feedback, descarte metade do intervalo restante.`;
}
