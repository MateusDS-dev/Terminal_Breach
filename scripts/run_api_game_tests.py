#!/usr/bin/env python3
import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_BASE_URL = "http://127.0.0.1:8080"


def request_json(url, method="GET", payload=None, timeout=10, max_retries=3):
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    last_error = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8")
                if not body:
                    return None
                return json.loads(body)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            raise RuntimeError(f"HTTP {exc.code}: {body or exc.reason}")
        except (urllib.error.URLError, ConnectionResetError, BrokenPipeError) as exc:
            last_error = exc
            if attempt < max_retries - 1:
                time.sleep(0.5)  # Brief pause before retry
                continue
            raise RuntimeError(f"Connection error (retry {attempt + 1}/{max_retries}): {str(exc)}")


def start_game(base_url, player, difficulty):
    url = urllib.parse.urljoin(base_url, "/api/game/start")
    payload = {"player": player, "difficulty": difficulty}
    return request_json(url, method="POST", payload=payload)


def submit_guess(base_url, session_id, guess):
    url = urllib.parse.urljoin(base_url, "/api/game/guess")
    payload = {"sessionId": session_id, "guess": guess}
    return request_json(url, method="POST", payload=payload)


def save_session(base_url, session):
    url = urllib.parse.urljoin(base_url, "/api/session/save")
    return request_json(url, method="POST", payload=session)


def build_session_payload(player, difficulty_label, secret, attempts, won, rating):
    return {
        "jogador": player,
        "dificuldade": difficulty_label,
        "segredo": secret,
        "tentativas": attempts,
        "venceu": won,
        "rating": rating,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
    }


def simulate_one(base_url, index, difficulty, save_web):
    player = f"auto_test_{index:03d}"
    session = start_game(base_url, player, difficulty)
    session_id = session["sessionId"]
    max_attempts = session.get("maxAttempts", 0)
    low, high = 1, 100
    attempts = 0

    while True:
        if low > high:
            raise RuntimeError("Binary search range became invalid")
        guess = (low + high) // 2
        attempts += 1
        result = submit_guess(base_url, session_id, guess)

        if result.get("won"):
            secret = result.get("secret", guess)
            rating = result.get("rating") or "unknown"
            if save_web:
                payload = build_session_payload(player, difficulty.title() if difficulty != "ghost" else "Ghost", secret, attempts, True, rating)
                save_session(base_url, payload)
            return True, attempts

        if result.get("finished"):
            secret = result.get("secret", guess)
            rating = result.get("rating") or "unknown"
            if save_web:
                payload = build_session_payload(player, difficulty.title() if difficulty != "ghost" else "Ghost", secret, attempts, False, rating)
                save_session(base_url, payload)
            return False, attempts

        hint = result.get("hint")
        if hint == "higher":
            low = max(low, guess + 1)
        elif hint == "lower":
            high = min(high, guess - 1)
        else:
            raise RuntimeError(f"Unexpected hint: {hint}")

        if max_attempts and attempts >= max_attempts and not result.get("finished"):
            raise RuntimeError("Server did not finish the game after max attempts")


def parse_args():
    parser = argparse.ArgumentParser(description="Run automatic backend game tests against Terminal Breach API.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Base URL of the backend API (default: %(default)s)")
    parser.add_argument("--count", type=int, default=100, help="Number of games to simulate")
    parser.add_argument("--difficulty", choices=["kiddie", "analyst", "operative", "ghost", "mixed"], default="mixed", help="Difficulty to use or mixed cycle")
    parser.add_argument("--no-save", dest="save_web", action="store_false", help="Do not call /api/session/save after each game")
    return parser.parse_args()


def build_difficulties(choice):
    if choice == "mixed":
        return ["kiddie", "analyst", "operative", "ghost"]
    return [choice]


def main():
    args = parse_args()
    difficulties = build_difficulties(args.difficulty)
    counts = {"kiddie": 0, "analyst": 0, "operative": 0, "ghost": 0}
    wins = 0
    losses = 0
    total_attempts = 0

    print(f"Running {args.count} game(s) against {args.base_url}")
    print(f"Difficulties: {', '.join(difficulties)}")
    print(f"Save web sessions: {'enabled' if args.save_web else 'disabled'}")
    print()

    for i in range(1, args.count + 1):
        difficulty = difficulties[(i - 1) % len(difficulties)]
        counts[difficulty] += 1
        print(f"[{i}/{args.count}] difficulty={difficulty}", end=" ")
        try:
            won, attempts = simulate_one(args.base_url, i, difficulty, args.save_web)
        except Exception as exc:
            print(f"ERROR - {exc}")
            sys.exit(1)
        total_attempts += attempts
        if won:
            wins += 1
            print(f"OK (won in {attempts} guesses)")
        else:
            losses += 1
            print(f"OK (lost in {attempts} guesses)")

    print()
    print("Summary")
    print("-------")
    print(f"Total games: {args.count}")
    print(f"Wins: {wins}")
    print(f"Losses: {losses}")
    print(f"Average attempts: {total_attempts / args.count:.2f}")
    print(f"Games by difficulty: {counts}")
    print(f"Web save calls: {'enabled' if args.save_web else 'disabled'}")


if __name__ == "__main__":
    main()
