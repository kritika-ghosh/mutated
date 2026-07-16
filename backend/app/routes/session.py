import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.rag_service import RAGService

router = APIRouter(prefix="/session", tags=["Session"])

ACTIVE_SESSIONS = {}

@router.post("/init")
async def initialize_session(
    goal: str = Form(...), 
    files: List[UploadFile] = File(None)  # Changed from single file to a typing List
):
    """Initializes a track session, parses a list of PDFs/Markdown documents, and indexes them."""
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    processed_filenames = []
    
    # 1. Process multiple documents if uploaded
    if files:
        temp_dir = "./data/temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        for file in files:
            if not file.filename.strip():
                continue
                
            processed_filenames.append(file.filename)
            temp_file_path = os.path.join(temp_dir, f"{session_id}_{file.filename}")
            
            try:
                # Stream file payload down to the temp environment
                with open(temp_file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                # Append chunks into the shared vector catalog collection
                RAGService.process_and_store_document(temp_file_path, file.filename)
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error parsing {file.filename}: {str(e)}")
            finally:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

    # 2. Setup baseline dynamic timeline map array
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
    
    # Save session state profile mapping parameters
    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "goal": goal,
        "filenames": processed_filenames,  # Track all added files
        "curriculum": initial_curriculum,
        "agent_log": [{"timestamp": "2026-07-16T00:00:00Z", "message": f"Blueprint initialized successfully with {len(processed_filenames)} resources."}]
    }
    
    return ACTIVE_SESSIONS[session_id]

@router.get("/{session_id}/state")
async def get_session_state(session_id: str):
    if session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Active study track session not found.")
    return ACTIVE_SESSIONS[session_id]