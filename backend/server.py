from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Depends, Response
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response as StarletteResponse
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import uuid
import jwt
import bcrypt
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage
from datetime import datetime, timezone, timedelta

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
APP_NAME = os.environ.get('APP_NAME', 'clinica-amici')
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Storage ----------------
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=180)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key}, timeout=120)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ---------------- Auth ----------------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode("utf-8"), h.encode("utf-8"))
    except Exception:
        return False

def create_access_token(uid: str, email: str) -> str:
    payload = {"sub": uid, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"email": payload.get("email")})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return {"email": user["email"], "name": user.get("name", "Admin")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ---------------- Default content ----------------
def default_content():
    return {
        "brand": {"name": "ÂMICI", "tagline": "Clínica Âmici · Cirurgia Plástica e Estética"},
        "intro": {"word": "ÂMICI", "subtitle": "Cirurgia Plástica & Estética"},
        "hero": {
            "eyebrow": "Dra. Alice Vasconcelos · CRM 4523-SE",
            "title": "Liberdade é estar\nfeliz consigo mesma",
            "subtitle": "Cirurgia plástica, íntima e estética com um olhar humano, seguro e artístico — em Aracaju, Sergipe.",
            "cta": "Agende sua avaliação",
            "image": "https://images.unsplash.com/photo-1763677594421-f58e50cce64d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
            "video": ""
        },
        "scalpel": {
            "eyebrow": "Precisão que transforma",
            "title": "Cada detalhe,\num corte de arte",
            "text": "Técnica refinada, segurança e sensibilidade estética em cada procedimento."
        },
        "chapters": [
            {"n": "01", "title": "Cuidar de si é um ato de amor", "text": "A maternidade nos ensina a amar sem medidas — sem esquecer da mulher que existe em você."},
            {"n": "02", "title": "Cirurgia com propósito", "text": "Da cirurgia íntima à reconstrutora para pacientes oncológicos do HUSE, cada plano é único."},
            {"n": "03", "title": "Resultados naturais", "text": "Harmonia, proporção e naturalidade guiam cada decisão cirúrgica."}
        ],
        "gallery": [
            {"id": str(uuid.uuid4()), "title": "Equipe Âmici", "image": "https://images.unsplash.com/photo-1648775507324-b48dd3791fa5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
            {"id": str(uuid.uuid4()), "title": "Cuidado", "image": "https://images.unsplash.com/photo-1778184423837-d5a47ffe23d5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
            {"id": str(uuid.uuid4()), "title": "Estética", "image": "https://images.unsplash.com/photo-1762103170506-5b2e28075ec6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"}
        ],
        "results": [
            {"id": str(uuid.uuid4()), "title": "Mastopexia com prótese", "before": "https://images.unsplash.com/photo-1763677594421-f58e50cce64d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", "after": "https://images.unsplash.com/photo-1762103170506-5b2e28075ec6?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"}
        ],
        "testimonials": [
            {"id": str(uuid.uuid4()), "name": "Paciente Âmici", "text": "Me senti segura e acolhida do início ao fim. O resultado superou minhas expectativas.", "rating": 5}
        ],
        "history": [
            {"id": str(uuid.uuid4()), "year": "Formação", "title": "UFS", "text": "Medicina pela Universidade Federal de Sergipe."},
            {"id": str(uuid.uuid4()), "year": "Residência", "title": "Cirurgia Geral & Plástica", "text": "Hospital Universitário — UFS."},
            {"id": str(uuid.uuid4()), "year": "Hoje", "title": "Idealizadora da Clínica Âmici", "text": "Cirurgia plástica reconstrutora e estética."}
        ],
        "videos": [],
        "assistant": {
            "title": "Tire suas dúvidas com a Dra. Alice",
            "subtitle": "Assistente virtual · tire suas dúvidas sobre procedimentos, recuperação e cuidados",
            "image": "https://images.unsplash.com/photo-1763677594421-f58e50cce64d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
            "greeting": "Olá! Sou a assistente virtual da Dra. Alice. Como posso te ajudar hoje? 💛"
        },
        "doctor": {
            "name": "Dra. Alice Vasconcelos",
            "role": "Cirurgiã Plástica · CRM 4523-SE · RQE 4649",
            "bio": "Idealizadora da Clínica Âmici. Cirurgia plástica, íntima, estética e reconstrutora.",
            "image": "https://images.unsplash.com/photo-1763677594421-f58e50cce64d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000"
        },
        "contact": {
            "whatsapp": "5579999999999",
            "instagram": "https://instagram.com/clinicamici",
            "address": "Aracaju · Sergipe",
            "email": "contato@clinicamici.com"
        }
    }

# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Clínica Âmici API"}

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    email = (body.get("email") or ADMIN_EMAIL).lower().strip()
    password = body.get("password") or ""
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    token = create_access_token(str(user.get("_id")), user["email"])
    response.set_cookie("access_token", token, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")
    return {"token": token, "user": {"email": user["email"], "name": user.get("name", "Admin")}}

@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api_router.get("/content")
async def get_content():
    doc = await db.content.find_one({"_id": "site"})
    if not doc:
        content = default_content()
        await db.content.insert_one({"_id": "site", **content})
        return content
    doc.pop("_id", None)
    return doc

@api_router.put("/content")
async def update_content(request: Request, admin: dict = Depends(get_current_admin)):
    body = await request.json()
    body.pop("_id", None)
    await db.content.update_one({"_id": "site"}, {"$set": body}, upsert=True)
    return {"ok": True}

@api_router.post("/upload")
async def upload(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    fid = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{fid}.{ext}"
    data = await file.read()
    ctype = file.content_type or "application/octet-stream"
    result = put_object(path, data, ctype)
    await db.files.insert_one({
        "id": fid, "storage_path": result["path"], "original_filename": file.filename,
        "content_type": ctype, "size": result.get("size", len(data)),
        "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()
    })
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', '')
    return {"url": f"/api/files/{result['path']}", "path": result["path"], "content_type": ctype}

@api_router.get("/files/{path:path}")
async def download(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    data, content_type = get_object(path)
    return StarletteResponse(content=data, media_type=record.get("content_type", content_type),
                             headers={"Cache-Control": "public, max-age=31536000"})

chat_sessions = {}

ALICE_PERSONA = (
    "Você é a assistente virtual da Dra. Alice Vasconcelos, cirurgiã plástica (CRM 4523-SE, RQE 4649) "
    "e idealizadora da Clínica Âmici, em Aracaju/Sergipe. Fale sempre em português do Brasil, com um tom "
    "acolhedor, elegante, humano e profissional. Ajude pacientes com dúvidas gerais sobre cirurgia plástica, "
    "estética, cirurgia íntima, recuperação e cuidados. Seja empática e use, com moderação, o emoji 💛. "
    "NUNCA forneça diagnósticos definitivos, prescrições ou substitua uma consulta médica presencial: "
    "sempre reforce que uma avaliação individual com a Dra. Alice é essencial e convide a paciente a agendar "
    "uma avaliação pela clínica. Respostas curtas e claras (2 a 5 frases)."
)

@api_router.post("/chat")
async def chat(request: Request):
    body = await request.json()
    message = (body.get("message") or "").strip()
    session_id = body.get("session_id") or str(uuid.uuid4())
    if not message:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="LLM não configurado")
    if session_id not in chat_sessions:
        chat_sessions[session_id] = LlmChat(
            api_key=EMERGENT_KEY, session_id=session_id, system_message=ALICE_PERSONA
        ).with_model("openai", "gpt-5.4")
    llm = chat_sessions[session_id]
    try:
        reply = await llm.send_message(UserMessage(text=message))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=502, detail="Não consegui responder agora, tente novamente.")
    await db.chats.insert_one({
        "session_id": session_id, "user": message, "assistant": reply,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"reply": reply, "session_id": session_id}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if existing is None:
        await db.users.insert_one({
            "email": ADMIN_EMAIL.lower(), "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin Âmici", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin seeded")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL.lower()},
                                  {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
    if not await db.content.find_one({"_id": "site"}):
        await db.content.insert_one({"_id": "site", **default_content()})
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
