# Product Requirement Document (PRD) – StudyAgent

**Agentic RAG Study Companion & Adaptive Curriculum Planner**

**Document Version:** 2.0 (Formal)  
**Status:** Final Draft for Implementation  
**Target Timeline:** 4‑Week Hackathon (Software Track)  
**Last Updated:** July 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [Scope & Objectives](#2-scope--objectives)  
3. [Target Audience & Personas](#3-target-audience--personas)  
4. [System Architecture Overview](#4-system-architecture-overview)  
5. [Core Component Specifications](#5-core-component-specifications)  
   - 5.1 Localized RAG Core (Ingestion & Grounding)  
   - 5.2 The Adaptive Quiz Engine  
   - 5.3 The Agentic Re‑Planning Loop (Mutation Engine)  
6. [Data Models & State Management](#6-data-models--state-management)  
7. [API Design & Integration](#7-api-design--integration)  
8. [User Interface & Dashboard](#8-user-interface--dashboard)  
9. [Non‑Functional Requirements](#9-non‑functional-requirements)  
10. [High‑Impact Demo Script](#10-high‑impact-demo-script)  
11. [Future Roadmap](#11-future-roadmap)  
12. [Glossary](#12-glossary)  
13. [Appendices](#13-appendices)  
   - A. Sample Curriculum Node JSON  
   - B. Quiz Generation Prompt Template  
   - C. Agent Re‑Planning Prompt Template  
   - D. Environment Variables & Configuration  

---

## 1. Executive Summary

### 1.1 Problem Statement
Most AI study tools are **static** – they generate a one‑time study plan and then abandon the user. If a student struggles with a particular topic, the plan does not adapt; it pushes them forward regardless. Similarly, standard Retrieval‑Augmented Generation (RAG) chatbots answer isolated questions but lack pedagogical structure, long‑term memory, or objective tracking. Students need a companion that **learns with them** and adjusts the curriculum dynamically based on their actual performance.

### 1.2 StudyAgent Solution
**StudyAgent** is an intelligent, agentic learning companion that pairs hyper‑localized RAG with a continuous feedback loop. It:

1. Ingests source materials (PDFs/Markdown) and a high‑level learning goal.
2. Constructs an evolving curriculum roadmap.
3. Dynamically tests the user via RAG‑grounded adaptive quizzing.
4. Feeds quiz performance into an **agentic loop** that actively mutates, adjusts, and re‑sequences the curriculum based on conceptual mastery.

This creates a closed‑loop system where the curriculum evolves in real time to address the student’s weaknesses, ensuring true understanding rather than passive consumption.

### 1.3 Core Differentiators
- **True Agentic Loop** – Execution, evaluation, and re‑planning; the system changes its own future behaviour based on user metrics.
- **Zero Hardware** – 100% web‑based, ensuring predictable demo delivery.
- **Deep Domain Authenticity** – Pre‑loaded technical tracks (e.g., *Mastering Transformers*) make the demo convincing to technical judges.
- **RAG Grounding** – All quiz questions and remediation content are strictly sourced from the provided materials, eliminating hallucination.

---

## 2. Scope & Objectives

### 2.1 In‑Scope (Hackathon MVP)
- Single‑user, single‑session environment (state persisted in browser local storage and/or backend JSON files).
- Ingestion of **Markdown** and **cleanly segmented PDF** files (text extraction via PyPDF2 or pdfplumber).
- Vector storage with **ChromaDB** (local or in‑memory).
- Pre‑loaded demo track: *“Mastering Transformers in 4 Weeks”* with a provided PDF textbook.
- Curriculum generation via LLM (using an OpenAI‑compatible API or local model) based on source materials and goal.
- Adaptive quiz generation:
  - Multiple‑choice or short‑answer questions.
  - Evaluation against correct answers and error type classification (syntax vs. conceptual).
- Mastery scoring and state transitions (as defined in Section 5.3).
- Agentic re‑planning: insertion, removal, or re‑ordering of curriculum nodes based on mastery.
- Interactive dashboard:
  - Left panel: evolving roadmap with coloured nodes (Green = mastered, Orange = shaky, Red = blocked, Grey = locked).
  - Right panel: workspace switching between context view, quiz mode, and agent feedback log.
- Responsive web application (desktop‑first).

### 2.2 Out‑of‑Scope (MVP)
- Multi‑user authentication, cloud profiles, or persistent accounts.
- Complex OCR for scanned PDFs (only text‑based PDFs).
- Arbitrary file types (e.g., .docx, .ppt, YouTube URLs).
- Free‑form essay grading.
- Mobile apps (web‑only).
- External integrations (e.g., Notion, Google Calendar) – may be considered for future.

---

## 3. Target Audience & Personas

| Persona | Description | Needs & Pain Points |
|---------|-------------|----------------------|
| **Self‑Learner (Primary)** | Motivated individual (student or professional) studying a technical subject independently. | – Structured yet flexible learning path.<br>– Immediate feedback and targeted remediation.<br>– Avoids wasted time on already‑mastered topics. |
| **Instructor / Mentor (Secondary)** | Educator who wants to provide adaptive assignments to students. | – Insight into each student’s mastery gaps.<br>– Automated generation of remedial exercises.<br>– Saves time on manual curriculum adjustments. |
| **Hackathon Judge** | Technical evaluator looking for innovation and working prototype. | – Clear demonstration of closed‑loop adaptation.<br>– Visible agent reasoning.<br>– Realistic and well‑grounded educational use case. |

---

## 4. System Architecture Overview

StudyAgent is a **web application** with a backend API, a vector database, and a frontend UI. The core intelligence is driven by an LLM agent that coordinates planning, quizzing, and re‑planning.

```
┌───────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  - Roadmap Visualization (D3.js or React Flow)                 │
│  - Workspace (Context/Quiz/Agent Log)                         │
│  - State Management (Redux or Context)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST / WebSocket (for live updates)
┌───────────────────────────▼─────────────────────────────────────┐
│                         BACKEND (FastAPI)                       │
│  - Ingestion & Chunking Pipeline                                │
│  - ChromaDB Interface                                          │
│  - Curriculum State Manager (in‑memory / JSON)                 │
│  - Quiz Engine                                                 │
│  - Agentic Re‑Planning Engine (LLM orchestration)              │
│  - Session API                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │    ChromaDB (Vector)   │
                │   (local persistence)  │
                └───────────────────────┘
```

**Data Flow (Agentic Loop):**
1. User uploads source materials and defines a learning goal.
2. Backend chunks documents, embeds them (using a sentence‑transformer or OpenAI embeddings), and stores in ChromaDB.
3. The LLM agent generates an initial curriculum (list of topics/nodes) based on the goal and source context.
4. User engages with the system:
   - They can view context (retrieved chunks) for a current node.
   - They take a quiz generated from the RAG context of that node.
5. Quiz responses are evaluated; mastery scores are updated.
6. The agent re‑evaluates the entire curriculum state and, if needed, issues a re‑plan (mutation) – inserting, removing, or re‑ordering nodes.
7. The updated roadmap is pushed to the frontend in real time.

---

## 5. Core Component Specifications

### 5.1 Localized RAG Core (Ingestion & Grounding)

#### 5.1.1 Document Processing
- **Supported formats:** Markdown (`.md`) and text‑based PDF (`.pdf`).
- **Chunking strategy:** Sliding window with:
  - Chunk size: 512 tokens (approx. 400 words).
  - Overlap: 10% (∼50 tokens) to preserve context across boundaries.
- **Embedding model:** Use `all‑MiniLM‑L6‑v2` (sentence‑transformers) for local embedding or OpenAI’s `text‑embedding‑ada‑002` for higher quality. For hackathon, local embedding avoids API costs and latency.
- **Vector store:** ChromaDB running in‑memory or persisted to disk (`./chroma_data`). Collection named `studyagent_corpus`.

#### 5.1.2 Retrieval
- When generating a quiz for a specific curriculum node, the system retrieves the top‑k (k=5) most relevant chunks from ChromaDB using the node’s description as query.
- Retrieved chunks are passed to the LLM as context for quiz generation.

#### 5.1.3 Fact Grounding
- System prompt for quiz generation:
  > “You are an educational quiz generator. Generate a question (multiple‑choice or short‑answer) that tests understanding of the concept described below. **Use ONLY the provided context** to formulate the question and the correct answer. If the context does not cover a specific detail, do not invent it. If you cannot generate a high‑quality question from the context, state that explicitly.”

### 5.2 The Adaptive Quiz Engine

#### 5.2.1 Question Generation
- For each curriculum node, the engine sends a prompt to the LLM (with retrieved chunks) to produce:
  - 3 multiple‑choice questions (with 4 options each, one correct).
  - Or 2 short‑answer questions (with expected keywords/phrases).
- The type can be toggled based on user preference (default: MCQs for rapid assessment).

#### 5.2.2 Answer Evaluation
- **MCQ:** Direct comparison of user selection to correct option.
- **Short‑answer:** Use LLM to judge semantic similarity between user answer and expected answer (or use a simple keyword matching with fuzzy threshold for hackathon).
- **Error classification:** The engine also classifies the error (if wrong) into:
  - `syntax_error` – misunderstanding of notation or terminology.
  - `conceptual_error` – fundamental misunderstanding of the idea.
  - `attentional_error` – user misread the question (no further action).
  This classification is done by the LLM based on the user’s answer and the correct one.

#### 5.2.3 Confidence Rating
- After each quiz, ask the user to rate their confidence in the topic on a scale of 1–5. This is used in the mastery score calculation (Section 5.3.1).

### 5.3 The Agentic Re‑Planning Loop (Mutation Engine)

#### 5.3.1 Mastery Score Calculation
For each curriculum node, the mastery score `M` (0.0 to 1.0) is computed as:
```
M = (quiz_accuracy * 0.7) + (normalized_confidence * 0.3)
```
where `quiz_accuracy` is the fraction of correct answers in the most recent quiz, and `normalized_confidence = (user_confidence - 1) / 4` (if 1–5 scale). If no quiz has been taken, `M = 0.0`.

#### 5.3.2 State Transition Rules
The agent evaluates `M` after each quiz and applies the following rules:

| Condition | Action |
|-----------|--------|
| `M >= 0.8` | Node marked **Mastered** (green). Unlock all downstream dependencies (if any). Optionally accelerate the timeline (reduce estimated time). |
| `0.5 <= M < 0.8` | Node marked **Shaky** (orange). The agent inserts a **remediation sub‑node** immediately after the current node (or as a nested child) focused on the weak areas. The sub‑node is generated by retrieving additional chunks related to the user’s errors. Also schedule a review quiz (simulated in 48 hours, but in MVP it can be shown as a future task). |
| `M < 0.5` | Node marked **Blocked** (red). The agent pauses all downstream nodes. It splits the current node into 2–3 simpler foundational sub‑nodes (derived from the RAG store) and re‑allocates the timeline. The original node becomes a parent; the new sub‑nodes must be mastered before proceeding. |

#### 5.3.3 Re‑Planning Execution
- The agent (LLM) is given the current curriculum state (list of nodes with their mastery scores) and the set of source chunks (via RAG). It then outputs a **mutation plan** in a structured JSON format specifying:
  - Nodes to add (with title, description, estimated hours, dependencies).
  - Nodes to remove (if any).
  - Re‑ordering instructions.
- The backend applies the mutation and updates the state.

#### 5.3.4 Agent Logging
- Every re‑planning action is recorded in a human‑readable log (e.g., *“System: User struggled with ‘Self‑Attention Weights’. Mutating Week 2 curriculum to inject 2 auxiliary foundational reading blocks from Source Document B.”*). This log is shown in the UI’s Agent Feedback Log panel.

---

## 6. Data Models & State Management

### 6.1 Session State (JSON)
The entire session state is stored as a JSON object on the backend (and optionally synced to browser local storage). The structure:

```json
{
  "session_id": "sess-abc123",
  "goal": "Master Transformers in 4 weeks",
  "source_documents": [
    { "id": "doc1", "filename": "attention_is_all_you_need.pdf", "chunks": [...] }
  ],
  "curriculum": {
    "nodes": [
      {
        "id": "node_1",
        "title": "Introduction to Attention",
        "description": "Understanding the basic attention mechanism...",
        "estimated_hours": 2,
        "dependencies": [],
        "mastery_score": 0.75,
        "status": "shaky",        // mastered | shaky | blocked | locked
        "child_nodes": [],        // for remediation sub‑nodes
        "quiz_history": [
          {
            "timestamp": "2026-07-07T10:00:00Z",
            "questions": [...],
            "accuracy": 0.67,
            "user_confidence": 4
          }
        ],
        "retrieved_chunk_ids": ["chunk_12", "chunk_45"]
      }
    ],
    "version": 2,
    "last_modified": "2026-07-07T10:15:00Z"
  },
  "agent_log": [
    { "timestamp": "...", "message": "Initial curriculum generated." },
    { "timestamp": "...", "message": "User failed quiz on node_1. Re‑planning..." }
  ]
}
```

### 6.2 Quiz Question Schema
```json
{
  "id": "q_001",
  "type": "mcq",   // or "short_answer"
  "question": "What is the role of the Query matrix in scaled dot‑product attention?",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "B",
  "source_chunk_ids": ["chunk_12"],
  "concept_tags": ["attention", "linear algebra"]
}
```

### 6.3 Mutation Plan Schema (from LLM)
```json
{
  "action": "mutate",
  "add_nodes": [
    {
      "title": "Matrix Multiplication in Attention",
      "description": "Review of matrix multiplication as used in Q, K, V projections.",
      "estimated_hours": 1,
      "dependencies": ["node_1"],
      "position": "after node_1"
    }
  ],
  "remove_nodes": [],
  "reorder": [],
  "agent_rationale": "User struggled with QKV matrices, so added a remediation sub‑node."
}
```

---

## 7. API Design & Integration

All APIs are RESTful; WebSocket is used for real‑time updates (optional for hackathon; polling can suffice).

| Endpoint | Method | Payload | Description |
|----------|--------|---------|-------------|
| `/session/init` | POST | `{goal, document_urls?}` | Creates a new session, ingests documents, generates initial curriculum. |
| `/session/state` | GET | – | Returns full session state. |
| `/curriculum/node/{node_id}/quiz` | GET | – | Generates a new quiz for the given node (returns questions). |
| `/curriculum/node/{node_id}/quiz/submit` | POST | `{answers: [...], confidence: 3}` | Submits quiz answers; updates mastery and triggers re‑planning if needed. |
| `/curriculum/node/{node_id}/context` | GET | – | Retrieves top‑k chunks for the node for display. |
| `/agent/log` | GET | – | Returns agent log. |
| `/agent/replan` | POST | (empty) | Force re‑planning (for demo). |

All endpoints return JSON.

---

## 8. User Interface & Dashboard

### 8.1 Layout
The UI is split into two main panels:

**Left Panel – The Evolving Roadmap**
- Vertical node tree (using React Flow or D3.js).
- Each node displays its title, estimated hours, and status colour:
  - 🟢 Green: Mastered (M ≥ 0.8)
  - 🟠 Orange: Shaky (0.5 ≤ M < 0.8)
  - 🔴 Red: Blocked (M < 0.5)
  - ⚪ Grey: Locked (dependencies not yet mastered)
- Nodes can be clicked to select them, updating the right panel.

**Right Panel – Active Workspace**
- Three tabs:
  1. **Context** – Shows the retrieved chunks for the selected node (with source attribution).
  2. **Quiz** – Displays the current quiz questions with interactive elements (radio buttons or text inputs). After submission, shows results and mastery update.
  3. **Agent Log** – Displays a scrollable terminal‑style feed of agent decisions.

### 8.2 Interaction Flow
- On initial load, the user is presented with a setup page: enter goal and upload documents (or choose a pre‑loaded demo).
- After clicking “Generate Blueprint”, the roadmap appears.
- User clicks on a node (e.g., Week 1) → the context panel shows relevant material.
- User clicks “Take Quiz” → quiz mode appears; they answer and submit.
- After submission, the mastery score updates, and if re‑planning is triggered, the roadmap animates to reflect the changes (nodes move, colours change).
- The agent log tab shows reasoning.

### 8.3 Responsive Design
- Desktop‑first with a minimum width of 1024px.
- Uses a clean, modern design with a dark/light theme toggle.

---

## 9. Non‑Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Quiz generation must complete within 5 seconds. Roadmap rendering must be smooth (60 fps). |
| **Reliability** | All state is persisted in‑memory; session can be refreshed via a session ID in URL (if using JSON file storage). |
| **Scalability** | MVP only supports one user; architecture allows scaling by adding stateless API servers. |
| **Usability** | Clear navigation; error messages; progress indicators. |
| **Security** | No authentication required; all data is local to the user’s session. |
| **Maintainability** | Code must be well‑documented; use environment variables for API keys. |

---

## 10. High‑Impact Demo Script

### Act I: Setting the Trajectory (1 minute)
1. Open the web app; click “Start New Session.”
2. Type goal: *“Master Transformers in 4 Weeks”* and upload the provided PDF (e.g., the original “Attention Is All You Need” paper or a textbook chapter).
3. Click “Generate Blueprint” – the backend ingests, chunks, embeds, and calls the LLM to produce an initial 4‑week roadmap. The roadmap appears on the left with all nodes greyed out except Week 1.
4. Narrate: *“Our system has analysed the source material and built a logical curriculum. Now let’s see how it adapts.”*

### Act II: Proving the Adaptive Agent (1.5 minutes)
1. Click on “Week 1: Attention Mechanisms” – the right panel shows context.
2. Click “Take Quiz” – answer the first two questions correctly, but **intentionally** fail the third (which asks about QKV matrices).
3. Submit – the backend calculates a low mastery score (M ≈ 0.35).
4. Immediately, the agent log updates with: *“User struggled with QKV matrices. Re‑planning...”*
5. Watch the roadmap animate: a new sub‑node *“Remediation: Matrix Multiplication in Attention”* appears under Week 1, and downstream nodes (Week 2) are shifted slightly later. The node colour changes to red/orange.

### Act III: The Win (0.5 minute)
1. Click the new remediation node, take a short follow‑up quiz (this time answering correctly).
2. The node turns green; the agent compresses the timeline (reschedules).
3. The dashboard shows a clear path forward. Conclude: *“Most AI platforms give you a static plan. StudyAgent actively adapts to your weaknesses, ensuring you master every concept before moving on.”*

---

## 11. Future Roadmap

| Phase | Feature | Description |
|-------|---------|-------------|
| **Post‑Hackathon** | Persistent Accounts | User authentication and cloud storage of sessions. |
| | Multi‑Document Ingestion | Support for arbitrary file types (DOCX, PPT, web pages). |
| | Collaborative Learning | Shared curricula for study groups. |
| | Advanced Analytics | Detailed reports on progress, time spent, etc. |
| | Integration with Calendars | Suggest study sessions based on user’s calendar. |
| | Spaced Repetition Scheduler | Automatically schedule review quizzes based on forgetting curves. |
| | Open‑Source Model Support | Replace OpenAI with local LLMs (e.g., Llama 3) for full offline capability. |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval‑Augmented Generation – enhancing LLM output with external knowledge retrieval. |
| **Agentic Loop** | An autonomous cycle of execute → evaluate → re‑plan. |
| **Mastery Score** | Numerical value (0–1) indicating a student’s proficiency on a topic. |
| **Mutation** | The act of the agent altering the curriculum structure (add/remove/reorder nodes). |
| **Chunking** | Splitting a large document into smaller, context‑preserving segments for embedding. |
| **ChromaDB** | An open‑source vector database for storing embeddings and performing similarity search. |

---

## 13. Appendices

### A. Sample Curriculum Node (JSON)
```json
{
  "id": "node_w1_attention",
  "title": "Introduction to Attention",
  "description": "Understand the core concept of attention, including query, key, value, and the scaled dot‑product.",
  "estimated_hours": 2,
  "dependencies": [],
  "mastery_score": 0.35,
  "status": "blocked",
  "child_nodes": [
    {
      "id": "node_w1_rem1",
      "title": "Remediation: Matrix Multiplication in Attention",
      "description": "Detailed review of matrix operations used in attention heads.",
      "estimated_hours": 1,
      "dependencies": ["node_w1_attention"],
      "mastery_score": 0.0,
      "status": "locked"
    }
  ],
  "quiz_history": [
    {
      "timestamp": "2026-07-07T14:30:00Z",
      "accuracy": 0.33,
      "user_confidence": 3,
      "questions": [...]
    }
  ],
  "retrieved_chunk_ids": ["chunk_12", "chunk_45", "chunk_78"]
}
```

### B. Quiz Generation Prompt Template
```
You are an educational quiz generator for a self‑learning AI course.

Generate 3 multiple‑choice questions (each with 4 options) that test the following topic:
Topic: {node_description}
Retrieved Context: {chunks_text}

Instructions:
- Questions should be clear, concise, and directly test understanding of the provided context.
- Each question must have exactly one correct answer.
- The difficulty should be appropriate for a learner at this stage.
- Format your output as a JSON array with objects containing: "question", "options" (array of 4 strings), "correct_answer" (string, the full correct option text), and "explanation" (brief).
- If the context is insufficient, output an empty array.
```

### C. Agent Re‑Planning Prompt Template
```
You are an intelligent curriculum planner. Given the current state of a learner's curriculum and their mastery scores, propose a mutation to improve their learning path.

Current State (JSON): {curriculum_state}
Mastery Scores: {node_id: score}

Rules:
- If a node has M < 0.5, it is considered blocked. You must insert remediation sub‑nodes that break the concept down into simpler parts. These sub‑nodes should be derived from the source material context.
- If a node has 0.5 ≤ M < 0.8, it is shaky. Insert one remediation sub‑node that focuses on the weak areas (based on quiz errors).
- If M ≥ 0.8, no action needed; you may accelerate downstream nodes.
- Provide your mutation plan as a JSON object with fields: "add_nodes" (list of new nodes with title, description, estimated_hours, dependencies, and position), "remove_nodes" (list of node IDs), "reorder" (list of node IDs in new order, if any), "agent_rationale" (explanation in natural language).
```

### D. Environment Variables & Configuration
```
# .env file
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
LLM_MODEL=gpt-3.5-turbo  # or gpt-4
CHROMA_PERSIST_DIR=./chroma_data
SESSION_STORE=./sessions
```

---

