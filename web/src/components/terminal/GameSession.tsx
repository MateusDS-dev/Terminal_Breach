import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal, Line } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DIFFICULTIES,
  Difficulty,
  difficultyLabel,
  difficultyMax,
  calcRating,
  genSecret,
  saveSession,
  nowTimestamp,
  Sessao,
  computeScore,
  postGameLesson,
  optimalAttempts,
  midOf,
  dailySeed,
} from "@/lib/terminal-breach";

interface Props {
  player: string;
  onExit: () => void;
  daily?: boolean;
}

interface Feedback {
  type: "info" | "warn" | "scan" | "success" | "fail" | "err";
  text: string;
}

export function GameSession({ player, onExit, daily = false }: Props) {
  const [phase, setPhase] = useState<"select" | "playing" | "result">(daily ? "playing" : "select");
  const [difficulty, setDifficulty] = useState<Difficulty>(daily ? "operative" : "operative");
  const [secret, setSecret] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [history, setHistory] = useState<Feedback[]>([]);
  const [guess, setGuess] = useState("");
  const [won, setWon] = useState(false);
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(100);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalSession, setFinalSession] = useState<Sessao | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const max = difficultyMax(difficulty);
  const remaining = max > 0 ? Math.max(0, max - attempts) : Infinity;
  const suggestedMid = useMemo(() => midOf(low, high), [low, high]);

  // Auto-start in daily mode
  useEffect(() => {
    if (daily && phase === "playing" && secret === 0) {
      startGame("operative", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live timer
  useEffect(() => {
    if (phase !== "playing" || !startedAt) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  function startGame(d: Difficulty, isDaily = false) {
    setDifficulty(d);
    const sec = isDaily ? dailySeed() : genSecret();
    setSecret(sec);
    setAttempts(0);
    setWon(false);
    setLow(1);
    setHigh(100);
    setStartedAt(Date.now());
    setElapsed(0);
    setHistory([
      { type: "info", text: isDaily ? `>> DESAFIO DIÁRIO :: seed do dia carregado` : `Firewall ativo. Nível: ${difficultyLabel(d)}` },
      { type: "info", text: difficultyMax(d) > 0 ? `Tentativas disponíveis: ${difficultyMax(d)} · Ótimo teórico: ${optimalAttempts(1, 100)} (busca binária)` : `Tentativas ilimitadas · Treino livre` },
      { type: "scan", text: `Range inicial: [1 — 100]. Sugestão estratégica: comece por 50.` },
    ]);
    setPhase("playing");
  }

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(guess, 10);
    setGuess("");
    if (isNaN(n) || n < 1 || n > 100) {
      setHistory((h) => [...h, { type: "err", text: "Entrada inválida. Digite um número de 1 a 100." }]);
      return;
    }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (n === secret) {
      setHistory((h) => [
        ...h,
        { type: "info", text: `Tentativa ${newAttempts}: ${n}` },
        { type: "success", text: `ACESSO CONCEDIDO. Código correto: ${secret}` },
      ]);
      finalize(newAttempts, true);
      return;
    }

    // Update visible range based on feedback
    if (n > secret) {
      setHigh((h) => Math.min(h, n - 1));
    } else {
      setLow((l) => Math.max(l, n + 1));
    }

    const hint: Feedback = n > secret
      ? { type: "warn", text: `Porta acima do alvo. Recuando no range...` }
      : { type: "scan", text: `Código abaixo. Scanning porta superior...` };

    setHistory((h) => [...h, { type: "info", text: `Tentativa ${newAttempts}: ${n}` }, hint]);

    if (max > 0 && newAttempts >= max) {
      setHistory((h) => [...h, { type: "fail", text: `FIREWALL ATIVO. ACESSO NEGADO. Código era: ${secret}` }]);
      finalize(newAttempts, false);
    }
  }

  function finalize(att: number, victory: boolean) {
    const tempoMs = Date.now() - startedAt;
    const sessao: Sessao = {
      jogador: player,
      dificuldade: difficultyLabel(difficulty),
      segredo: secret,
      tentativas: att,
      venceu: victory,
      rating: calcRating(att, victory),
      timestamp: nowTimestamp(),
      tempoMs,
      modo: daily ? "daily" : "normal",
    };
    saveSession(sessao);
    setFinalSession(sessao);
    setWon(victory);
    setTimeout(() => setPhase("result"), 700);
  }

  if (phase === "select") {
    return (
      <Terminal title="SELECT_FIREWALL_LEVEL" status="OPERADOR: AUTENTICADO">
        <Line tag="SYS">Selecione o nível de firewall a ser invadido:</Line>
        <Line tag="EDU" tone="accent" className="mt-1">Dica: o ótimo teórico para 1..100 é <span className="text-primary text-glow">7 tentativas</span> (log₂(100)). Ghost exige perfeição.</Line>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {DIFFICULTIES.map((d, i) => {
            const mult = d.id === "ghost" ? "×5" : d.id === "operative" ? "×3" : d.id === "analyst" ? "×2" : "×1";
            return (
              <button
                key={d.id}
                onClick={() => startGame(d.id)}
                className="group text-left rounded-md border border-border bg-black/40 hover:bg-primary/5 hover:border-primary transition-all p-4 hover:translate-x-1 duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-primary text-glow font-bold tracking-wider">
                    &gt; {i + 1}. {d.label}
                  </span>
                  <span className="text-[10px] text-accent border border-accent/40 rounded px-1.5 py-0.5">SCORE {mult}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground group-hover:text-foreground/80">{d.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onExit} className="text-muted-foreground hover:text-primary">
            ← Voltar
          </Button>
        </div>
      </Terminal>
    );
  }

  if (phase === "playing") {
    const rangeSpan = 100;
    const rangeWidth = ((high - low + 1) / rangeSpan) * 100;
    const rangeLeft = ((low - 1) / rangeSpan) * 100;
    const midPct = ((suggestedMid - 1) / (rangeSpan - 1)) * 100;
    const seconds = (elapsed / 1000).toFixed(1);

    return (
      <Terminal
        title={`SESSION // ${difficultyLabel(difficulty).toUpperCase()}${daily ? " // DAILY" : ""}`}
        status={`${max > 0 ? `${remaining} RESTANTES` : "ILIMITADO"} · ${seconds}s`}
      >
        {/* HUD: Range visual + sugestão */}
        <div className="mb-4 rounded-md border border-border bg-black/40 p-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            <span>Range ativo</span>
            <span>
              <span className="text-accent text-glow">{low}</span>
              <span className="mx-1 text-border">—</span>
              <span className="text-accent text-glow">{high}</span>
              <span className="ml-3 text-muted-foreground">|</span>
              <span className="ml-3 text-warn">mid sugerido: <span className="text-glow font-bold">{suggestedMid}</span></span>
            </span>
          </div>
          <div className="relative h-2.5 bg-input rounded-full overflow-hidden border border-border/60">
            <div
              className="absolute top-0 bottom-0 scan-bar"
              style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-warn"
              style={{ left: `${midPct}%`, boxShadow: "0 0 6px var(--color-warn)" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">
            <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>

        <div ref={scrollRef} className="max-h-[40vh] overflow-y-auto pr-2 space-y-1.5">
          {history.map((h, idx) => {
            const map = {
              info: { tag: "SYS", tone: "primary" as const },
              warn: { tag: "WARN", tone: "warn" as const },
              scan: { tag: "SCAN", tone: "info" as const },
              success: { tag: "ACC", tone: "success" as const },
              fail: { tag: "FAIL", tone: "destructive" as const },
              err: { tag: "ERR", tone: "destructive" as const },
            };
            const cfg = map[h.type];
            return <Line key={idx} tag={cfg.tag} tone={cfg.tone}>{h.text}</Line>;
          })}
        </div>
        <form onSubmit={submitGuess} className="mt-5 flex items-center gap-3 border-t border-border pt-4">
          <span className="text-primary text-glow shrink-0">root@breach:~#</span>
          <Input
            ref={inputRef}
            type="number"
            min={1}
            max={100}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={`código (1-100) · sugestão: ${suggestedMid}`}
            className="flex-1 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground font-mono"
            autoFocus
          />
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/85 text-glow font-bold">
            INJECT ▶
          </Button>
        </form>
      </Terminal>
    );
  }

  // result
  const score = finalSession ? computeScore(finalSession) : 0;
  const lesson = finalSession ? postGameLesson(finalSession) : "";
  const totalSec = finalSession?.tempoMs ? (finalSession.tempoMs / 1000).toFixed(1) : "0";

  return (
    <Terminal title="SESSION_REPORT" status={won ? "ACESSO CONCEDIDO" : "ACESSO NEGADO"}>
      <div className="animate-fadein">
        <pre className={`text-xs sm:text-sm leading-tight ${won ? "text-primary text-glow-strong" : "text-destructive text-glow-strong"} whitespace-pre`}>
{won
  ? `+==========================================+
|  [ACC] ACESSO CONCEDIDO                  |
+==========================================+`
  : `+==========================================+
|  [FAIL] FIREWALL ATIVO. ACESSO NEGADO    |
+==========================================+`}
        </pre>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Stat label="Operador" value={player} />
          <Stat label="Nível" value={difficultyLabel(difficulty)} />
          <Stat label="Código" value={String(secret)} />
          <Stat label="Tentativas" value={`${attempts}${max > 0 ? ` / ${max}` : ""}`} />
          <Stat label="Tempo" value={`${totalSec}s`} />
          <Stat label="Rating" value={calcRating(attempts, won)} highlight />
          <Stat label="Score" value={String(score)} highlight />
          <Stat label="Status" value={won ? "BREACH OK" : "FALHA"} highlight />
        </div>

        <div className="mt-5 rounded-md border border-accent/40 bg-accent/5 p-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-accent text-glow mb-1">[ Lição do Algoritmo ]</div>
          <p className="text-sm text-foreground/95 leading-relaxed">{lesson}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!daily && (
            <Button onClick={() => setPhase("select")} className="bg-primary text-primary-foreground hover:bg-primary/85 font-bold">
              ▶ Nova invasão
            </Button>
          )}
          <Button variant="outline" onClick={onExit} className="border-border hover:bg-secondary">
            ← Menu principal
          </Button>
        </div>
      </div>
    </Terminal>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-b border-dashed border-border/60 py-1.5">
      <span className="text-muted-foreground uppercase text-xs tracking-widest">{label}</span>
      <span className={highlight ? "text-accent text-glow font-bold" : "text-foreground"}>{value}</span>
    </div>
  );
}
