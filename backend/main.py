import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import session, curriculum  # Import routers

app = FastAPI(
    title="mutatED API",
    description="Agentic RAG Study Companion & Adaptive Curriculum Planner Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Modular Action Controllers
app.include_router(session.router)
app.include_router(curriculum.router)

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "message": "Welcome to the mutatED backend pipeline."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)