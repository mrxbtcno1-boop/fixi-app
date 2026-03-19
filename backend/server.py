from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_context: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


MOTIVATION_QUOTES = [
    "Jeder Euro zählt. Du bist stärker als deine Schulden. 💪",
    "Der beste Zeitpunkt war gestern. Der zweitbeste ist jetzt. 🚀",
    "Schulden sind temporär. Deine Stärke ist permanent. 💎",
    "Kleine Schritte führen zu großen Veränderungen. 🌱",
    "Du bist nicht deine Schulden. Du bist so viel mehr. ❤️",
    "Heute ist ein guter Tag für deine Freiheit. ☀️",
    "Jede Zahlung ist ein Sieg. Feiere dich! 🎉",
    "Finanzielle Freiheit ist ein Marathon, kein Sprint. 🏃",
    "Du hast den Mut hinzuschauen. Das ist der erste Schritt. 🌟",
    "Dein zukünftiges Ich wird dir danken. 🙏",
]


@api_router.get("/")
async def root():
    return {"message": "Fixi API"}


@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "fixi-backend"}


@api_router.get("/quotes")
async def get_quotes():
    return {"quotes": MOTIVATION_QUOTES}


@api_router.get("/quote")
async def get_random_quote():
    return {"quote": random.choice(MOTIVATION_QUOTES)}


@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Validate non-empty message first
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein")
        
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        context_str = ""
        if request.user_context:
            for key, value in request.user_context.items():
                context_str += f"{key}: {value}. "

        system_msg = f"""Du bist Fixi – ein cleverer, einfühlsamer Finanz-Fuchs und persönlicher Schuldenberater.
Du sprichst immer in der 1. Person als Fixi ("Ich habe mir deine Ausgaben angeschaut...").
Du hilfst Menschen, ihre Schulden abzubauen.
Dein Ton ist warm, ermutigend und niemals wertend.
Du gibst praktische, umsetzbare Tipps.
Bei Krisen (Mahnungen, Inkasso) gibst du klare, beruhigende Handlungsanleitungen.
Antworte immer auf Deutsch.
Halte deine Antworten kurz und motivierend (2-4 Sätze, es sei denn der Nutzer fragt nach mehr Details).
Nutze gelegentlich Fuchs-Emojis 🦊 für Wärme.
{f'Nutzerkontext: {context_str}' if context_str else ''}"""

        history = await db.chat_messages.find(
            {"session_id": request.session_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(50)

        llm_key = os.environ['EMERGENT_LLM_KEY']

        chat_instance = LlmChat(
            api_key=llm_key,
            session_id=request.session_id,
            system_message=system_msg
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        for msg in history:
            if msg['role'] == 'user':
                chat_instance.messages.append({"role": "user", "content": msg['content']})
            else:
                chat_instance.messages.append({"role": "assistant", "content": msg['content']})

        user_msg = UserMessage(text=request.message)
        response = await chat_instance.send_message(user_msg)

        now = datetime.now(timezone.utc).isoformat()
        await db.chat_messages.insert_many([
            {
                "id": str(uuid.uuid4()),
                "session_id": request.session_id,
                "role": "user",
                "content": request.message,
                "timestamp": now
            },
            {
                "id": str(uuid.uuid4()),
                "session_id": request.session_id,
                "role": "assistant",
                "content": response,
                "timestamp": now
            }
        ])

        return ChatResponse(response=response, session_id=request.session_id)
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return {"messages": messages}


@api_router.delete("/chat/{session_id}")
async def clear_chat(session_id: str):
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"status": "cleared"}


class GoogleAuthRequest(BaseModel):
    session_id: str


@api_router.post("/auth/google/session")
async def google_auth_session(request: GoogleAuthRequest):
    """Exchange Emergent Auth session_id for Google user data"""
    try:
        async with httpx.AsyncClient(timeout=10) as http_client:
            resp = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Google-Anmeldung fehlgeschlagen")
            
            data = resp.json()
            email = data.get("email")
            name = data.get("name", "")
            picture = data.get("picture", "")
            session_token = data.get("session_token", "")

            if not email:
                raise HTTPException(status_code=400, detail="Keine E-Mail von Google erhalten")

            # Store/update user in DB
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            existing = await db.users.find_one({"email": email}, {"_id": 0})
            if existing:
                user_id = existing.get("user_id", user_id)
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"name": name, "picture": picture, "last_login": datetime.now(timezone.utc).isoformat()}}
                )
            else:
                await db.users.insert_one({
                    "user_id": user_id,
                    "email": email,
                    "name": name,
                    "picture": picture,
                    "auth_provider": "google",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "last_login": datetime.now(timezone.utc).isoformat(),
                })

            # Store session
            await db.user_sessions.insert_one({
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

            return {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Google-Anmeldung fehlgeschlagen")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
