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
* [📈 Roadmap Futuro](#-roadmap-futuro)
* [🔐 Segurança](#-segurança)
* [🧠 Conceitos Aplicados](#-conceitos-aplicados)
* [📊 Métricas do Projeto](#-métricas-do-projeto)
* [🗃️ Organização das Branches](#️-organização-das-branches)
* [✅ Critérios Acadêmicos Atendidos](#-critérios-acadêmicos-atendidos)
* [📄 Licença](#-licença)

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
├── include/
├── src/
├── data/
├── web/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── docs/
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

[Histórico de Commits](https://github.com/MateusDS-dev/Terminal_Breach/commits/main)

---

# 👥 Equipe

| Papel           | Nome                         | Responsabilidades |
| --------------- | ---------------------------- | ----------------- |
| 👑 Líder        | Rafael Medeiros Machado Dias | Coordenação geral |
| ⚙️ Back-end     | Cauã Henrique Melo Almeida   | API HTTP          |
| 🎨 Front-end    | João Felipe Bonifácio Barros | React             |
| 📊 Estatísticas | Luis Henrique Vilas Boas     | Recursão          |
| 🧪 QA/Testes    | Mateus Henrique Diniz Silva  | Testes            |

---

# 📌 Backlog — Histórias de Usuário

## TB-01 · Geração de número aleatório

![diagram](docs/mermaid-diagram.png)

---

## TB-02 · Loop com dicas temáticas

![diagram](docs/mermaid-diagram9.png)

---

## TB-07 · Níveis de dificuldade

![diagram](docs/mermaid-diagram5.png)

---

# 📸 Board do Projeto

![Board](docs/board.png)

---

# 📸 Backlog Visual

![Backlog](docs/backlog1.png)

---

# 🐞 Issue / Bug Tracker

![Issues](docs/issues.png)

---

# 🌐 API HTTP

## `GET /health`

Verifica se a API está online.

## `POST /api/game/start`

Inicia sessão.

## `POST /api/game/guess`

Envia tentativa.

## `POST /api/session/save`

Salva sessões.

---

# 🧪 Testes de Sistema

| Funcionalidade    | Resultado |
| ----------------- | --------- |
| Geração aleatória | ✅         |
| Leaderboard       | ✅         |
| Logs              | ✅         |
| Relatórios        | ✅         |



# 🧪 Testes de Integração

| Teste             | Resultado |
| ----------------- | --------- |
| Front ↔ API       | ✅         |
| Multiplayer       | ✅         |
| Persistência JSON | ✅         |

---

# 👥 Programação em Par

| Integrantes     | Funcionalidades |
| --------------- | --------------- |
| Rafael + Cauã   | API             |
| João + Luis     | Estatísticas    |
| Mateus + Rafael | Ranking         |
| João + Mateus   | Integração      |

---

# 📱 Protótipo Lo-Fi (Figma)



# 📝 Sketches e Storyboards

![Tela](docs/tela1.png)
![Tela](docs/tela2.png)
![Tela](docs/tela3.png)
![Tela](docs/tela4.png)
![Tela](docs/tela5.png)
![Tela](docs/tela6.png)
![Tela](docs/tela7.png)

---

# 🎥 Screencast da Entrega 03

Demonstração completa do projeto funcionando:

* integração Front-end ↔ Back-end
* API HTTP
* multiplayer
* sistema de dificuldades
* leaderboard
* persistência em JSON
* modo fantasma
* testes do sistema
* funcionamento completo do jogo

## 📺 Vídeo Demonstrativo

[▶️ Assistir Screencast Completo](https://youtu.be/XPNKL4KcfU8?si=t-etO3ihPEAd2_y3)

---

# 🧪 Demonstração dos Testes

O vídeo também apresenta:

* execução dos testes
* integração da API
* validação do multiplayer
* funcionamento do ranking
* persistência das sessões
* execução do front-end React + TSX

---

# 🔗 Links Importantes

## 💻 GitHub

[GitHub do Projeto](https://github.com/MateusDS-dev/Terminal_Breach)



## 📺 Screencast Completo

[Assistir Projeto Funcionando](https://youtu.be/XPNKL4KcfU8?si=t-etO3ihPEAd2_y3)

---

# 🛠️ Troubleshooting

## `gcc` não encontrado

Instalar MinGW/MSYS2.

## `make` não encontrado

Usar `mingw32-make`.

## Front-end não conecta

Verificar `/health`.

## Porta ocupada

```bash
--api 8090
```

---

# 📚 Observações Acadêmicas

Projeto desenvolvido para a disciplina de Desenvolvimento de Software Prático — CESAR School.

---

# 📈 Roadmap Futuro

* autenticação
* ranking online
* replay
* matchmaking
* deploy em nuvem

---

# 🔐 Segurança

O sistema implementa:

* validação de entradas
* verificação de sessão
* controle de erros HTTP
* fallback offline

---

# 🧠 Conceitos Aplicados

* programação imperativa
* recursão
* persistência
* integração HTTP
* arquitetura cliente-servidor
* Git/GitHub
* modularização

---

# 📊 Métricas do Projeto

| Métrica             | Valor      |
| ------------------- | ---------- |
| Linguagem principal | C          |
| Front-end           | React + TS |
| API                 | HTTP       |
| Persistência        | JSON       |

---

# 🗃️ Organização das Branches

## Branches utilizadas

* `main`
* `frontend`
* `backend`
* `feature/multiplayer`
* `feature/ranking`

---

# ✅ Critérios Acadêmicos Atendidos

| Requisito         | Status |
| ----------------- | ------ |
| README completo   | ✅      |
| GitHub organizado | ✅      |
| Backlog           | ✅      |
| Sprint            | ✅      |
| Issues            | ✅      |
| API HTTP          | ✅      |
| Front-end         | ✅      |
| Testes            | ✅      |
| Storyboards       | ✅      |
| Screencast        | ✅      |

---

# 📄 Licença

Este projeto está licenciado sob a licença MIT.
