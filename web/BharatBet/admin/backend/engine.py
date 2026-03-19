import asyncio
import hashlib
import secrets
import time
import os
import math
import hmac
from enum import Enum
from db import db_pool

def get_crash_point(server_seed: str, round_id: str):
    message = f"{round_id}"
    hmac_obj = hmac.new(server_seed.encode(), message.encode(), hashlib.sha256)
    hex_hash = hmac_obj.hexdigest()

    if int(hex_hash, 16) % 33 == 0:
        return 1.00

    h = int(hex_hash[:13], 16)
    e = 2**52
    return math.floor((100 * e - h) / (e - h)) / 100.0

class GameStatus(str, Enum):
    WAITING = "WAITING"
    FLYING = "FLYING"
    CRASHED = "CRASHED"

class GameEngine:
    def __init__(self):
        self.status = GameStatus.WAITING
        self.current_multiplier = 1.0
        self.crash_point = 1.0
        self.bets = []
        self.history = []
        self.round_id = ""
        self.round_nonce = 0
        self.seed = ""
        self.hash = ""
        self.flight_start_time = 0
        self.round_start_time_ms = 0
        self.preparation_time_ms = 5000
        self.clients = set()

    def _run_db_query(self, query, params, commit):
        conn = None
        try:
            pg_query = query.replace("?", "%s")

            if not db_pool:
                raise Exception("DB Pool is missing")

            conn = db_pool.getconn()
            cursor = conn.cursor()
            cursor.execute(pg_query, params)

            result = None
            if pg_query.strip().upper().startswith("SELECT") or "RETURNING" in pg_query.upper():
                result = cursor.fetchone()

            if commit:
                conn.commit()
            return result
        except Exception as e:
            print(f"[DB ERROR in _run_db_query] {e}")
            if conn:
                conn.rollback()
            return None
        finally:
            if conn and db_pool:
                db_pool.putconn(conn)

    async def db_query(self, query, params=(), commit=False):
        return await asyncio.to_thread(self._run_db_query, query, params, commit)

    def _store_round_sync(self, round_id, seed, crash_point, nonce):
        conn = None
        try:
            if not db_pool:
                return
            conn = db_pool.getconn()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO rounds (round_id, seed, crash_point, nonce, created_at) VALUES (%s, %s, %s, %s, NOW())",
                (round_id, seed, crash_point, nonce)
            )
            conn.commit()
        except Exception as e:
            print(f"[DB ERROR storing round] {e}")
            if conn:
                conn.rollback()
        finally:
            if conn and db_pool:
                db_pool.putconn(conn)

    async def store_round(self, round_id, seed, crash_point, nonce):
        await asyncio.to_thread(self._store_round_sync, round_id, seed, crash_point, nonce)

    async def generate_round_data(self):
        server_seed = os.environ.get("SERVER_SEED")

        self.seed = ""
        self.hash = ""

        self.round_id = secrets.token_hex(8)
        self.round_start_time_ms = int(time.time() * 1000) + self.preparation_time_ms
        self.crash_point = get_crash_point(server_seed, self.round_id)

        self.round_nonce = 0

    def get_state(self):
        current_seed = self.seed if self.status == GameStatus.CRASHED else None
        return {
            "status": self.status,
            "currentMultiplier": round(self.current_multiplier, 2),
            "round": {
                "id": self.round_id,
                "nonce": self.round_nonce,
                "seed": current_seed,
                "hash": self.hash,
                "result": self.crash_point,
                "startTime": self.round_start_time_ms if self.status == GameStatus.WAITING else None
            },
            "bets": self.bets,
            "history": self.history,
            "flightStartTime": self.flight_start_time * 1000 if self.flight_start_time else None
        }

    async def broadcast(self):
        if not self.clients: return
        state = self.get_state()
        disconnected = set()

        for client in list(self.clients):
            try:
                await client.send_json(state)
            except:
                disconnected.add(client)

        for client in disconnected:
            self.clients.discard(client)

    async def broadcast_balance_update(self, username):
        res = await self.db_query("SELECT balance FROM users WHERE username = ?", (username,))
        if res:
            new_balance = res[0]
            payload = {"type": "balance_update", "balance": new_balance, "username": username}

            disconnected = set()
            for client in list(self.clients):
                try:
                    await client.send_json(payload)
                except:
                    disconnected.add(client)

            for client in disconnected:
                self.clients.discard(client)

    async def handle_place_bet(self, username, amount):
        try:
            amount = float(amount)

            if not (10 <= amount <= 8000):
                print(f"[REJECTED] {username} tried to bet ₹{amount}. Must be between 10 and 8000.")
                return

            if self.status != GameStatus.WAITING: return

            if any(b["userId"] == username for b in self.bets): return

            res = await self.db_query(
                "UPDATE users SET balance = balance - %s WHERE username = %s AND balance >= %s RETURNING balance, avatar",
                (amount, username, amount),
                commit=True
            )

            if res:
                self.bets.append({
                    "userId": username,
                    "username": username,
                    "amount": amount,
                    "avatar": res[1] if len(res) > 1 else "1.png"
                })
                await self.broadcast()
                await self.broadcast_balance_update(username)
            else:
                print(f"[REJECTED] {username} insufficient funds or race-condition blocked.")
        except Exception as e:
            print(f"[ERROR in handle_place_bet] {e}")

    async def handle_cancel_bet(self, username):
        if self.status != GameStatus.WAITING: return

        for i, bet in enumerate(self.bets):
            if bet["userId"] == username:
                amount = bet["amount"]
                self.bets.pop(i)
                await self.db_query("UPDATE users SET balance = balance + ? WHERE username = ?", (amount, username), True)
                await self.broadcast()
                await self.broadcast_balance_update(username)
                print(f"[CANCEL] {username} cancelled their ₹{amount} bet.")
                break

    async def handle_cashout(self, username):
        if self.status != GameStatus.FLYING: return
        for bet in self.bets:
            if bet["userId"] == username and "cashOutMultiplier" not in bet:
                multiplier = self.current_multiplier
                bet["cashOutMultiplier"] = multiplier
                win_amount = int(bet["amount"] * multiplier)
                bet["winAmount"] = win_amount

                await self.db_query("UPDATE users SET balance = balance + ? WHERE username = ?", (win_amount, username), True)
                await self.broadcast()
                await self.broadcast_balance_update(username)
                break

    async def game_loop(self):
        while True:
            try:
                self.status = GameStatus.WAITING
                self.current_multiplier = 1.0
                self.bets = []
                await self.generate_round_data()

                for _ in range(50):
                    await self.broadcast()
                    await asyncio.sleep(0.1)

                self.status = GameStatus.FLYING
                self.flight_start_time = time.time()

                while True:
                    elapsed = time.time() - self.flight_start_time
                    self.current_multiplier = 1.0 * (1.04 ** elapsed)
                    if self.current_multiplier >= self.crash_point: break
                    await self.broadcast()
                    await asyncio.sleep(0.1)

                self.status = GameStatus.CRASHED
                self.current_multiplier = self.crash_point

                await self.store_round(self.round_id, self.seed, self.crash_point, self.round_nonce)

                self.history.insert(0, {
                    "roundId": self.round_id,
                    "multiplier": self.crash_point,
                    "seed": self.seed
                })
                if len(self.history) > 100:
                    self.history.pop()

                await self.broadcast()
                await asyncio.sleep(3.0)

            except Exception as e:
                print(f"[GAME ENGINE ERROR] Surviving crash: {e}")
                await asyncio.sleep(1)

engine = GameEngine()
