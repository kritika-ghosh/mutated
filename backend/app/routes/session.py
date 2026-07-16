import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models import SessionInitRequest
from app.services.rag_service import RAGService

router = APIRouter(prefix="/session", tags=["Session"])

# Local simulation store for session state mapping
ACTIVE_SESSIONS = {}

@router.post("/init")
async def initialize_session(goal: str = Form(...), file: UploadFile = File(None)):
    """Initializes a track session, parses accompanying PDFs, and generates the blueprint."""
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    uploaded_filename = "None"
    
    # 1. Process files if uploaded
    if file:
        uploaded_filename = file.filename
        temp_dir = "./data/temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{session_id}_{file.filename}")
        
        try:
            with open(temp_file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Index document text into the vector store
            RAGService.process_and_store_document(temp_file_path, file.filename)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File parsing error: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    # 2. Mock baseline initial curriculum array for fast front-end wireframing
    initial_curriculum = [
        {
            "id": "node_1",
            "title": f"Foundations of {goal[:20]}",
            "description": f"Core baseline overview targeting: {goal}",
            "estimated_hours": 3,
            "dependencies": [],
            "mastery_score": 0.0,
            "status": "unlocked",
            "child_nodes": [],
            "retrieved_chunk_ids": []
        },
        {
            "id": "node_2",
            "title": "Advanced Framework Applications",
            "description": "Deep dive structural exploration based on documents.",
            "estimated_hours": 5,
            "dependencies": ["node_1"],
            "mastery_score": 0.0,
            "status": "locked",
            "child_nodes": [],
            "retrieved_chunk_ids": []
        }
    ]
    
    # Save instance globally
    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "goal": goal,
        "filename": uploaded_filename,
        "curriculum": initial_curriculum,
        "agent_log": [{"timestamp": "2026-07-16T00:00:00Z", "message": "Blueprint initialized successfully."}]
    }
    
    return ACTIVE_SESSIONS[session_id]

@router.get("/{session_id}/state")
async def get_session_state(session_id: str):
    """Retrieves full blueprint progress data tree maps."""
    if session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Active study track session not found.")
    return ACTIVE_SESSIONS[session_id]