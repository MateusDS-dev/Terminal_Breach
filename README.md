# Terminal Breach

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Backend](https://img.shields.io/badge/backend-C-blue)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TSX-61dafb)
![Build](https://img.shields.io/badge/build-local-informational)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

Terminal Breach é um jogo com tema hacker que combina experiência retrô de terminal com interface moderna web.  
O projeto foi estruturado em duas camadas, com comunicação real entre front-end e back-end:

- **Back-end em C**: regras do jogo, cálculo de resultado e API HTTP.
- **Front-end em React + TSX**: experiência visual, HUD, fluxo de partidas e relatórios.

---

## Sumário

- [Destaques](#destaques)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Como Executar](#como-executar)
  - [Back-end (C)](#back-end-c)
  - [Front-end (React + TSX)](#front-end-react--tsx)
  - [Validação da Integração](#validação-da-integração)
- [Testar como jogo online (LAN e internet)](#testar-como-jogo-online-lan-e-internet)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [API HTTP](#api-http)
- [Troubleshooting](#troubleshooting)

---

## Destaques

- Quatro níveis de dificuldade com regras consistentes.
- Feedback temático em estilo terminal a cada tentativa.
- Modo diário e modo fantasma.
- Integração real entre front-end e API em C.
- Fallback local no front quando API estiver offline.
- **Multiplayer (PvP)** por código de sala: turnos alternados no mesmo segredo (menu “Multiplayer”).
- **Persistência**: ao terminar partidas na web, a API pode gravar em `data/sessions.json` (mesmo arquivo do modo terminal), via `POST /api/session/save`.

---

## Arquitetura

```text
Frontend (React/TSX) --> API HTTP (C) --> Lógica de jogo
         |                     |
         |                     --> Sessão em memória (sessionId)
         |
         --> UI, HUD, histórico, score e relatórios
```

Fluxo principal (solo na web):
1. O front checa `GET /health`.
2. O jogador inicia partida via `POST /api/game/start`.
3. Cada palpite vai para `POST /api/game/guess`.
4. Ao encerrar, o front pode enviar `POST /api/session/save` para anexar a sessão em `data/sessions.json`.

Fluxo **PvP** (dois jogadores):
1. Host: `POST /api/room/create` → recebe `roomId`.
2. Convidado: `POST /api/room/join` com o código.
3. Ambos consultam `GET /api/room/state?roomId=...` (polling) e enviam `POST /api/room/guess` na sua vez.
4. Ao fim, o servidor grava o resultado em `data/sessions.json` (vitória ou duas derrotas em caso de empate por esgotamento).

---

## Stack Tecnológica

| Camada | Tecnologia | Objetivo |
|---|---|---|
| Back-end | C (C11) | Regras centrais e API HTTP |
| Build C | Makefile | Compilação e organização de alvo |
| Front-end | React + TypeScript (TSX) | Interface de jogo |
| Bundler | Vite | Desenvolvimento e build |
| Runtime JS | Node.js | Execução do front |

---

## Estrutura do Projeto

```text
Terminal_Breach/
|- include/                    # Headers C
|- src/                        # Implementações C (jogo, stats, API, etc.)
|- data/                       # Dados de sessões
|- web/                        # Front-end React + TSX
|  |- src/
|  |- package.json
|- Makefile                    # Build principal do back-end
|- compilar.bat                # Atalho de compilação no Windows
|- README.md
```

---

## Pré-requisitos

### Back-end (C)
- GCC (MinGW/MSYS2 no Windows; GCC nativo no Linux/macOS)
- GNU Make (ou `mingw32-make` no Windows)

### Front-end (React + TSX)
- Node.js 18+ (recomendado: 20+)
- npm

---

## Como Executar

### Back-end (C)

Na raiz do projeto:

```bash
make
```

Se estiver no Windows e `make` não existir:

```powershell
mingw32-make
```

Executar API HTTP:

```bash
./terminal_breach --api 8080
```

No PowerShell:

```powershell
.\terminal_breach.exe --api 8080
```

Executar jogo em terminal (modo clássico):

```bash
./terminal_breach
```

Executar modo fantasma:

```bash
./terminal_breach --ghost
```

---

### Front-end (React + TSX)

Dentro da pasta `web`:

```bash
cd web
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

---

### Validação da Integração

1. Inicie a API C com `--api`.
2. Inicie o front com `npm run dev`.
3. Abra o app no navegador.
4. Inicie uma partida.
5. Confirme no HUD que a API foi detectada e as tentativas estão sendo validadas.

---

## Testar como jogo online (LAN e internet)

### Mesma rede (Wi‑Fi / LAN) — “online em casa”

1. No PC que roda a API: `terminal_breach.exe --api 8080` (a API já escuta em todas as interfaces, `0.0.0.0`).
2. Inicie o front com host exposto: `npm run dev -- --host` (o Vite mostra o endereço **Network**, ex.: `http://192.168.0.10:5173`).
3. No **Windows**, libere `terminal_breach.exe` no firewall para **rede privada** (porta **8080**).
4. No celular ou outro PC, abra o mesmo URL **Network** do Vite. O front chama a API em **`http://<mesmo-IP>:8080`** automaticamente.
5. Multiplayer: um jogador cria a sala no aparelho A; o outro entra com o código no aparelho B.

### Pela internet (sem hospedar em servidor) — túnel

Use um túnel HTTPS até a sua máquina e aponte o front para a URL pública da **API**.

1. Instale [ngrok](https://ngrok.com/) ou use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).
2. Com a API rodando em `8080`, exponha essa porta, por exemplo: `ngrok http 8080`.
3. Copie a URL HTTPS gerada (ex.: `https://abcd-12.ngrok-free.app`).
4. No projeto `web/`, crie `.env.local`:

```env
VITE_BACKEND_URL=https://abcd-12.ngrok-free.app
```

5. Reinicie `npm run dev`. O jogo e o multiplayer passam a usar essa API “na nuvem”.
6. Para o amigo abrir o **front** pela internet, você pode:
   - rodar **outro** túnel na porta do Vite (`5173`) e enviar esse link; ou
   - publicar o `dist/` em qualquer hospedagem estática e manter `VITE_BACKEND_URL` apontando para o ngrok da API (rebuild após mudar a env).

**Nota:** URLs de túnel mudam a cada execução no plano gratuito; atualize `.env.local` quando mudar.

---

## Configuração de Ambiente

Em **`npm run dev`** (sem `VITE_BACKEND_URL`), o Vite faz **proxy** de `/health` e `/api/*` para `http://127.0.0.1:8080`. O browser fala só com o Vite (mesma origem), o que evita CORS e o problema em que **`localhost:8080` não é o seu programa C** (muito comum quando `localhost` resolve para **IPv6** `::1` e outro serviço responde com “404 Page Not Found”, enquanto **`127.0.0.1:8080`** funciona).

Fora do dev (ou com `VITE_BACKEND_URL` definida), o front usa o IP da página + `:8080` na LAN, ou **`http://127.0.0.1:8080`** como padrão em `localhost` nunca assume que `http://localhost:8080` é a API C.

Para forçar uma URL fixa (túnel, outro PC, Docker), use `VITE_BACKEND_URL`.

Linux/macOS:

```bash
export VITE_BACKEND_URL="http://localhost:8080"
npm run dev
```

Windows PowerShell:

```powershell
$env:VITE_BACKEND_URL="http://localhost:8080"
npm run dev
```

---

## API HTTP

### `GET /health`

Resposta:

```json
{ "ok": true }
```

### `POST /api/game/start`

Body:

```json
{ "player": "neo", "difficulty": "operative" }
```

Resposta (exemplo):

```json
{ "sessionId": "663f5fcd-00000001", "maxAttempts": 7 }
```

### `POST /api/game/guess`

Body:

```json
{ "sessionId": "663f5fcd-00000001", "guess": 42 }
```

Resposta (exemplo):

```json
{
  "attempts": 2,
  "won": false,
  "finished": false,
  "hint": "higher"
}
```

Quando a partida termina, a resposta pode incluir `secret` e `rating`.

### `POST /api/session/save`

Persiste uma sessão no arquivo `data/sessions.json` (reutiliza `db_salvar_sessao`).

Body (exemplo):

```json
{
  "jogador": "neo",
  "dificuldade": "Operativo",
  "segredo": 42,
  "tentativas": 5,
  "venceu": true,
  "rating": "Ghost",
  "timestamp": "2026-05-11 14:30:00"
}
```

### Multiplayer — salas

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/api/room/create` | Body: `{ "host": "nome", "difficulty": "operative" }` → `{ "roomId", "maxTotalGuesses", "maxAttempts" }` |
| `POST` | `/api/room/join` | Body: `{ "roomId": "ABC123", "guest": "nome" }` |
| `GET` | `/api/room/state?roomId=ABC123` | Estado da sala (turno, último palpite, `finished`, etc.) |
| `POST` | `/api/room/guess` | Body: `{ "roomId", "player", "guess" }` — só na vez do jogador |

Regras resumidas: **mesmo segredo** para os dois; **turnos alternados**; limite combinado de palpites (`2 × maxAttempts` do nível, ou 40 no estilo “ilimitado” da sala).

---

## Troubleshooting

- **`gcc` não encontrado**: instale MinGW/MSYS2 e adicione o binário ao `PATH`.
- **`make` não encontrado**: use `mingw32-make` no Windows ou instale GNU Make.
- **Front não conecta na API**:
  - confirme que a API está ativa na porta esperada;
  - valide `GET /health` no navegador ou via curl;
  - revise `VITE_BACKEND_URL`.
- **Porta em uso**: rode API em outra porta, ex.: `--api 8090`, e ajuste `VITE_BACKEND_URL`.
- **CORS**: a API já possui cabeçalhos de CORS para desenvolvimento local.
- **`method_not_allowed` ao abrir `http://IP:8080/`**: em versões antigas da API, GET fora de `/health` respondia 405; atualize o binário ou use `http://IP:8080/health` para testar.
- **Multiplayer diz que a API está off**: confirme `http://SEU_IP:8080/health` no navegador do **mesmo** dispositivo que abre o jogo; no Windows, libere o `terminal_breach.exe` no firewall (rede privada).
- **`localhost:8080/health` dá 404 e `127.0.0.1:8080/health` funciona**: outro programa está escutando em **IPv6** (`::1`) na porta 8080; use `127.0.0.1` ou o proxy do Vite em dev (já configurado no `vite.config.ts`).

---



