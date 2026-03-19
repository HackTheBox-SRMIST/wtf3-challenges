from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import psycopg2
from psycopg2 import pool, IntegrityError
import hashlib
import secrets
import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from db import db_pool
from engine import engine

DATABASE_URL = os.getenv("DATABASE_URL")
FLAG_PRICE = 500_000
STARTING_BALANCE = 100

class UserAuth(BaseModel):
    username: str
    password: str
    avatar: str = "1.png"

def get_db_conn():
    if not db_pool:
        raise Exception("Database pool not initialized")
    conn = db_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
    except Exception:
        db_pool.putconn(conn, close=True)
        conn = db_pool.getconn()
    return conn

def release_db_conn(conn):
    if db_pool and conn:
        db_pool.putconn(conn)

from fastapi import Header, Depends, Query, HTTPException

def verify_user(authorization: str = Header(None), token: str = Query(None)):
    if authorization and authorization.startswith("Bearer "):
        actual_token = authorization.split(" ")[1]
    elif token:
        actual_token = token
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_db_conn()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE token = %s", (actual_token,))
        result = cursor.fetchone()
    finally:
        release_db_conn(conn)

    if not result:
        raise HTTPException(status_code=401, detail="Invalid token")
    return result[0] # Returns the true, authenticated username

def init_db():
    conn = get_db_conn()
    try:
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password_hash TEXT,
                balance FLOAT DEFAULT 0,
                token TEXT,
                avatar TEXT DEFAULT '1.png'
            )
        ''')

        cursor.execute('''
            ALTER TABLE users ADD COLUMN IF NOT EXISTS token TEXT;
        ''')
        cursor.execute('''
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '1.png';
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rounds (
                id SERIAL PRIMARY KEY,
                round_id TEXT UNIQUE,
                seed TEXT,
                crash_point FLOAT,
                nonce BIGINT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        cursor.execute('''
            ALTER TABLE rounds ADD COLUMN IF NOT EXISTS nonce BIGINT;
        ''')

        conn.commit()
    finally:
        release_db_conn(conn)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        print("Database connected and verified.")
    except Exception as e:
        print(f"DATABASE STARTUP ERROR: {e}")

    game_task = asyncio.create_task(engine.game_loop())

    yield
    game_task.cancel()

app = FastAPI(
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/health")
def health_check():
    return {"status": "awake"}

@app.head("/health")
def health_check_head():
    return {"status": "awake"}

@app.post("/register")
def register(user: UserAuth):
    conn = None
    try:
        conn = get_db_conn()
        cursor = conn.cursor()
        token = secrets.token_hex(32)
        cursor.execute(
            "INSERT INTO users (username, password_hash, balance, token, avatar) VALUES (%s, %s, %s, %s, %s)",
            (user.username, hash_password(user.password), STARTING_BALANCE, token, user.avatar)
        )
        conn.commit()
        return {
            "message": "Success",
            "user": {
                "username": user.username,
                "balance": STARTING_BALANCE,
                "token": token,
                "avatar": user.avatar
            }
        }

    except IntegrityError:
        if conn: conn.rollback()
        raise HTTPException(status_code=400, detail="Username already exists")

    except Exception as e:
        if conn: conn.rollback()
        print(f"CRITICAL DB ERROR: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    finally:
        release_db_conn(conn)

@app.post("/login")
def login(user: UserAuth):
    conn = get_db_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT balance, avatar FROM users WHERE username = %s AND password_hash = %s",
            (user.username, hash_password(user.password))
        )
        result = cursor.fetchone()

        if result:
            token = secrets.token_hex(32)
            cursor.execute("UPDATE users SET token = %s WHERE username = %s", (token, user.username))
            conn.commit()
            return {
                "message": "Success",
                "user": {
                    "username": user.username,
                    "balance": result[0],
                    "avatar": result[1],
                    "token": token
                }
            }
    finally:
        release_db_conn(conn)

    raise HTTPException(status_code=401, detail="Invalid Credentials")

@app.get("/balance/{username}")
def get_balance(username: str):
    conn = get_db_conn()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT balance FROM users WHERE username = %s", (username,))
        res = cursor.fetchone()
    finally:
        release_db_conn(conn)

    if res:
        return {"balance": res[0]}
    raise HTTPException(status_code=404, detail="User not found")

@app.get("/api/history")
def get_history(limit: int = 50):
    limit = max(1, min(limit, 500))
    conn = get_db_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT round_id, seed, crash_point, nonce, created_at FROM rounds ORDER BY id DESC LIMIT %s",
            (limit,)
        )
        rows = cursor.fetchall()
    finally:
        release_db_conn(conn)

    return {
        "rounds": [
            {
                "roundId": r[0],
                "seed": r[1],
                "crashPoint": r[2],
                "nonce": r[3],
                "createdAt": r[4].isoformat() if r[4] else None
            }
            for r in rows
        ]
    }

@app.get("/api/avatars-list")
def list_avatars():
    path = "./static/avatars"
    try:
        files = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
        valid_files = [f for f in files if f.endswith(".png") or f.endswith(".jpg") or f.endswith(".jpeg")]
        return {"avatars": sorted(valid_files)}
    except Exception as e:
        print(f"[ERROR retrieving avatars]: {e}")
        return {"avatars": []}

@app.get("/api/avatar")
async def get_avatar(file: str, auth_username: str = Depends(verify_user)):
    file_path = os.path.join("./static/avatars", file)
    absolute_path = os.path.abspath(file_path)
    print(f"[LFI DEBUG] {auth_username} requested: {file}")
    print(f"[LFI DEBUG] Server looking at: {absolute_path}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)

@app.get("/api/avatar-preview")
async def preview_avatar(file: str):
    if "/" in file or "\\" in file or ".." in file:
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    file_path = os.path.join("./static/avatars", file)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)

@app.post("/api/buy-flag")
def buy_flag(auth_username: str = Depends(verify_user)):
    conn = get_db_conn()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT balance FROM users WHERE username = %s", (auth_username,))
        res = cursor.fetchone()

        if not res or res[0] < FLAG_PRICE:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance! You need ₹{FLAG_PRICE:,} to buy the flag."
            )

        cursor.execute(
            "UPDATE users SET balance = balance - %s WHERE username = %s",
            (FLAG_PRICE, auth_username)
        )
        conn.commit()
        
        actual_flag = os.getenv("FLAG", "CTF{flag_not_found_in_environment}")

        return {
            "message": "Flag purchased!",
            "flag": actual_flag,
            "new_balance": res[0] - FLAG_PRICE
        }
    finally:
        release_db_conn(conn)

@app.websocket("/ws/game")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    engine.clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            token = data.get("token")

            if not token:
                continue
                
            res = await engine.db_query("SELECT username FROM users WHERE token = %s", (token,))
            if not res:
                continue
                
            auth_username = res[0]

            try:
                if action == "place_bet":
                    await engine.handle_place_bet(auth_username, data.get("amount"))
                elif action == "cancel_bet":
                    await engine.handle_cancel_bet(auth_username)
                elif action == "cashout":
                    await engine.handle_cashout(auth_username)
            except Exception as e:
                print(f"[WS ACTION ERROR] Failed to process {action}: {e}")

    except WebSocketDisconnect:
        engine.clients.discard(websocket)

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI Server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, ws_ping_interval=30, ws_ping_timeout=30, reload=True)