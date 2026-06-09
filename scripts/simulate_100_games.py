#!/usr/bin/env python3
"""
Simula 100 jogos completos e grava as sessões em data/sessions.json.
Não depende do servidor HTTP — apenas simula o jogo e persiste os dados.
"""

import json
import os
import sys
import time
import random
from datetime import datetime

def get_rating(attempts, won):
    """Calcula o rating da sessão (espelho da lógica em C)"""
    if not won:
        return "Script Kiddie"
    if attempts <= 4:
        return "Ghost"
    if attempts <= 6:
        return "Operativo"
    if attempts == 7:
        return "Analista"
    return "Script Kiddie"


def simulate_game(player, difficulty_name, difficulty_max):
    """
    Simula um jogo completo com busca binária.
    
    Returns:
        (won, attempts, secret, rating)
    """
    secret = random.randint(1, 100)
    attempts = 0
    low, high = 1, 100
    
    # Simula jogadas com busca binária (ótima estratégia)
    while True:
        attempts += 1
        guess = (low + high) // 2
        
        if guess == secret:
            rating = get_rating(attempts, True)
            return (True, attempts, secret, rating)
        
        if difficulty_max > 0 and attempts >= difficulty_max:
            rating = get_rating(attempts, False)
            return (False, attempts, secret, rating)
        
        if guess < secret:
            low = guess + 1
        else:
            high = guess - 1


def load_sessions():
    """Carrega sessões existentes de data/sessions.json"""
    sessions_file = "./data/sessions.json"
    if not os.path.exists(sessions_file):
        return []
    try:
        with open(sessions_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def save_sessions(sessions):
    """Salva sessões em data/sessions.json"""
    sessions_file = "./data/sessions.json"
    os.makedirs("./data", exist_ok=True)
    with open(sessions_file, 'w', encoding='utf-8') as f:
        json.dump(sessions, f, indent=2, ensure_ascii=False)


def main():
    difficulties = [
        ("kiddie", 0, "Script Kiddie"),
        ("analyst", 10, "Analista"),
        ("operative", 7, "Operativo"),
        ("ghost", 5, "Ghost"),
    ]
    
    total_games = 100
    games_per_diff = total_games // len(difficulties)
    
    # Carrega sessões existentes
    sessions = load_sessions()
    initial_count = len(sessions)
    
    print(f"Simulando {total_games} jogos...")
    print(f"Sessões já existentes: {initial_count}")
    print()
    
    stats = {"wins": 0, "losses": 0, "total_attempts": 0}
    
    for idx in range(1, total_games + 1):
        diff_idx = (idx - 1) % len(difficulties)
        diff_slug, max_attempts, diff_label = difficulties[diff_idx]
        
        player = f"auto_test_{idx:03d}"
        won, attempts, secret, rating = simulate_game(player, diff_label, max_attempts)
        
        # Cria entrada de sessão
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        session_entry = {
            "timestamp": now,
            "jogador": player,
            "dificuldade": diff_label,
            "segredo": secret,
            "tentativas": attempts,
            "rating": rating,
            "venceu": won
        }
        sessions.append(session_entry)
        
        # Atualiza stats
        if won:
            stats["wins"] += 1
        else:
            stats["losses"] += 1
        stats["total_attempts"] += attempts
        
        status = "✓ WIN" if won in [True, 1] else "✗ LOSS"
        print(f"[{idx:3d}/100] {diff_label:10s} {status:8s} ({attempts:2d} tentativas)")
    
    # Salva tudo
    save_sessions(sessions)
    
    print()
    print("=" * 60)
    print("RESUMO")
    print("=" * 60)
    print(f"Jogos simulados: {total_games}")
    print(f"Vitórias: {stats['wins']}")
    print(f"Derrotas: {stats['losses']}")
    print(f"Média de tentativas: {stats['total_attempts'] / total_games:.2f}")
    print(f"Sessões antes: {initial_count}")
    print(f"Sessões agora: {len(sessions)}")
    print(f"Novas sessões: {len(sessions) - initial_count}")
    print()
    print(f"✓ Arquivo salvo: ./data/sessions.json")


if __name__ == "__main__":
    main()
