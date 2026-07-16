# 🚀 mutatED Frontend Handover & Integration Specification

Welcome to the **mutatED** frontend implementation workflow. This document bridges our production-hosted FastAPI AI Agent backend with your React frontend workspace. It outlines the exact API data schemas, states, page architectures, and interface logic required to build a flawless user experience.

---

## 🌐 Global Infrastructure Parameters

* **Production API Server Target Base:** `[https://mutated-backend.onrender.com](https://mutated-backend.onrender.com)`
* **Response Format Protocol:** Strict application/json JSON responses.
* **Authentication Requirements:** None for MVP tier dashboard scopes.
* **Performance Expectation:** Free-tier cloud infrastructure sleeps after 15 minutes of quiet time. **Always implement a visible loading spinner** on initial form submission to manage potential 30–50 second instance wake-up delays. Subsequent processing pipelines execute in split-seconds via Groq's high-speed LPU infrastructure.

---

## 📑 Page 1: Landing, Ingestion & Introductory Framework

This is the gateway view. It frames the product's value proposition and handles ingestion.

### UI Layout Components

* **Hero Segment:**
* *Header:* "Stop studying static calendars. Learn with a curriculum that mutates to your needs."
* *Sub-header:* "mutatED uses localized Retrieval-Augmented Generation (RAG) and autonomous AI planning loops to continuously analyze your quiz accuracy and confidence metrics, re-engineering your study tree roadmap live as you learn."


* **Multi-Document Ingestion Card:**
* An input text field capturing the student’s learning path goal (`goal`).
* A drag-and-drop file upload target supporting simultaneous multiple document selection (`.pdf` and `.md` formats) with an explicit HTML `multiple` configuration attribute.
* A primary call-to-action button: **"Generate Agentic Study Blueprint"**.


* **Dynamic Loading Screen:** An intermediate view showing an illuminated system terminal feed when processing uploads. Display text rotates between:
* *“Slicing reference materials into semantic overlapping nodes...”*
* *“Mapping vectors to ChromaDB memory layers...”*
* *“Groq inference engine constructing optimized study path pipelines...”*



### Data Ingestion Integration Logic

#### 🛠️ Endpoint Controller: `POST /session/init`

* **Content-Type:** `multipart/form-data`
* **Payload Shape:**
* `goal` (String, Form Data parameter)
* `files` (Array of Binary Blobs, Form Data files)



#### 📥 Expected JSON Response Layout:

```json
{
  "session_id": "sess_a1b2c3d4",
  "goal": "Master Transformers in 4 Weeks",
  "filenames": ["AttentionIsAllYouNeed.pdf", "StudyNotes.md"],
  "curriculum": [
    {
      "id": "node_1",
      "title": "Foundations of Transformers",
      "description": "Core baseline overview targeting: Master Transformers in 4 Weeks",
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
  ],
  "agent_log": [
    {
      "timestamp": "2026-07-16T23:00:00Z",
      "message": "Blueprint initialized successfully with 2 resources."
    }
  ]
}

```

👉 **State Action Item:** Store the returned `session_id` inside global state (React Context or Zustand). Use the `curriculum` array to render the initial roadmap timeline map view.

---

## 📊 Page 2: The Core Workspace Dashboard

Once initialization completes, transition the user to a split-screen workspace interface.

```text
┌───────────────────────────────┬────────────────────────────────────────────────────────┐
│    LEFT: EVOLVING ROADMAP      │            RIGHT: THREE-TAB ACTIVE PANELS              │
│  Lists all module nodes.      │                                                        │
│  Refreshes dynamically on     ├───────────────────┬───────────────────┬────────────────┤
│  any state mutation events.   │  [Context Tab]    │    [Quiz Mode]    │  [Agent Logs]  │
│                               ├───────────────────┴───────────────────┴────────────────┤
│  ⚪ Node 1 (Unlocked)         │                                                        │
│  ⚪ Node 2 (Locked)           │       Active selected pane layout content goes here.   │
│                               │                                                        │
└───────────────────────────────┴────────────────────────────────────────────────────────┘

```

### 1. Left Layout Panel: The Evolving Roadmap Visualizer

Map out the `curriculum` array vertically as interactive cards. Clicking a card sets `selectedNodeId` and `selectedNodeDescription` in frontend state.

#### Node Status Visual Mapping Parameters:

* `"status": "unlocked"` ➡️ Accent border (e.g., Blue). Card is clickable.
* `"status": "locked"` ➡️ Faded state, lock icon. Card click is disabled.
* `"status": "mastered"` ➡️ Green accent indicator. Represents successful verification.
* `"status": "shaky"` ➡️ Orange accent indicator. Represents partial understanding.
* `"status": "blocked"` ➡️ Red accent indicator. Core target node is paused due to failure metrics.

---

### 2. Right Layout Panel: The Three-Tab Active Panel Workspace

#### 📑 Tab A: Semantic Context Viewer

Provides the primary grounded reference material pulled by ChromaDB matching the selected node's core description.

* **API Trigger:** Execute on Tab activation or Node card selection click.
* **Endpoint Protocol:** `GET /curriculum/{session_id}/node/{node_id}/context?description={description_string}`
* **Expected JSON Output Schema:**
```json
{
  "node_id": "node_1",
  "retrieved_context": "Text chunks extracted directly from documents..."
}

```


* **UI Presentation:** Render inside a clean reader viewport using a scrollable, monospaced or clean markdown element.

#### 📑 Tab B: Dynamic Grounded Quiz Mode

Generates an interactive, zero-hallucination multiple-choice assessment built by Groq.

* **API Trigger Action:** Button click labeled **"Generate Node Quiz"**.
* **Endpoint Protocol:** `GET /curriculum/{session_id}/node/{node_id}/quiz?description={description_string}`
* **Expected JSON Output Schema:**
```json
{
  "node_id": "node_1",
  "quiz_questions": [
    {
      "id": "q_1",
      "type": "mcq",
      "question": "Which component manages curriculum mutations?",
      "options": ["Vector Store", "Mutation Engine", "Router Core"],
      "correct_answer": "Mutation Engine",
      "explanation": "The Mutation Engine acts as the central agent loop planner."
    }
  ]
}

```


* **UI Interaction Flow:**
1. Render questions cleanly as radio-button forms.
2. Once filled, display a slider component measuring the user's subjective self-reported **Confidence Rating** on a strict integer metric layer scale from **1 to 5** (1 = Completely Guessing, 5 = Absolute Certainty).
3. Expose a **"Submit Results to Mutation Engine"** action interface call.



#### 🛠️ Quiz Evaluation Handshake: `POST /curriculum/{session_id}/node/{node_id}/submit`

* **Content-Type:** `application/json`
* **Payload Body Structure:**
```json
{
  "answers": {},
  "confidence": 3
}

```


* **Action Response Payload Handling:** The server processes accuracy tracking metrics, fires the agentic mutation re-planner loop, and returns an updated session snapshot mapping new data states:
```json
{
  "message": "Quiz submission processed successfully.",
  "mastery_score": 0.42,
  "node_status": "blocked",
  "mutation_applied": true,
  "updated_session_state": {
     "session_id": "sess_a1b2c3d4",
     "curriculum": [
        { "id": "node_1", "status": "blocked", "mastery_score": 0.42 },
        { "id": "gen_remediation_x", "title": "Simplified Foundations Review", "status": "unlocked" }
     ],
     "agent_log": [...]
  }
}

```



👉 **Crucial UI Refresh Step:** On submission return, look at `updated_session_state`. **Over-write your local React state variables immediately.** The Left Roadmap panel and the Agent Terminal log panel must flash and update instantly to reveal the newly injected AI remediation steps!

#### 📑 Tab C: Agent Autonomous Loop Log Terminal

A retro system console view showing the underlying reasoning engine logs. This is your primary visual validation tool for hackathon judges!

* **UI Style:** Black background (`#111111`), neon terminal green monospaced text lines (`#00FF00`).
* **API Poll Target:** `GET /agent/{session_id}/log`
* **UI Features:** Provide a continuous scrolling stream mapping `timestamp` alongside `message`.
* **⭐ Secret Hackathon Demo Button Feature:** Include a distinct red button labeled **"[DEMO OVERRIDE] Force Failure Mutation"**. When clicked, execute:
* `POST /agent/{session_id}/replan?target_node_id={selected_node_id}`
* This bypasses manually filling out a quiz and instantly forces a low-score condition, forcing the UI roadmap state to dynamically insert structural remediation steps live right in front of the judges!



---

## 🛠️ Step-by-Step Frontend Implementation Plan

1. **State Management Setup:** Initialize a context configuration file tracking `currentSessionId`, `selectedNodeId`, `curriculumArray`, and `agentLogsArray`.
2. **Layout Framework:** Implement a responsive flex layout grid dividing the timeline roadmap directory on the left from the right workspace tab navigation menu.
3. **API Connector Layer:** Abstract all requests using standard `fetch()` or `axios` instances aimed directly at `[https://mutated-backend.onrender.com](https://mutated-backend.onrender.com)`.
4. **Testing Checklist:** Confirm that clicking the manual demo re-plan button instantly updates the nodes tree data map inside the left dashboard workspace.
