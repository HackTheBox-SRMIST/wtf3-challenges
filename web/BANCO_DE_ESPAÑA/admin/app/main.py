import uuid
import base64   
from contextlib import asynccontextmanager
from datetime import datetime, timezone


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import select
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter
from app.core.security import RSA_PUBLIC_KEY, hash_password
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.database import AsyncSessionLocal, Base, engine
from app.models.user import User
from app.models import note, refresh_token  # noqa: F401 — ensure models are registered
from app.routers import auth, notes, admin


# Startup helpers

async def _create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _seed_users() -> None:
    """
    Seed the database with initial users if they don't already exist.
    """
    admin_password_hash = hash_password("$3cr3t-adm1n-p@ssw0rd-N0T_useful_4_CTF!")
    player_password_hash = hash_password("player123")

    async with AsyncSessionLocal() as session:
        for email, pw_hash, role in [
            ("admin@notes.ctf", admin_password_hash, "admin"),
            ("player@notes.ctf", player_password_hash, "user"),
        ]:
            result = await session.execute(select(User).where(User.email == email))
            if result.scalar_one_or_none() is None:
                session.add(User(email=email, password_hash=pw_hash, role=role))
        await session.commit()


# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    await _create_tables()
    await _seed_users()
    yield


# App
app = FastAPI(
    title="Notes Management API",
    description=(
        "A fully functional REST API for managing personal notes.\n\n"
        "## Features\n"
        "- JWT Authentication — register, login, refresh tokens\n"
        "- Personal Notes CRUD — create, read, update, delete with ownership enforcement\n"
        "- Search & Pagination — case-insensitive title search, sort, paginate\n"
        "- Role-Based Access Control — admin endpoints for managing all notes and users\n\n"
        "## Authentication\n"
        "Use `POST /api/auth/login` to obtain a Bearer token, then click Authorize above."
    ),
    version="1.0.0",
    lifespan=lifespan,
    redoc_url=None,
    openapi_tags=[
        {"name": "Authentication", "description": "Register, login, and refresh JWT tokens"},
        {"name": "Notes", "description": "Create and manage your personal notes"},
        {"name": "Admin", "description": "Admin-only endpoints — requires `admin` role"},
        {"name": "Health", "description": "Service health check"},
    ],
)

app.state.limiter = limiter


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    max_size = 1 * 1024 * 1024  # 1 MB
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > max_size:
        return JSONResponse(
            status_code=413,
            content={"error": {"code": "PAYLOAD_TOO_LARGE", "message": "Request body exceeds the 1 MB limit"}},
        )
    return await call_next(request)


app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

RTFD_KEY = base64.b64encode(RSA_PUBLIC_KEY.encode('utf-8')).decode('utf-8')


# Health check
@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "message": "Service is running",
        "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "RTFD": RTFD_KEY
    }
