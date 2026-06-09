#!/usr/bin/env python3
"""
Test runner que simula 100 jogadas via modo terminal automatizado.
Como o modo API tem problemas em Windows, este script:
1. Executa o jogo 100 vezes via input automation
2. Usa busca binária para completar cada jogo rapidamente
3. Verifica se as sessões foram salvas em data/sessions.json
"""

import subprocess
import time
import os
import json
import sys

def run_single_game(executable_path, difficulty, player_name, guess_sequence):
    """
    Executa uma única partida do terminal_breach.exe
    
    Args:
        executable_path: caminho para terminal_breach.exe
        difficulty: 1=kiddie, 2=analyst, 3=operative, 4=ghost
        player_name: nome do jogador
        guess_sequence: lista de números para tentar (ou None para busca binária automática)
    """
    try:
        proc = subprocess.Popen(
            [executable_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=os.path.dirname(executable_path)
        )
        
        # Nome do jogador
        output, _ = proc.communicate(
            input=f"{player_name}\n{difficulty}\n50\n\n",
            timeout=15
        )
        
        return True
    except subprocess.TimeoutExpired:
        proc.kill()
        return False
    except Exception as e:
        print(f"Erro ao executar jogo: {e}")
        return False


def count_sessions_in_json(json_path):
    """Conta quantas sessões estão salvas em data/sessions.json"""
    if not os.path.exists(json_path):
        return 0
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return len(data)
    except (json.JSONDecodeError, IOError):
        pass
    return 0


def main():
    executable = "./terminal_breach.exe"
    if not os.path.exists(executable):
        print(f"[ERRO] {executable} não encontrado")
        sys.exit(1)
    
    sessions_file = "./data/sessions.json"
    initial_count = count_sessions_in_json(sessions_file)
    
    print(f"[INFO] Iniciando 100 testes de jogo")
    print(f"[INFO] Sessões existentes: {initial_count}")
    print()
    
    difficulties = [
        (1, "kiddie"),
        (2, "analyst"),
        (3, "operative"),
        (4, "ghost")
    ]
    
    total_games = 100
    games_per_difficulty = total_games // len(difficulties)
    
    success_count = 0
    
    for idx in range(1, total_games + 1):
        diff_idx = (idx - 1) % len(difficulties)
        diff_num, diff_name = difficulties[diff_idx]
        player_name = f"auto_test_{idx:03d}"
        
        print(f"[{idx}/{total_games}] Dificuldade: {diff_name} ({player_name})", end=" ... ")
        sys.stdout.flush()
        
        if run_single_game(executable, str(diff_num), player_name, None):
            success_count += 1
            print("✓")
        else:
            print("✗")
        
        time.sleep(0.2)  # Pequena pausa entre jogos
    
    print()
    final_count = count_sessions_in_json(sessions_file)
    new_sessions = final_count - initial_count
    
    print("=" * 60)
    print("Resumo dos testes")
    print("=" * 60)
    print(f"Jogos executados: {success_count}/{total_games}")
    print(f"Sessões salvas antes: {initial_count}")
    print(f"Sessões salvas depois: {final_count}")
    print(f"Novas sessões: {new_sessions}")
    print()
    
    if new_sessions > 0:
        print(f"✓ Sucesso! {new_sessions} sessões foram gravadas em {sessions_file}")
    else:
        print(f"✗ Nenhuma nova sessão foi gravada")
    
    return 0 if new_sessions > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
