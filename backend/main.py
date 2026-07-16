import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="mutatED API",
    description="Agentic RAG Study Companion & Adaptive Curriculum Planner Backend",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon ease; narrow this down post-MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "message": "Welcome to the mutatED backend pipeline."
    }

if __name__ == "__main__":
    # Render routes traffic dynamically using the PORT environment variable
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)