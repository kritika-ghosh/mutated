# 🚀 mutatED Backend Service

Welcome to the **mutatED** backend repository. This project is a dedicated, production-hosted FastAPI AI Agent service that provides localized Retrieval-Augmented Generation (RAG) and autonomous AI planning loops for **OmniVault**.

---

## 🏛️ Architectural Context

> [!NOTE]
> **No Longer Standalone**
> This repository is **not** a standalone application anymore. It functions as the specialized backend engine for the **OmniVault** desktop/web dashboard, serving all adaptive study track, curriculum mutation, and quiz generation requests.

### 🧠 Why Keep It Separate?
We deliberately maintain `mutatED` as a separate backend service on its own Render cloud space rather than merging it directly into OmniVault's main hosting instance. This isolation provides two major benefits:
1. **Memory Allocation for RAG**: ChromaDB vector databases, PDF text extractors (`pypdf`), semantic chunking processes, and deep planning LLM pipelines require substantial, uninterrupted memory. By isolating this service, the Render space has **maximum memory resources** dedicated entirely to RAG pipelines and vector matching.
2. **Independent Scaling**: The curriculum mutation loops can be scaled independently of the primary workspace debt analysis backend.

---

## 🌐 Infrastructure Parameters

* **Production Endpoint Base**: `https://mutated-backend.onrender.com`
* **Response Protocol**: Strict `application/json` payloads.
* **Authentication**: None (MVP Tier).
* **Performance Note**: Free-tier Render hosting spins down after 15 minutes of inactivity. The client-side dashboard implements a loading screen to handle initial 30–50 second wake-up delays. Subsequent requests execute in milliseconds via Groq's high-speed LPU infrastructure.

---

## 📑 Core API Endpoints Reference

### 1. Session Lifecycle (`/session`)
Manages curriculum track initialization.
* **`POST /session/init`**
  - **Content-Type**: `multipart/form-data`
  - **Payload**:
    - `goal` (string): The user's study goal (e.g., "Master Transformers in 4 Weeks").
    - `files` (List of PDF/Markdown Blobs): Uploaded reference materials.
  - **Returns**: Initial curriculum JSON containing structured nodes, dependencies, and agent logs.
* **`GET /session/{session_id}/state`**
  - **Returns**: The current state of the curriculum and planning history log.

### 2. Adaptive Curriculum Planner (`/curriculum`)
Fetches grounded references and processes quizzes.
* **`GET /curriculum/{session_id}/node/{node_id}/context?description={desc}`**
  - **Returns**: Context chunks semantically retrieved from vector storage matching the node description.
* **`GET /curriculum/{session_id}/node/{node_id}/quiz?description={desc}`**
  - **Returns**: A zero-hallucination, 3-question MCQ quiz grounded on the retrieved context.
* **`POST /curriculum/{session_id}/node/{node_id}/submit`**
  - **Payload**: User answers and confidence score (1 to 5).
  - **Action**: Computes mastery, runs the replan agent to inject remediation steps if necessary, and returns the mutated curriculum.

### 3. Agent Log Terminal (`/agent`)
* **`GET /agent/{session_id}/log`**
  - **Returns**: Autonomous action and reasoning logs for live console feeds.
* **`POST /agent/{session_id}/replan?target_node_id={node_id}`**
  - **Action**: Manually triggers a replan loop with a mock failure score for testing dynamic remediation mutations.

---

## 🛠️ Local Development & Deployment

### 1. Installation
Install the python requirements in a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
GROQ_API_BASE=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
CHROMA_PERSIST_DIR=./data/chroma_data
SESSION_STORE_DIR=./data/sessions
ENVIRONMENT=development
```

### 3. Running Locally
Start the server using Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
