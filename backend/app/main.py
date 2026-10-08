from fastapi import FastAPI

from app.modules.auth.router import router as auth_router

app = FastAPI(title="LearnForge API")

app.include_router(auth_router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}