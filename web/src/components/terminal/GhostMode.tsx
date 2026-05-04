import { useEffect, useState } from "react";
import { Terminal, Line } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import {
  GhostStep,
  ghostSolve,
  genSecret,
  saveSession,
  nowTimestamp,
  calcRating,
} from "@/lib/terminal-breach";

export function GhostMode({ onBack }: { onBack: () => void }) {
  const [secret, setSecret] = useState(0);
  const [steps, setSteps] = useState<GhostStep[]>([]);
  const [shown, setShown] = useState<GhostStep[]>([]);
  const [done, setDone] = useState(false);

  function start() {
    const sec = genSecret();
    const all = ghostSolve(sec);
    setSecret(sec);
    setSteps(all);
    setShown([]);
    setDone(false);
  }

  useEffect(() => { start(); }, []);

  useEffect(() => {
    if (steps.length === 0) return;
    if (shown.length >= steps.length) {
      setDone(true);
      const passos = steps.length;
      saveSession({
        jogador: "GHOST_BOT",
        dificuldade: "Ghost",
        segredo: secret,
        tentativas: passos,
        venceu: true,
        rating: calcRating(passos, true),
        timestamp: nowTimestamp(),
      });
      return;
    }
    const t = setTimeout(() => setShown((s) => [...s, steps[s.length]]), 550);
    return () => clearTimeout(t);
  }, [steps, shown, secret]);

  const passos = steps.length;
  let eficiencia = "FRACA (Script Kiddie)";
  if (passos <= 4) eficiencia = "ÓTIMA (Ghost)";
  else if (passos <= 6) eficiencia = "BOA (Operativo)";
  else if (passos === 7) eficiencia = "OK (Analista)";

  return (
    <Terminal title="GHOST_MODE // BINARY_SEARCH" status="EXECUÇÃO AUTOMÁTICA">
      <Line tag="GHOST" tone="accent">Modo Fantasma ativado. Resolução automática por busca binária recursiva.</Line>
      <Line tag="GHOST">Número secreto gerado. Iniciando invasão silenciosa...</Line>

      <div className="mt-4 space-y-1">
        {shown.map((s) => (
          <div key={s.step} className="animate-typeline font-mono text-sm">
            <span className="text-accent text-glow">[GHOST]</span>{" "}
            <span className="text-muted-foreground">Passo {String(s.step).padStart(2, "0")}</span>{" | "}
            <span className="text-info">Range [{s.low}–{s.high}]</span>{" | "}
            <span className="text-primary">Testando: {s.mid}</span>{" "}
            {s.result === "found" && <span className="text-primary text-glow">→ MATCH ✓</span>}
            {s.result === "higher" && <span className="text-warn">→ subir</span>}
            {s.result === "lower" && <span className="text-warn">→ descer</span>}
          </div>
        ))}
      </div>

      {done && (
        <div className="mt-6 animate-fadein">
          <pre className="text-primary text-glow text-xs sm:text-sm whitespace-pre">
{`+==================================================+
|  [GHOST] BREACH COMPLETO em ${String(passos).padEnd(2)} passo(s)              |
+==================================================+`}
          </pre>
          <div className="mt-3 grid gap-1 text-sm">
            <div><span className="text-muted-foreground">Código descoberto:</span> <span className="text-primary text-glow">{secret}</span></div>
            <div><span className="text-muted-foreground">Eficiência:</span> <span className="text-accent text-glow">{eficiencia}</span></div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button onClick={start} className="bg-primary text-primary-foreground hover:bg-primary/85">↻ Re-executar</Button>
            <Button variant="outline" onClick={onBack} className="border-border">← Menu</Button>
          </div>
        </div>
      )}
    </Terminal>
  );
}
