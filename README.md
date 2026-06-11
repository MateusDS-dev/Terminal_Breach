# 🎮💻 Terminal Breach

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Backend](https://img.shields.io/badge/backend-C-blue)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TSX-61dafb)
![Build](https://img.shields.io/badge/build-local-informational)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

> Jogo de adivinhação com narrativa hacker, análise estatística, multiplayer e integração completa entre front-end web e back-end em C.

---

# 📚 Índice

* [🎮 Sobre o Projeto](#-sobre-o-projeto)
* [🏗️ Arquitetura do Sistema](#️-arquitetura-do-sistema)
* [⚙️ Funcionalidades](#️-funcionalidades)
* [🗂️ Estrutura do Projeto](#️-estrutura-do-projeto)
* [🚀 Como Executar](#-como-executar)
* [🗓️ Sprint da Entrega 03](#️-sprint-da-entrega-03)
* [🔄 Controle de Versionamento](#-controle-de-versionamento)
* [👥 Equipe](#-equipe)
* [📌 Backlog](#-backlog--histórias-de-usuário-detalhado)
* [📸 Board](#-board-do-projeto)
* [🐞 Issues](#-issue--bug-tracker)
* [🌐 API HTTP](#-api-http)
* [🧪 Testes](#-testes-de-sistema)
* [🧪 Testes de Integração](#-testes-de-integração)
* [👥 Programação em Par](#-programação-em-par)
* [📱 Protótipo](#-protótipo-lo-fi-figma)
* [📝 Storyboards](#-sketches-e-storyboards)
* [🎥 Screencast](#-screencast-da-entrega-03)
* [🛠️ Troubleshooting](#️-troubleshooting)
* [📚 Observações Acadêmicas](#-observações-acadêmicas)

---

# 🎮💻 Sobre o Projeto

**Terminal Breach** é um jogo educativo desenvolvido como projeto acadêmico na CESAR School.

O jogador assume o papel de um hacker tentando descobrir o código de acesso de um servidor protegido por firewall. A cada tentativa, o sistema fornece feedback temático (scanning, intrusão, recuo), criando uma experiência imersiva.

O projeto foi estruturado em duas camadas:

* **Back-end em C**: lógica do jogo, estatísticas e API HTTP.
* **Front-end em React + TSX**: interface web moderna e experiência visual.

Ao final da sessão, o jogo gera um relatório contendo:

* 📊 Estatísticas de desempenho
* 🧠 Sugestões de estratégia
* 🏆 Rating personalizado

O projeto aborda:

* programação imperativa
* recursão
* manipulação de arquivos
* análise estatística
* comunicação HTTP
* integração front-end/back-end

---

# 🏗️ Arquitetura do Sistema

O sistema foi dividido em duas camadas principais.

## 🔹 Back-end em C

Responsável por:

* lógica principal do jogo
* geração do número secreto
* estatísticas
* API HTTP
* persistência de sessões
* multiplayer

## 🔹 Front-end em React + TSX

Responsável por:

* interface visual
* HUD do jogador
* menus
* histórico
* fluxo das partidas
* multiplayer online

## 🔄 Fluxo de Comunicação

```text
Frontend (React/TSX) --> API HTTP (C) --> Lógica do jogo
         |                     |
         |                     --> Sessões e persistência
         |
         --> Interface, HUD, histórico e score
```

Fluxo principal:

1. Front verifica `GET /health`
2. Sessão criada via `POST /api/game/start`
3. Tentativas via `POST /api/game/guess`
4. Sessão salva via `POST /api/session/save`

---

# ⚙️ Funcionalidades

* 🎲 Geração de número aleatório por sessão
* 🔁 Sistema de tentativas com feedback temático
* 🎯 Quatro níveis de dificuldade
* 📝 Registro automático em `audit_log.txt`
* 📊 Relatório estatístico
* 🧠 Estatísticas com recursão
* 💡 Sugestões de estratégia
* 🏆 Sistema de rating
* 📈 Leaderboard
* 👻 Modo Fantasma
* 🌐 API HTTP em C
* ⚛️ Front-end em React + TypeScript
* 🔄 Integração em tempo real
* 🧩 Multiplayer PvP
* 💾 Persistência em JSON
* 📡 Suporte LAN e internet
* 🛡️ Sistema fallback offline

---

# 🗂️ Estrutura do Projeto

```text
Terminal_Breach/
├── include/                    # Headers C
├── src/                        # Implementações C
├── data/                       # Dados das sessões
├── web/                        # Front-end React + TSX
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── board.png
│   ├── backlog.png
│   ├── issues.png
│   ├── teste1.png
│   ├── teste2.png
│   └── sprint.png
├── Makefile
├── compilar.bat
├── audit_log.txt
└── README.md
```

---

# 🚀 Como Executar

# 🔧 Pré-requisitos

## Back-end (C)

* GCC
* GNU Make

## Front-end (React + TSX)

* Node.js 18+
* npm

---

# ▶️ Executando o Back-end

## Compilar

Linux/macOS:

```bash
make
```

Windows:

```powershell
mingw32-make
```

## Executar API HTTP

Linux/macOS:

```bash
./terminal_breach --api 8080
```

Windows:

```powershell
.\terminal_breach.exe --api 8080
```

## Executar modo terminal

```bash
./terminal_breach
```

## Executar modo fantasma

```bash
./terminal_breach --ghost
```

---

# ⚛️ Executando o Front-end

Dentro da pasta `web`:

```bash
cd web
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

---

# 🔄 Validação da Integração

1. Inicie a API C com `--api`
2. Inicie o front-end com `npm run dev`
3. Abra o navegador
4. Inicie uma partida
5. Verifique integração entre HUD e API

---

# 🌐 Multiplayer Online

O projeto suporta partidas via:

* LAN
* Wi-Fi
* internet com túnel HTTPS

Recursos:

* criação de salas
* código de entrada
* turnos alternados
* sincronização em tempo real
* persistência de resultados

---

# 🗓️ Sprint da Entrega 03

A Sprint 01 foi criada utilizando GitHub Projects para gerenciamento das atividades.

Durante a sprint foram organizadas:

* histórias prioritárias
* responsáveis
* bugs
* validações
* progresso das tarefas

## 📸 Sprint Board

![Sprint](docs/board.png)

---

# 🔄 Controle de Versionamento

O projeto utilizou Git e GitHub como ambiente de versionamento.

Foram realizados commits frequentes durante a Sprint 01.

## 📌 Histórico de commits

https://github.com/MateusDS-dev/Terminal_Breach/commits/main

---

# 👥 Equipe

| Papel           | Nome                         | Responsabilidades                             |
| --------------- | ---------------------------- | --------------------------------------------- |
| 👑 Líder        | Rafael Medeiros Machado Dias | Coordenação geral, integração e modo fantasma |
| ⚙️ Back-end     | Cauã Henrique Melo Almeida   | RNG, API HTTP e logs                          |
| 🎨 Front-end    | João Felipe Bonifácio Barros | React, HUD e interface                        |
| 📊 Estatísticas | Luis Henrique Vilas Boas     | Recursão e métricas                           |
| 🧪 QA/Testes    | Mateus Henrique Diniz Silva  | Ranking, integração e testes                  |

---

# 📌 Backlog — Histórias de Usuário (Detalhado)

As histórias seguem o padrão:

* Cartão
* Conversa
* Confirmação

---

# 🔴 Prioridade 1 — MVP

## TB-01 · Geração de número aleatório

### Critérios

* Número entre 1 e 100
* Uso de `srand(time)`
* Validação correta

![diagram](docs/mermaid-diagram.png)

---

## TB-02 · Loop com dicas temáticas

### Critérios

* Feedback alto/baixo
* Tentativas restantes
* Encerramento correto

![diagram](docs/mermaid-diagram9.png)

---

## TB-07 · Níveis de dificuldade

### Critérios

* Script Kiddie
* Hacker
* Elite
* Ghost

![diagram](docs/mermaid-diagram5.png)

---

# 🟡 Prioridade 2

## TB-06 · Sugestões de estratégia

![diagram](docs/mermaid-diagram4.png)

---

## TB-08 · Sistema de rating

![diagram](docs/mermaid-diagram6.png)

---

# 🟢 Prioridade 3

## TB-03 · Registro em log

![diagram](docs/mermaid-diagram1.png)

---

## TB-04 · Média de desempenho

![diagram](docs/mermaid-diagram2.png)

---

## TB-05 · Estatísticas com recursão

![diagram](docs/mermaid-diagram3.png)

---

## TB-09 · Leaderboard

![diagram](docs/mermaid-diagram7.png)

---

# ⭐ Funcionalidade Extra

## TB-10 · Modo Fantasma

![diagram](docs/mermaid-diagram8.png)

---

# 📸 Board do Projeto

![Board](docs/board.png)

---

# 📸 Backlog Visual

![Backlog](docs/backlog1.png.jpeg)

---

# 🐞 Issue / Bug Tracker

Gerenciamento realizado com GitHub Issues.


---

# 🌐 API HTTP

## Endpoints principais

### `GET /health`

Verifica se a API está online.

### `POST /api/game/start`

Inicia uma sessão.

### `POST /api/game/guess`

Envia tentativa.

### `POST /api/session/save`

Salva sessões em JSON.

---

# 🧪 Testes de Sistema

| Funcionalidade         | Resultado |
| ---------------------- | --------- |
| Geração aleatória      | ✅ OK      |
| Sistema de dificuldade | ✅ OK      |
| Leaderboard            | ✅ OK      |
| Registro em log        | ✅ OK      |
| Relatório estatístico  | ✅ OK      |
| Modo Fantasma          | ✅ OK      |



---

# 🧪 Testes de Integração

| Teste                   | Resultado |
| ----------------------- | --------- |
| Comunicação Front ↔ API | ✅ OK      |
| Multiplayer             | ✅ OK      |
| Persistência JSON       | ✅ OK      |
| Endpoint `/health`      | ✅ OK      |
| Fallback offline        | ✅ OK      |

---

# 👥 Programação em Par

| Integrantes     | Funcionalidades        |
| --------------- | ---------------------- |
| Rafael + Cauã   | API HTTP e logs        |
| João + Luis     | Estatísticas           |
| Mateus + Rafael | Ranking e testes       |
| João + Mateus   | Front-end e integração |

Benefícios:

* revisão contínua
* redução de bugs
* compartilhamento de conhecimento

---

# 📱 Protótipo Lo-Fi (Figma)


---

# 📝 Sketches e Storyboards

## 🎮 Tela Inicial

![TB-01](docs/telainicial1.png)

---

## 🎮 Seleção de Dificuldade

![TB-01](docs/tela2.png)

---

## 🎮 Tela de Tentativa

![TB-01](docs/tela3.png)

---

## 🎮 Feedback

![TB-01](docs/tela4.png)

---

## 🎮 Relatório

![TB-01](docs/tela5.png)

---

## 🎮 Leaderboard

![TB-01](docs/tela6.png)

---

## 🎮 Modo Fantasma

![TB-01](docs/tela7.png)

---

# 🎥 Screencast da Entrega 03

Demonstração:

* integração web
* API HTTP
* multiplayer
* estatísticas
* modo fantasma

## 📺 Link

https://youtube.com/shorts/lO7e-riMUbg?si=E5R2xM5VOt1JLnki

---

# 🔗 Links Importantes

## 💻 GitHub

https://github.com/MateusDS-dev/Terminal_Breach

## 🎨 Figma


## 📺 Screencast

https://youtu.be/XPNKL4KcfU8?si=t-etO3ihPEAd2_y3

---

# 🛠️ Troubleshooting

## `gcc` não encontrado

Instalar MinGW/MSYS2 e adicionar ao PATH.

## `make` não encontrado

Usar `mingw32-make`.

## Front-end não conecta

* verificar API
* validar `/health`
* revisar `VITE_BACKEND_URL`

## Porta ocupada

```bash
--api 8090
```

## Multiplayer não conecta

* liberar firewall
* validar IP local
* confirmar `/health`

## `localhost:8080` não funciona

Utilizar:

```text
127.0.0.1:8080
```

---

# 📚 Observações Acadêmicas

Projeto desenvolvido para a disciplina de Desenvolvimento de Software Prático — CESAR School.
https://app.notion.com/p/de8ce887c03a4990ba97bc83e963fa89?v=032286eee753472bae6999912ba14acf&source=copy_link


O projeto aplica:

* programação imperativa
* recursão
* integração HTTP
* multiplayer
* persistência
* análise estatística
* arquitetura cliente-servidor

A funcionalidade extra implementa busca binária recursiva para visualização prática do algoritmo.
