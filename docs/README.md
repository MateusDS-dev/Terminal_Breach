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
* [🆕 Histórias Implementadas](#-histórias-implementadas-na-entrega-04)
* [🗂️ Estrutura do Projeto](#️-estrutura-do-projeto)
* [🚀 Como Executar](#-como-executar)
* [🗓️ Sprint da Entrega 04](#️-sprint-da-entrega-04)
* [🔄 Controle de Versionamento](#-controle-de-versionamento)
* [👥 Equipe](#-equipe)
* [📌 Backlog](#-backlog--histórias-de-usuário-detalhado)
* [📸 Board](#-board-do-projeto)
* [🐞 Issues](#-issue--bug-tracker)
* [🌐 API HTTP](#-api-http)
* [🧪 Testes de Sistema](#-testes-de-sistema)
* [🧪 Testes de Integração](#-testes-de-integração)
* [👥 Programação em Par](#-programação-em-par)
* [📱 Protótipo](#-protótipo-lo-fi-figma)
* [📝 Storyboards](#-sketches-e-storyboards)
* [🎥 Screencast](#-screencast-da-entrega-04)
* [🤝 Como Contribuir](#-como-contribuir)
* [🔗 Links Importantes](#-links-importantes)
* [🛠️ Troubleshooting](#️-troubleshooting)
* [📚 Observações Acadêmicas](#-observações-acadêmicas)

---

# 🎮💻 Sobre o Projeto

**Terminal Breach** é um jogo educativo desenvolvido como projeto acadêmico na CESAR School.

O jogador assume o papel de um hacker tentando descobrir o código de acesso de um servidor protegido por firewall. A cada tentativa, o sistema fornece feedback temático, criando uma experiência imersiva e interativa.

O projeto foi estruturado em duas camadas principais:

* **Back-end em C** responsável pela lógica principal do jogo, estatísticas, persistência e API HTTP.
* **Front-end em React + TSX** responsável pela interface web moderna, HUD, menus e integração online.

Ao final de cada sessão o sistema gera:

* 📊 Estatísticas de desempenho
* 🧠 Sugestões de estratégia
* 🏆 Rating do jogador
* 📈 Histórico e ranking

O projeto aborda conceitos como:

* programação imperativa
* recursão
* manipulação de arquivos
* integração HTTP
* análise estatística
* arquitetura cliente-servidor
* multiplayer online

---

# 🏗️ Arquitetura do Sistema

## 🔹 Back-end em C

Responsável por:

* lógica principal
* sistema de tentativas
* geração do número secreto
* estatísticas
* API HTTP
* persistência de sessões
* multiplayer

---

## 🔹 Front-end em React + TSX

Responsável por:

* interface visual
* HUD do jogador
* menus
* histórico
* fluxo das partidas
* multiplayer online

---

# 🔄 Fluxo de Comunicação

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

# 🆕 Histórias Implementadas na Entrega 04

## ✅ Histórias concluídas

* [x] Sistema multiplayer PvP
* [x] Persistência de sessões em JSON
* [x] Sistema de leaderboard
* [x] Integração completa Front ↔ API
* [x] Sistema de fallback offline
* [x] Modo Fantasma
* [x] Sistema de estatísticas avançadas
* [x] Relatório de desempenho do jogador

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
├── CONTRIBUTING.md
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

---

## Executar API HTTP

Linux/macOS:

```bash
./terminal_breach --api 8080
```

Windows:

```powershell
.\terminal_breach.exe --api 8080
```

---

## Executar modo terminal

```bash
./terminal_breach
```

---

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

---

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

# 🗓️ Sprint da Entrega 04

A Sprint da Entrega 04 foi organizada utilizando GitHub Projects.

Durante a sprint foram acompanhados:

* desenvolvimento das novas histórias
* testes de sistema
* integração multiplayer
* revisão de bugs
* validações finais
* organização do backlog

---

## 📸 Quadro da Sprint

![Sprint](docs/sprint04.png)

---

# 🔄 Controle de Versionamento

O projeto utilizou Git e GitHub como ambiente de versionamento.

Foram realizados commits frequentes durante toda a Sprint.

## 📌 Histórico de commits

LINK_DOS_COMMITS_AQUI

---

# 👥 Equipe

| Papel | Nome | Responsabilidades |
|---|---|---|
| 👑 Líder | Rafael Medeiros Machado Dias | Coordenação geral, integração e modo fantasma |
| ⚙️ Back-end | Cauã Henrique Melo Almeida | RNG, API HTTP e logs |
| 🎨 Front-end | João Felipe Bonifácio Barros | React, HUD e interface |
| 📊 Estatísticas | Luis Henrique Vilas Boas | Recursão e métricas |
| 🧪 QA/Testes | Mateus Henrique Diniz Silva | Ranking, integração e testes |

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

### Critérios

* análise de desempenho
* feedback automático
* melhoria de decisões

![diagram](docs/mermaid-diagram4.png)

---

## TB-08 · Sistema de rating

### Critérios

* cálculo de desempenho
* classificação automática
* histórico de jogadores

![diagram](docs/mermaid-diagram6.png)

---

# 🟢 Prioridade 3

## TB-03 · Registro em log

### Critérios

* persistência de eventos
* auditoria de sessões

![diagram](docs/mermaid-diagram1.png)

---

## TB-04 · Média de desempenho

### Critérios

* cálculo estatístico
* análise de partidas

![diagram](docs/mermaid-diagram2.png)

---

## TB-05 · Estatísticas com recursão

### Critérios

* funções recursivas
* análise de dados

![diagram](docs/mermaid-diagram3.png)

---

## TB-09 · Leaderboard

### Critérios

* ranking online
* pontuação global

![diagram](docs/mermaid-diagram7.png)

---

# ⭐ Funcionalidade Extra

## TB-10 · Modo Fantasma

### Critérios

* gameplay avançada
* dificuldade extrema
* suporte multiplayer

![diagram](docs/mermaid-diagram8.png)

---

# 📸 Board do Projeto

![Board](docs/board.png)

---

# 📸 Backlog Visual

![Backlog](docs/backlog.png)

---

# 🐞 Issue / Bug Tracker

Gerenciamento realizado com GitHub Issues.

## 📸 Issues do Projeto

![Issues](docs/issues.png)

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

## ✅ Testes realizados

| Funcionalidade | Resultado |
|---|---|
| Multiplayer PvP | ✅ OK |
| Integração Front/API | ✅ OK |
| Sistema de ranking | ✅ OK |
| Persistência JSON | ✅ OK |
| Sistema de logs | ✅ OK |
| Estatísticas | ✅ OK |
| API HTTP | ✅ OK |
| Modo Fantasma | ✅ OK |

---

## 📸 Evidências dos testes

![Teste](docs/teste1.png)

![Teste](docs/teste2.png)

---

# 🎥 Screencast dos Testes

## 📺 Vídeo dos testes de sistema

LINK_DO_VIDEO_DOS_TESTES_AQUI

---

# 🧪 Testes de Integração

| Teste | Resultado |
|---|---|
| Comunicação Front ↔ API | ✅ OK |
| Multiplayer | ✅ OK |
| Persistência JSON | ✅ OK |
| Endpoint `/health` | ✅ OK |
| Fallback offline | ✅ OK |

---

# 👥 Programação em Par

Durante o desenvolvimento da Entrega 04 foram realizadas sessões de programação em pares para revisão de lógica, testes e integração.

| Integrantes | Funcionalidades |
|---|---|
| Rafael + Cauã | API HTTP e logs |
| João + Luis | Estatísticas |
| Mateus + Rafael | Ranking e testes |
| João + Mateus | Front-end e integração |

Benefícios obtidos:

* redução de bugs
* validação contínua
* compartilhamento de conhecimento
* melhoria da arquitetura

---

# 📱 Protótipo Lo-Fi (Figma)

## 🔗 Link do protótipo

LINK_DO_FIGMA_AQUI

---

# 📝 Sketches e Storyboards

## 🎮 Tela Inicial

![Tela Inicial](docs/telainicial1.png)

---

## 🎮 Seleção de Dificuldade

![Dificuldade](docs/tela2.png)

---

## 🎮 Tela de Tentativa

![Tentativa](docs/tela3.png)

---

## 🎮 Feedback

![Feedback](docs/tela4.png)

---

## 🎮 Relatório

![Relatório](docs/tela5.png)

---

## 🎮 Leaderboard

![Leaderboard](docs/tela6.png)

---

## 🎮 Modo Fantasma

![Fantasma](docs/tela7.png)

---

# 🎥 Screencast da Entrega 04

Demonstração da entrega contendo:

* novas histórias
* multiplayer
* integração HTTP
* testes de sistema
* leaderboard
* persistência JSON

---

## 📺 Link do vídeo principal

LINK_DO_VIDEO_DA_ENTREGA_04_AQUI

---

# 🤝 Como Contribuir

O projeto segue um fluxo simples de contribuição acadêmica.

## Passos

1. Fazer fork do projeto
2. Criar uma branch:

```bash
git checkout -b minha-feature
```

3. Realizar commits descritivos
4. Enviar alterações:

```bash
git push origin minha-feature
```

5. Abrir Pull Request

---

## 📋 Padrões adotados

* código organizado
* nomenclatura padronizada
* comentários claros
* commits descritivos

---

# 🔗 Links Importantes

## 💻 GitHub

LINK_DO_GITHUB_AQUI

---

## 🎨 Figma

LINK_DO_FIGMA_AQUI

---

## 📺 Screencast

LINK_DO_VIDEO_DA_ENTREGA_04_AQUI

---

# 🛠️ Troubleshooting

## `gcc` não encontrado

Instalar MinGW/MSYS2 e adicionar ao PATH.

---

## `make` não encontrado

Usar `mingw32-make`.

---

## Front-end não conecta

* verificar API
* validar `/health`
* revisar `VITE_BACKEND_URL`

---

## Porta ocupada

```bash
--api 8090
```

---

## Multiplayer não conecta

* liberar firewall
* validar IP local
* confirmar `/health`

---

# 📚 Observações Acadêmicas

Projeto desenvolvido para a disciplina de Desenvolvimento de Software Prático — CESAR School.

O projeto aplica:

* programação imperativa
* recursão
* integração HTTP
* multiplayer
* persistência
* análise estatística
* arquitetura cliente-servidor
* desenvolvimento colaborativo
* testes de integração
* versionamento contínuo
