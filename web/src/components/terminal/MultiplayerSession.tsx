import { useEffect, useRef, useState } from "react";
import { Terminal, Line } from "@/components/terminal/Terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DIFFICULTIES,
  Difficulty,
  difficultyLabel,
  saveSession,
  nowTimestamp,
  calcRating,
} from "@/lib/terminal-breach";
import {
  createMultiplayerRoom,
  fetchRoomState,
  getApiBase,
  isBackendAvailable,
  joinMultiplayerRoom,
  submitRoomGuess,
  type RoomState,
} from "@/lib/backend-api";

interface Props {
  player: string;
  onExit: () => void;
}

type Phase = "lobby" | "pick_diff" | "waiting" | "battle" | "result";
type Role = "host" | "guest";

function slugToDifficulty(slug: string): Difficulty {
  const ids: Difficulty[] = ["kiddie", "analyst", "operative", "ghost"];
  return ids.includes(slug as Difficulty) ? (slug as Difficulty) : "operative";
}

export function MultiplayerSession({ player, onExit }: Props) {
  const [apiOk, setApiOk] = useState(false);
  const [apiProbeUrl, setApiProbeUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("lobby");
  const [role, setRole] = useState<Role>("host");
  const [roomId, setRoomId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("operative");
  const [joinCode, setJoinCode] = useState("");
  const [st, setSt] = useState<RoomState | null>(null);
  const [guess, setGuess] = useState("");
  const [err, setErr] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const savedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiProbeUrl(getApiBase());
    let cancelled = false;
    isBackendAvailable().then((ok) => {
      if (!cancelled) setApiOk(ok);
    });
    const t = window.setTimeout(() => {
      isBackendAvailable().then((ok) => {
        if (!cancelled) setApiOk(ok);
      });
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!roomId || phase === "result") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await fetchRoomState(roomId);
        if (cancelled) return;
        setSt(next);
        setPhase((p) => {
          if (next.finished) return "result";
          if (p === "waiting" && next.guestJoined) return "battle";
          return p;
        });
      } catch {
        if (!cancelled) setErr("Sem conexão com a API. Verifique se o back-end está rodando (--api).");
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 1200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomId, phase]);

  useEffect(() => {
    if (phase !== "battle" || !st?.guestJoined) return;
    inputRef.current?.focus();
  }, [phase, st?.guestJoined, st?.turn]);

  useEffect(() => {
    if (phase !== "result" || !st?.finished || st.secret == null) return;
    if (savedRef.current) return;
    savedRef.current = true;
    const diff = slugToDifficulty(st.difficulty);
    const myAttempts = role === "host" ? (st.attemptsHost ?? 0) : (st.attemptsGuest ?? 0);
    const victory = st.winner === player;
    saveSession({
      jogador: player,
      dificuldade: difficultyLabel(diff),
      segredo: st.secret,
      tentativas: myAttempts,
      venceu: victory,
      rating: calcRating(myAttempts, victory),
      timestamp: nowTimestamp(),
      modo: "pvp",
    });
  }, [phase, st, role, player]);

  async function onCreateRoom() {
    setErr("");
    try {
      const r = await createMultiplayerRoom(player, difficulty);
      setRoomId(r.roomId);
      setRole("host");
      setPhase("waiting");
      setLog([`[SYS] Sala ${r.roomId} criada. Pool máximo de palpites (dois jogadores): ${r.maxTotalGuesses}.`]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao criar sala");
    }
  }

  async function onJoinRoom() {
    setErr("");
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setErr("Informe o código da sala.");
      return;
    }
    try {
      await joinMultiplayerRoom(code, player);
      setRoomId(code);
      setRole("guest");
      setPhase("battle");
      setLog([`[SYS] Conectado à sala ${code}. Aguardando estado…`]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível entrar na sala");
    }
  }

  async function onSubmitGuess(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(guess, 10);
    setGuess("");
    if (isNaN(n) || n < 1 || n > 100) {
      setLog((l) => [...l, "[ERR] Palpite inválido (1–100)."]);
      return;
    }
    setErr("");
    try {
      const res = await submitRoomGuess(roomId, player, n);
      const hintText =
        res.hint === "lower" ? "acima do alvo" : res.hint === "higher" ? "abaixo do alvo" : "CORRETO";
      setLog((l) => [...l, `[${player}] palpite ${n} → ${hintText}`]);
      const next = await fetchRoomState(roomId);
      setSt(next);
      if (res.finished) setPhase("result");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      if (msg.includes("wrong_turn") || msg === "wrong_turn") {
        setLog((l) => [...l, "[SYS] Aguarde a vez do oponente."]);
      } else setErr(msg);
    }
  }

  const myTurn =
    st &&
    st.guestJoined &&
    !st.finished &&
    ((role === "host" && st.turn === "host") || (role === "guest" && st.turn === "guest"));

  if (!apiOk) {
    return (
      <Terminal title="MULTIPLAYER // OFFLINE" status="API INDISPONÍVEL">
        <Line tag="ERR">O modo PvP exige o back-end com `terminal_breach --api`.</Line>
        <Line tag="SYS">
          O front tenta, nesta ordem: URL configurada / mesmo IP:8080 / <span className="text-primary">127.0.0.1:8080</span> /{" "}
          <span className="text-primary">localhost:8080</span> — o que responder <span className="text-primary">/health</span>{" "}
          fica em cache.
        </Line>
        <Line tag="SYS">
          Última base usada na UI: <span className="text-accent">{apiProbeUrl || getApiBase()}</span> — abra{" "}
          <span className="text-primary">/health</span> nesse host no navegador (se falhar, a API não está escutando ou a porta não é 8080).
        </Line>
        <Line tag="SYS">
          No PC: rode <span className="text-primary">terminal_breach.exe --api 8080</span> na pasta do executável e confira se aparece “ouvindo em localhost:8080”.
        </Line>
        <div className="mt-6">
          <Button variant="outline" onClick={onExit}>
            ← Menu
          </Button>
        </div>
      </Terminal>
    );
  }

  if (phase === "lobby") {
    return (
      <Terminal title="MULTIPLAYER // PVP" status="SALAS HTTP">
        <Line tag="SYS">Dois operadores, mesmo firewall, turnos alternados. Quem acerta o código primeiro vence.</Line>
        <Line tag="EDU" tone="accent" className="mt-2">
          O servidor grava o resultado em <span className="text-primary text-glow">data/sessions.json</span> (igual ao jogo em C).
        </Line>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="bg-primary text-primary-foreground font-bold" onClick={() => setPhase("pick_diff")}>
            Criar sala
          </Button>
          <Button variant="outline" onClick={() => { setRole("guest"); setPhase("battle"); setRoomId(""); setLog([]); }}>
            Entrar com código
          </Button>
        </div>
        <div className="mt-6">
          <Button variant="ghost" onClick={onExit} className="text-muted-foreground hover:text-primary">
            ← Menu
          </Button>
        </div>
      </Terminal>
    );
  }

  if (phase === "pick_diff") {
    return (
      <Terminal title="CRIAR_SALA" status={`OP: ${player}`}>
        <Line tag="SYS">Escolha o nível da sala (afeta limite de palpites combinados):</Line>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={`text-left rounded-md border p-3 transition-all ${
                difficulty === d.id ? "border-primary bg-primary/10" : "border-border bg-black/30"
              }`}
            >
              <span className="text-primary text-glow font-bold">{d.label}</span>
              <div className="text-xs text-muted-foreground mt-1">{d.desc}</div>
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="font-bold" onClick={() => void onCreateRoom()}>
            Gerar código da sala
          </Button>
          <Button variant="ghost" onClick={() => setPhase("lobby")}>
            Voltar
          </Button>
        </div>
        {err && <Line tag="ERR" tone="destructive" className="mt-4">{err}</Line>}
      </Terminal>
    );
  }

  if (phase === "waiting") {
    return (
      <Terminal title="AGUARDANDO_OPONENTE" status={`SALA ${roomId}`}>
        <Line tag="SYS">Envie este código para o segundo jogador:</Line>
        <div className="mt-3 text-3xl font-bold text-accent text-glow tracking-[0.3em]">{roomId}</div>
        <Line tag="SCAN" tone="info" className="mt-4">
          Dificuldade: {difficultyLabel(difficulty)} · O oponente deve usar “Entrar com código” no menu PvP.
        </Line>
        {log.map((line, i) => (
          <Line key={i} tag="LOG" tone="muted" className="text-xs mt-1">{line}</Line>
        ))}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => { setRoomId(""); setPhase("lobby"); setLog([]); }}>
            Cancelar
          </Button>
          <Button variant="ghost" onClick={onExit}>
            ← Menu
          </Button>
        </div>
      </Terminal>
    );
  }

  /* Guest join sub-flow: entered lobby "Entrar" — roomId empty until join */
  if (phase === "battle" && role === "guest" && !roomId) {
    return (
      <Terminal title="ENTRAR_NA_SALA" status={`OP: ${player}`}>
        <Line tag="SYS">Digite o código de 6 caracteres exibido na tela do host.</Line>
        <div className="mt-4 flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ex: A1B2C3"
            maxLength={8}
            className="font-mono uppercase tracking-widest"
          />
          <Button className="font-bold shrink-0" onClick={() => void onJoinRoom()}>
            Conectar
          </Button>
        </div>
        {err && <Line tag="ERR" tone="destructive" className="mt-4">{err}</Line>}
        <div className="mt-6">
          <Button variant="ghost" onClick={() => { setPhase("lobby"); setErr(""); }}>
            ← Voltar
          </Button>
        </div>
      </Terminal>
    );
  }

  if (phase === "result" && st?.finished) {
    const victory = st.winner === player;
    const draw = !st.winner;
    return (
      <Terminal title="PVP // RESULTADO" status={victory ? "VITÓRIA" : draw ? "EMPATE" : "DERROTA"}>
        <Line tag="SYS">Sala {st.roomId} encerrada.</Line>
        {!draw && <Line tag="ACC" tone="success">Vencedor: {st.winner}</Line>}
        {draw && <Line tag="FAIL" tone="destructive">Ninguém acertou a tempo — pool de palpites esgotado.</Line>}
        <Line tag="SYS">Código: {st.secret}</Line>
        <Line tag="SYS">
          Tentativas — {st.host}: {st.attemptsHost ?? 0} · {st.guest}: {st.attemptsGuest ?? 0}
        </Line>
        <Line tag="SYS" tone="accent" className="mt-2">
          Sua sessão foi salva no navegador e no servidor (se a API gravou em data/sessions.json).
        </Line>
        <div className="mt-6 flex gap-3">
          <Button
            className="font-bold"
            onClick={() => {
              savedRef.current = false;
              setRoomId("");
              setSt(null);
              setPhase("lobby");
              setLog([]);
              setErr("");
            }}
          >
            Nova sala
          </Button>
          <Button variant="outline" onClick={onExit}>
            ← Menu
          </Button>
        </div>
      </Terminal>
    );
  }

  /* battle (host after guest joined, or guest after join) */
  return (
    <Terminal title={`PVP // ${roomId}`} status={st ? `TURNO: ${String(st.turn).toUpperCase()}` : "SYNC"}>
      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
        {st?.host} vs {st?.guest || "…"} · palpites {st?.totalGuesses ?? 0}/{st?.maxTotalGuesses ?? "?"}
      </div>
      {st && st.lastGuess > 0 && (
        <Line tag="SCAN" tone="info">
          Último palpite: {st.lastGuess} → {st.lastHint}
        </Line>
      )}
      {myTurn ? (
        <Line tag="SYS" tone="success" className="mt-2">
          Sua vez — envie um número (1–100).
        </Line>
      ) : (
        <Line tag="WARN" tone="warn" className="mt-2">
          Aguardando oponente…
        </Line>
      )}
      <div className="mt-3 max-h-32 overflow-y-auto space-y-0.5">
        {log.slice(-12).map((line, i) => (
          <div key={i} className="text-xs font-mono text-foreground/80">{line}</div>
        ))}
      </div>
      <form onSubmit={(e) => void onSubmitGuess(e)} className="mt-4 flex gap-2 border-t border-border pt-4">
        <Input
          ref={inputRef}
          type="number"
          min={1}
          max={100}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={!myTurn}
          placeholder="1–100"
          className="font-mono"
        />
        <Button type="submit" disabled={!myTurn} className="font-bold shrink-0">
          Enviar
        </Button>
      </form>
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={onExit}>
          Sair (abandona visualmente; sala continua no servidor)
        </Button>
      </div>
    </Terminal>
  );
}
