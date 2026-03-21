-- BharatBet CTF – Database Initialization
-- Runs automatically when the Postgres container first starts.

CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    balance FLOAT DEFAULT 0,
    token TEXT
);

CREATE TABLE IF NOT EXISTS rounds (
    id SERIAL PRIMARY KEY,
    round_id TEXT UNIQUE,
    seed TEXT,
    crash_point FLOAT,
    nonce BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


