@echo off
REM ============================================================
REM  Terminal Breach — Script de compilacao para Windows
REM  Uso: compilar.bat
REM ============================================================

echo.
echo  [BUILD] Compilando Terminal Breach...
echo.

if not exist data mkdir data

gcc -Wall -Wextra -std=c11 -o terminal_breach.exe main.c game.c db.c stats.c ghost_mode.c leaderboard.c -lm

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  [OK] Compilacao concluida com sucesso!
    echo.
    echo  Para jogar:
    echo    terminal_breach.exe
    echo.
    echo  Para o Modo Fantasma ^(busca binaria automatica^):
    echo    terminal_breach.exe --ghost
    echo.
) else (
    echo.
    echo  [ERRO] Falha na compilacao. Verifique se o gcc esta instalado.
    echo  Dica: instale o MinGW ou use o WSL ^(Linux no Windows^).
    echo.
)

pause
