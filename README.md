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
- [Configuração de Ambiente](#configuração-de-ambiente)
- [API HTTP](#api-http)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contribuição](#contribuição)

---

## Destaques

- Quatro níveis de dificuldade com regras consistentes.
- Feedback temático em estilo terminal a cada tentativa.
- Modo diário e modo fantasma.
- Integração real entre front-end e API em C.
- Fallback local no front quando API estiver offline.
- Base pronta para evolução para multiplayer.

---

## Arquitetura

```text
Frontend (React/TSX) --> API HTTP (C) --> Lógica de jogo
         |                     |
         |                     --> Sessão em memória (sessionId)
         |
         --> UI, HUD, histórico, score e relatórios
```

Fluxo principal:
1. O front checa `GET /health`.
2. O jogador inicia partida via `POST /api/game/start`.
3. Cada palpite vai para `POST /api/game/guess`.
4. A API retorna estado, hint e finalização da sessão.

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

## Configuração de Ambiente

Por padrão, o front usa:

`http://localhost:8080`

Para apontar para outra URL, use `VITE_BACKEND_URL`.

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

---

## Roadmap

- Multiplayer com salas (`roomId`) e controle de turnos.
- Persistência real das sessões da API (SQLite/PostgreSQL).
- Ranking global consolidado no back-end.
- Autenticação de jogadores.
- Comunicação em tempo real com WebSocket.
- Testes automatizados (unitários e integração).
- Pipeline CI com build e validação automática.

---



