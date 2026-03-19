import secrets
import hmac
import hashlib
import base64
import json
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, ExpiredSignatureError, jwt

from app.core.exceptions import AppException


# Hardcoded RSA-2048 keypair 
# The public key is exposed at GET /health so players can retrieve it.


RSA_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQBzWsvsddTnVgPd7Ao0qHR0nPppYWYLDFL+LoS/ki4EN2k0pJxy
xEj3XKWcPNGQoBxtRs0QFSqIN7lLs+TLiRHDfP/Cn/LMnGrmJJblcoHbdB7i6iXS
N1sXxKMBWmXQfqN+k0K0pD9N0nhHQwebyWGNiaSpIPbRyyS5WD3mNhAQCL1q7Hu7
4SBxggyzNzeOGj5fvVTZpsopFXZ6mSc8FmmXvjO5deV3NzE5VuJn/FL4P1+4bNAK
KcFKIYVVVCDtGwQc24ufBbnEAAvHwT5giVLqlkiRbUbKGyvQL9P5WJn4IVPFJgb6
RdEFC44YUkq7PYv/eXSJuBVNi5xePrfuGDCrAgMBAAECggEASlWgQ2hLIigTpdaN
XRGQufTOiUnyb/wpHxLrCGgyrxTl/r508p/6RSy2q8+lXAVRTDnruwlotw7xoQ7z
yRUzFT5fshNQavoBCP1bH9CCTeCuZptsc+KoGNDmGeEe6xQwV0ieG7ob8RJH3+QZ
6xICgyrHqRVM+DRoHef3O3prL2kRwCa762RReshf/mIeHwZ2Pt4oCLdE78X6RB3Y
k5VvJW49/M1TTvd4qSpm6nKMtNb6GhYsav4ePIPGf3CD6zjpKqsFQvKBzhAarjDS
mMh0MjDdVJ1KwfXTz2rSdSmuMzp90HErvyYlm88xe30VSIbqbAZci3VLc3Y8Gz80
xeW5gQKBgQDLgYTYSw5zdhIcAol1RdlSjDBOyeil8kNnR1F/SjSQAnrVCSTl9Qzj
Fmb35SOk+mB4SESUS9qFjkMqin+t4vICqBJp1BLrcxH9iCNmfWUSHJxXKQlK1WkO
MTKiPBHZlgg2PWanxTSrwEwsQbiOkTGjaplRpYFQo4kn8jg0k40YMwKBgQCRHDlA
41DgS1gc4DCqXiUmkZ7stLlB/srSR3PnE06CLfAukG+MdGBIBbmmlw89lhI3l6Ev
wiAKi4IA9jzvBCqH6JBk+CV0ELZU3bwAd5A4G659OzoKaV5ts48NkBp0wFFcs0C6
hQWsEfH6VfRdnYiqcV+G054qAxU5fiRio0TtqQKBgQCXgMb7l3UctCvrOmBHNEcE
U2WrYlmXIXLYspmToBTdmVsEupgDsplzfjwOFUKiEdw77+FOXeJDR5PtWcqQE8KE
A8ghjUbAjpw4GV/xby0NfMtPgDdwxMw/SpUdfobza+SVLMT95ay+qJyM3iidyq4f
sL6PsB1DgVwcpxD841RJTQKBgERc0pBCR0jT1hgMeoDYx5HLCt8jKR/xRGYaaX0U
eGkV8VBOlW7LKMzlfZgBFJoECGMOWU6hmuy82qtPVleYU90hcF1RFnv+n5eNutNR
gK0eRW8UJvzetTDjZeKS4BPewrX0cOsuXgS5k5FHS0+LNuZtcP6Y1aufNjGWvteF
aaS5AoGAeOtKljOeixddkT2vks8rEy+i7dlo3hr8vkFOeb9X42+ZL+RJef6R1xzP
yUdnW6xWlQSCfvy5VpzNIoqwyVNCiZG8VeFoPAOCamuvOc+1FTxh7VBrFKO2g0ty
Q31HrR+9aa2esQ1wunaA1tdAY+OtYxPdmm2qz9VcXVpo2kBocpQ=
-----END RSA PRIVATE KEY-----"""

RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIIBITANBgkqhkiG9w0BAQEFAAOCAQ4AMIIBCQKCAQBzWsvsddTnVgPd7Ao0qHR0
nPppYWYLDFL+LoS/ki4EN2k0pJxyxEj3XKWcPNGQoBxtRs0QFSqIN7lLs+TLiRHD
fP/Cn/LMnGrmJJblcoHbdB7i6iXSN1sXxKMBWmXQfqN+k0K0pD9N0nhHQwebyWGN
iaSpIPbRyyS5WD3mNhAQCL1q7Hu74SBxggyzNzeOGj5fvVTZpsopFXZ6mSc8FmmX
vjO5deV3NzE5VuJn/FL4P1+4bNAKKcFKIYVVVCDtGwQc24ufBbnEAAvHwT5giVLq
lkiRbUbKGyvQL9P5WJn4IVPFJgb6RdEFC44YUkq7PYv/eXSJuBVNi5xePrfuGDCr
AgMBAAE=
-----END PUBLIC KEY-----"""

# Password utilities

def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt(rounds=12)
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        plain.encode("utf-8"), hashed.encode("utf-8")
    )



# Token utilities


def create_access_token(data: dict) -> str:
    """Sign tokens with RS256 using our RSA private key."""
    from app.config import settings
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload.update({
        "exp": expire,
        "jti": secrets.token_hex(8),
    })
    return jwt.encode(payload, RSA_PRIVATE_KEY, algorithm="RS256")


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)

"""
pyjwt&python jose both block PEM keys as HMAC secrets at the library level, 
so the only way to make the vulnerability actually exploitable was to 
implement the HS256 verification path manually with raw hmac, 
bypassing the library's safety checks entirely. 
"""

"""def decode_access_token(token: str) -> dict:
    
    !! VULNERABLE !!
    Trusts the `alg` field from the unverified JWT header.
    If an attacker sets alg=HS256 and signs the token with the public key
    PEM bytes as the HMAC secret, this function will happily verify it.
    The public key is leaked via GET /health — that's the intended CTF path.

    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "RS256")

        if alg == "RS256":
            key = RSA_PUBLIC_KEY
        else:
            key = RSA_PUBLIC_KEY

        payload = jwt.decode(token, key, algorithms=[alg])
        return payload

    except ExpiredSignatureError:
        raise AppException(401, "TOKEN_EXPIRED", "Access token has expired")
    except JWTError:
        raise AppException(401, "TOKEN_INVALID", "Access token is invalid")
"""
def _b64url_decode(s):
    s += '=' * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)

def decode_access_token(token: str) -> dict:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise AppException(401, "TOKEN_INVALID", "You are not part of the crew")

        header = json.loads(_b64url_decode(parts[0]))
        alg = header.get("alg", "RS256")

        if alg == "RS256":
            # Normal verification via jose
            payload = jwt.decode(token, RSA_PUBLIC_KEY, algorithms=["RS256"])

        elif alg == "HS256":
            # VULNERABLE: manually verify using public key bytes as HMAC secret
            key_bytes = RSA_PUBLIC_KEY.strip().encode("utf-8")
            signing_input = f"{parts[0]}.{parts[1]}".encode()
            expected_sig = hmac.new(key_bytes, signing_input, hashlib.sha256).digest()
            
            actual_sig = _b64url_decode(parts[2])
            
            if not hmac.compare_digest(expected_sig, actual_sig):
                raise AppException(401, "TOKEN_INVALID", "You are not part of the crew")
            
            payload = json.loads(_b64url_decode(parts[1]))
            
            # Still check expiry
            import time
            if payload.get("exp", 0) < time.time():
                raise AppException(401, "TOKEN_EXPIRED", "Access token has expired")
        else:
            raise AppException(401, "TOKEN_INVALID", "You are not part of the crew")

        return payload

    except AppException:
        raise
    except Exception:
        raise AppException(401, "TOKEN_INVALID", "You are not part of the crew")