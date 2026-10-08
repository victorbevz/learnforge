from fastapi import FastAPI

from app.modules.auth.router import router as auth_router
from app.modules.courses.router import router as courses_router
from app.modules.topics.router import router as topics_router

app = FastAPI(title="LearnForge API")

app.include_router(auth_router, prefix="/api/v1")
app.include_router(courses_router, prefix="/api/v1")
app.include_router(topics_router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}