from fastapi import APIRouter, HTTPException
from app.services.quiz_engine import quiz_engine
from app.services.rag_service import RAGService
from app.routes.session import ACTIVE_SESSIONS

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

@router.get("/{session_id}/node/{node_id}/context")
async def get_node_context(session_id: str, node_id: str, description: str):
    """Extracts top RAG content chunks bound specifically to a designated module node target."""
    if session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Session session_id context error.")
        
    context = RAGService.retrieve_relevant_context(description, n_results=3)
    return {"node_id": node_id, "retrieved_context": context}

@router.get("/{session_id}/node/{node_id}/quiz")
async def get_node_quiz(session_id: str, node_id: str, description: str):
    """Generates a contextualized 3-question MCQ quiz for a specific node using Groq."""
    if session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Session context trace dropped out.")
        
    questions = quiz_engine.generate_quiz_for_node(description)
    return {"node_id": node_id, "quiz_questions": questions}