from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from app.routes import auth, users, properties

app = FastAPI(title="WiseKey API")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(properties.router)

@app.get("/health")
def health():
    return {"status": "ok"}
