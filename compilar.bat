@echo off
setlocal
REM ============================================================
REM  Terminal Breach — Compilação Windows (GCC / MinGW / MSYS2)
REM  Uso: na raiz do repositório, execute: compilar.bat
REM ============================================================

cd /d "%~dp0"

echo.
echo  [BUILD] Compilando Terminal Breach...
echo.

where gcc >nul 2>nul
if errorlevel 1 (
    echo  [ERRO] gcc nao encontrado no PATH.
    echo.
    echo  Instale uma toolchain C no Windows, por exemplo:
    echo    - MSYS2: https://www.msys2.org/ ^(pacote mingw-w64-x86_64-gcc^)
    echo    - Ou WinLibs / LLVM com clang
    echo.
    echo  Depois abra um terminal onde "gcc --version" funcione e rode este script de novo.
    echo.
    pause
    exit /b 1
)

if not exist data mkdir data

gcc -Wall -Wextra -std=c11 -Iinclude -o terminal_breach.exe ^
  src/main.c src/game.c src/db.c src/stats.c src/ghost_mode.c src/leaderboard.c src/http_server.c ^
  -lm -lws2_32

if errorlevel 1 (
    echo.
    echo  [ERRO] Falha na compilacao.
    echo.
    pause
    exit /b 1
)

echo.
echo  [OK] terminal_breach.exe gerado com sucesso!
echo.
echo  Rodar jogo no terminal ^(modo classico^):
echo    terminal_breach.exe
echo.
echo  Rodar modo Fantasma:
echo    terminal_breach.exe --ghost
echo.
echo  Rodar API HTTP ^(integracao com o front-end^):
echo    terminal_breach.exe --api 8080
echo    Depois em outro terminal: cd web ^&^& npm install ^&^& npm run dev
echo.
pause
