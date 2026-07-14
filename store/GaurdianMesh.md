# Product Requirement Document (PRD) – GuardianMesh

**AI-Powered Perimeter Security & Voice-Activated Guardian System**

**Version:** 2.1 (Servo Removed)  
**Date:** 2026-07-06  
**Project Type:** Hardware‑Software IoT Security Ecosystem  
**Document Status:** Final – Implementation Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [Scope & Objectives](#2-scope--objectives)  
3. [Target Audience & Use Cases](#3-target-audience--use-cases)  
4. [System Architecture Overview](#4-system-architecture-overview)  
5. [Hardware Component Specifications](#5-hardware-component-specifications)  
6. [Firmware & Embedded Logic](#6-firmware--embedded-logic)  
7. [Backend & AI/ML Pipeline](#7-backend--aiml-pipeline)  
8. [Frontend Dashboard & User Interaction](#8-frontend-dashboard--user-interaction)  
9. [API Contract & Data Models](#9-api-contract--data-models)  
10. [Memory & Resource Allocation Analysis](#10-memory--resource-allocation-analysis)  
11. [Feature Roadmap (MVP → Future)](#11-feature-roadmap-mvp--future)  
12. [Development Tasks & Role Breakdown](#12-development-tasks--role-breakdown)  
13. [Testing & Quality Assurance](#13-testing--quality-assurance)  
14. [Deployment & Environment Setup](#14-deployment--environment-setup)  
15. [Risk Management & Mitigation](#15-risk-management--mitigation)  
16. [Success Criteria & KPIs](#16-success-criteria--kpis)  
17. [Budget & BOM](#17-budget--bom)  
18. [Glossary](#18-glossary)  
19. [Appendices](#19-appendices)  
   - A. Detailed API Endpoint Specifications  
   - B. Hardware Wiring Diagrams (Textual)  
   - C. Sample Environment Variables & Configuration  
   - D. Code Snippets (Pseudo/Reference)  

---

## 1. Executive Summary

### 1.1 The Problem
Traditional home/office security systems are either expensive, difficult to install, or lack intelligent capabilities. Existing DIY solutions often suffer from high false‑alarm rates, minimal automation, and no integration with voice commands. Camera‑based systems raise privacy concerns, especially when continuously recording.

### 1.2 GuardianMesh Solution
GuardianMesh is an **intelligent, modular security ecosystem** that combines:
- **Edge‑based motion detection** using a PIR sensor and ESP32.
- **AI‑powered visual verification** via a statically mounted ESP‑CAM with YOLOv8 object detection and face recognition.
- **Voice control** through an ESP32‑C3 with a microphone, enabling natural language commands.
- **A centralised web dashboard** (React frontend + FastAPI backend) for real‑time monitoring, alert history, and remote control of physical outputs (buzzer, LEDs).

**Key Design Decision:** The camera is **statically mounted** – no servo motor is used. This simplifies the hardware, reduces cost, improves reliability, and keeps the core security functionality intact: motion‑triggered capture, AI‑based detection, and real‑time alerts.

### 1.3 Core Differentiators
- **Hybrid Edge‑Cloud AI:** Object detection and face recognition run on the backend (for performance), while motion sensing and immediate capture occur at the edge.
- **Voice as a First‑Class Input:** Users can arm/disarm the system, trigger alerts, or request status via voice commands.
- **Real‑Time, Low‑Latency Feedback:** WebSocket pushes ensure the dashboard updates within milliseconds of an event.
- **Privacy‑Friendly:** Camera only captures when motion is detected; no continuous streaming; statically aimed to avoid unnecessary recording.

### 1.4 High‑Level System Goals
- Detect motion and capture an image within **500ms** of trigger.
- Process image (object detection/face recognition) within **2 seconds**.
- Present the alert on the dashboard and trigger physical outputs within **1 second**.
- Maintain a real‑time system status (online/offline) for all connected devices.
- Support voice commands with >90% intent recognition accuracy.

---

## 2. Scope & Objectives

### 2.1 In‑Scope (MVP)
- **Hardware:**  
  - ESP32 NodeMCU + PIR sensor (motion detection).  
  - ESP‑CAM + OV3660 (static camera for image capture).  
  - ESP32‑C3 Mini + I2S microphone (voice input).  
  - Arduino UNO + buzzer + LEDs (physical output).  
- **Firmware:**  
  - Motion interrupt handling, JPEG capture, HTTP upload to backend.  
  - Voice sample streaming via HTTP.  
  - Command reception via WebSocket/HTTP.  
- **Backend:**  
  - FastAPI REST API with PostgreSQL + Redis.  
  - YOLOv8n object detection pipeline.  
  - Face recognition using `face_recognition` library.  
  - Speech‑to‑Text + intent parser (using OpenAI Whisper or a lightweight local model).  
  - WebSocket server for real‑time push.  
- **Frontend:**  
  - React dashboard with live status, alert history, static camera viewport.  
  - Arm/Disarm toggle, alarm trigger, LED control.  
  - Responsive design (desktop‑first).  

### 2.2 Out‑of‑Scope (MVP)
- **Live video streaming** (RTSP/WebRTC) – will be considered as a future upgrade.  
- **Mobile app** – web only, but responsive.  
- **Multiple users/authentication** – simple single‑user for hackathon.  
- **Advanced analytics** (motion heat maps, trend analysis) – post‑MVP.  
- **Integration with third‑party home automation** (IFTTT, Alexa) – future.  

---

## 3. Target Audience & Use Cases

| Persona | Description | Needs & Pain Points |
|---------|-------------|----------------------|
| **Homeowner** | Tech‑savvy individual wanting a DIY security system without monthly fees. | – Easy installation and configuration.<br>– Instant alerts when away.<br>– Voice control for convenience. |
| **Small Business Owner** | Office or shop owner needing basic perimeter security. | – Monitor entry points during off‑hours.<br>– Visual verification of alarms.<br>– Remote arm/disarm. |
| **Tech Enthusiast / Developer** | Wants an extensible platform for learning or customisation. | – Open‑source hardware/software.<br>– Well‑documented APIs.<br>– Modular design. |

**Primary Use Cases:**
1. **Motion‑Triggered Alert:** Intruder detected → camera captures image → AI identifies person/object → dashboard alert + buzzer/LED.
2. **Voice Command (Arm/Disarm):** User says “Arm the system” → microphone captures audio → backend interprets → system arms → confirmation displayed.
3. **Remote Monitoring:** User checks dashboard from anywhere → views recent alerts, system status, and last captured image.
4. **Local Alarm Activation:** User clicks “Trigger Alarm” on dashboard → backend sends command to Arduino → buzzer sounds and LEDs flash.

---

## 4. System Architecture Overview

GuardianMesh follows a **4‑tier architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ React Web Dashboard                                         │   │
│  │ (Live Feed, Alerts, Commands, Settings)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────▼────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FastAPI Backend Server                                    │ │
│  │ - REST API endpoints                                      │ │
│  │ - WebSocket server                                        │ │
│  │ - AI/ML service (YOLO, face_recognition, STT)            │ │
│  │ - Command dispatcher                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PostgreSQL (Alerts, Devices, Commands)                    │ │
│  │ Redis (Caching, real‑time status)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      EDGE LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ ESP32 NodeMCU │  │ ESP-CAM      │  │ ESP32-C3     │        │
│  │ + PIR        │  │ + OV3660     │  │ + Mic       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Arduino UNO + Buzzer + LEDs (Outputs)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.1 Data Flow

#### 4.1.1 Motion → Alert Flow
1. PIR sensor detects motion → ESP32 NodeMCU reads interrupt → prepares JSON payload with timestamp and device ID.
2. ESP32 sends HTTP POST to `/api/alerts` with event metadata (no image yet).
3. Backend stores preliminary alert, generates a unique `alert_id`, and triggers a capture command via WebSocket to ESP‑CAM (or ESP‑CAM independently listens for capture commands).
   *Alternative:* The ESP32 NodeMCU can directly instruct the ESP‑CAM via GPIO or local communication; however, for simplicity, we use a command‑based approach where the backend tells ESP‑CAM to capture.
4. ESP‑CAM captures JPEG image (static FOV), uploads via POST to `/api/upload` with `alert_id`.
5. Backend runs YOLOv8n object detection and face recognition on the image, enriches the alert record.
6. Backend pushes the enriched alert via WebSocket to dashboard.
7. Dashboard displays the alert with image and detection results. Optionally, if a known person is not recognised or an unknown object is detected, the backend triggers the Arduino buzzer/LED via a separate command.

#### 4.1.2 Voice Command Flow
1. ESP32‑C3 continuously listens (or on wake‑word, if implemented). It buffers audio samples and sends a chunk (or full clip) via POST to `/api/voice`.
2. Backend uses an STT engine (e.g., Whisper) to convert audio to text.
3. Intent parser (simple keyword+NER or trained classifier) extracts intent (arm, disarm, status, trigger alarm, etc.) and confidence.
4. If intent is actionable and confidence >0.7, backend executes the corresponding action (e.g., change system state, trigger alarm) and stores the voice event.
5. Backend sends a response (text) back to the ESP32‑C3 (for local audio feedback) and updates the dashboard via WebSocket.

#### 4.1.3 Hardware Command Flow
1. User clicks a button on dashboard (e.g., "Trigger Alarm").
2. Frontend sends POST to `/api/command` with command type and payload.
3. Backend forwards the command to the target device(s) via a persistent WebSocket connection (or HTTP if configured).
4. ESP32/Arduino receives the command, executes (e.g., buzzer on), and optionally sends an acknowledgement.
5. Backend updates the command status and broadcasts to dashboard.

---

## 5. Hardware Component Specifications

### 5.1 Component List (BOM)

| Item | Model/Type | Quantity | Purpose |
|------|------------|----------|---------|
| ESP32 NodeMCU (or ESP32 DevKit) | ESP32-WROOM | 1 | Motion sensor node |
| HC‑SR501 PIR Sensor | HC‑SR501 | 1 | Motion detection |
| ESP‑CAM | ESP32‑S with OV3660 | 1 | Image capture (static FOV) |
| ESP32‑C3 Mini | ESP32‑C3 (RISC‑V) | 1 | Voice input node |
| I2S Digital Microphone | INMP441 (preferred) or MAX9814 | 1 | Audio capture |
| Arduino UNO | ATmega328P | 1 | Physical output controller |
| Active Buzzer (5V) | – | 1 | Audible alarm |
| Red LED | 5mm | 1 | Visual status (alarm) |
| Green LED | 5mm | 1 | Visual status (armed/disarmed) |
| Resistors | 220Ω, 10kΩ | pack | Current limiting / pull‑up |
| Jumper wires (F‑F, M‑F) | – | pack | Connections |
| Breadboard | – | 1 | Prototyping |
| USB power supplies | 5V/2A | 4 | Power each board |

### 5.2 Detailed Pin Mapping

#### PIR Sensor → ESP32 NodeMCU
| PIR Pin | ESP32 Pin | Notes |
|---------|-----------|-------|
| VCC     | 5V        | Use 5V or 3.3V (check sensor spec) |
| GND     | GND       | – |
| OUT     | GPIO 4    | Digital input, internal pull‑down |

#### ESP‑CAM (Standalone)
| ESP‑CAM Pin | Connection | Notes |
|-------------|------------|-------|
| 5V          | USB 5V / external | Ensure adequate current (≥1A) |
| GND         | GND       | – |
| U0TXD / U0RXD | (optional) | For debugging, connect to USB‑TTL |

**No servo connection** – camera remains fixed.

#### Arduino UNO → Buzzer + LEDs
| Component | Arduino Pin | Notes |
|-----------|-------------|-------|
| Buzzer (positive) | D9         | PWM capable (for tone) |
| Buzzer (negative) | GND        | – |
| Red LED (anode)  | D10        | Through 220Ω resistor |
| Green LED (anode)| D11        | Through 220Ω resistor |
| LED cathodes     | GND        | Common ground |
| (Optional) Acknowledge button | D8 | For local reset (future) |

#### ESP32‑C3 → INMP441 (I2S Mic)
| INMP441 Pin | ESP32‑C3 Pin | Notes |
|-------------|--------------|-------|
| VDD         | 3.3V         | – |
| GND         | GND          | – |
| DOUT        | GPIO 2       | I2S data output |
| BCLK        | GPIO 3       | I2S bit clock |
| LRCLK       | GPIO 4       | I2S left‑right clock |

### 5.3 Power Considerations
- Each ESP board consumes ~100‑200mA during WiFi activity. ESP‑CAM can spike to 300mA when capturing.
- Use a USB hub with adequate power or separate wall adapters.
- Add capacitors (100µF) near the power inputs to smooth spikes.

---

## 6. Firmware & Embedded Logic

### 6.1 ESP32 NodeMCU (PIR Node)

**Responsibilities:**
- Monitor PIR sensor output (GPIO 4) with an interrupt on RISING edge.
- Debounce: ignore subsequent interrupts within 1 second to avoid multiple triggers.
- On motion detected, construct a JSON payload:
  ```json
  { "device_id": "esp32_motion_001", "event": "motion_start", "timestamp": "ISO8601" }
  ```
- Send HTTP POST to `/api/alerts` (backend).
- If no image is captured automatically (or as fallback), the backend will request capture via a separate command to ESP‑CAM (see 6.2).
- Maintain a heartbeat: send POST to `/api/status` every 30 seconds with WiFi RSSI and uptime.

**State Machine:**
```
IDLE → (PIR HIGH) → DEBOUNCE (wait 1s) → SEND_ALERT → IDLE
```
- If PIR stays HIGH (longer motion), do not send repeated alerts until a LOW→HIGH transition occurs again.

**Network Resiliency:**
- If WiFi is unavailable, store events in a small circular buffer (SPIFFS) and retry later.

### 6.2 ESP‑CAM (Image Capture)

**Responsibilities:**
- Connect to WiFi and listen for capture commands via HTTP GET/POST on a dedicated endpoint (e.g., `/capture`).
- When capture command received, it:
  - Initialises camera (OV3660) in JPEG mode with resolution 1600x1200 (UXGA) or lower to fit memory.
  - Captures a frame, stores in PSRAM.
  - Reads JPEG data, encodes as base64 or sends as multipart/form‑data to `/api/upload`.
  - Include the alert_id in the upload payload (sent by the backend in the capture command).
- **Resolution Selection:** To meet memory constraints, we may use 800x600 (SVGA) or 640x480 (VGA) if the 4MB PSRAM is insufficient for higher resolution + processing buffers. The firmware should make this configurable.

**Capture Command Format (from backend):**
```
GET /capture?alert_id=xyz&resolution=800x600
```
or via WebSocket.

**Image Upload:**
```
POST /api/upload
Content-Type: multipart/form-data
{
  "alert_id": "xyz",
  "image": <binary JPEG>
}
```

**Error Handling:**
- If upload fails, retry up to 3 times with exponential backoff.

### 6.3 ESP32‑C3 (Voice Node)

**Responsibilities:**
- Initialise I2S microphone (INMP441) with 16kHz sample rate, 16‑bit mono.
- Continuously capture audio into a ring buffer (e.g., 2 seconds). Use voice activity detection (VAD) to detect speech; alternatively, we can buffer and send on a fixed interval or upon a wake‑word trigger.
- For MVP, we use a push‑to‑talk approach via a physical button on the ESP32‑C3, or a simple amplitude threshold to start/stop recording. This simplifies the firmware.
- On trigger (button press or VAD), record for a fixed duration (e.g., 3 seconds) and then send the audio data (e.g., as WAV bytes) to `/api/voice`.
- Wait for a text response from backend (could be sent via WebSocket or HTTP response) and optionally play it back (if a speaker is added, out of scope for MVP).

**Memory:** The audio buffer (3 sec @ 16kHz, 16‑bit mono ≈ 96KB) fits in the 400KB SRAM.

### 6.4 Arduino UNO (Output Controller)

**Responsibilities:**
- Listen for commands via serial (if connected to a host computer) or via a network shield (simplest: use an ESP‑01 WiFi module). For hackathon, we recommend a serial bridge: the backend sends a command to a local Python script that writes to the Arduino’s serial port.
- On receiving a command (e.g., `BUZZER_ON`, `BUZZER_OFF`, `LED_RED`, `LED_GREEN`), execute the action.
- Provide an acknowledgement back via serial.

**Alternative (preferred for robustness):** Use an ESP8266/ESP01 to receive commands via WiFi and forward via serial to Arduino – or better, replace Arduino with another ESP32, but we keep the Arduino per requirements.

For hackathon, we can implement a simple HTTP server on the Arduino using an Ethernet shield, but for simplicity, we will use the serial bridge approach.

**Command Set (text-based over serial):**
```
BUZZER_ON,1000  // turn on for 1000ms
BUZZER_OFF
LED_SET,GREEN   // or RED
LED_OFF
```

---

## 7. Backend & AI/ML Pipeline

### 7.1 Technology Stack
- **Framework:** FastAPI (Python 3.10+) – async capable, auto‑generated OpenAPI.
- **Database:** PostgreSQL (with SQLAlchemy ORM) for persistent storage; Redis for caching and real‑time status.
- **AI/ML:**
  - Object Detection: YOLOv8n (nano) via Ultralytics, running on CPU or GPU.
  - Face Recognition: `face_recognition` library (dlib‑based) or `insightface` for speed.
  - Speech‑to‑Text: OpenAI Whisper (small or base) for high accuracy, or Vosk for offline.
  - Intent Parsing: Custom regex + keyword matching, or a lightweight classifier (e.g., `spaCy`).
- **Real‑time:** WebSockets (FastAPI native) for push updates to dashboard.
- **Background Tasks:** Use Celery or FastAPI's `BackgroundTasks` for heavy AI processing (to keep API responsive).

### 7.2 Data Models (SQLAlchemy)

#### AlertLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| timestamp | DateTime | Event time (ISO) |
| event_type | String | motion, voice, intrusion, face_recognized |
| confidence | Float | 0.0‑1.0 |
| image_url | String | Path to stored JPEG (optional) |
| audio_transcript | String | For voice events |
| device_id | String | MAC/ID of source device |
| status | String | pending, acknowledged, resolved |
| metadata | JSON | Additional structured data (camera angle – always 0) |

#### DeviceStatus
| Field | Type | Description |
|-------|------|-------------|
| device_id | String (PK) | Unique identifier |
| device_type | String | camera, motion, voice, output |
| status | String | online, offline, error |
| battery_level | Integer | 0‑100 (if applicable) |
| last_heartbeat | DateTime | Last ping received |
| settings | JSON | Device‑specific configuration |

#### CommandLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| command_type | String | e.g., buzzer_on, arm_system |
| device_id | String | Target device |
| payload | JSON | Command parameters |
| timestamp | DateTime | Issued time |
| status | String | queued, sent, acknowledged, failed |

### 7.3 AI Pipeline Details

#### Object Detection (YOLOv8n)
- Model loaded once at startup.
- Input: JPEG image (decoded to RGB) resized to 640x640.
- Output: list of detections with class labels, bounding boxes, confidence.
- Use NMS (Non‑Maximum Suppression) to reduce duplicates.
- If person detected, confidence >0.5, flag as intrusion. If unknown person detected, trigger alert.

#### Face Recognition
- Pre‑register known faces (e.g., family members) by storing their face encodings in a database.
- On each captured image, detect faces using `face_recognition` or YOLO face detection.
- For each detected face, compare encoding against stored encodings; if match with distance <0.6, label as known.
- If no match, label as unknown.

#### Speech‑to‑Text & Intent Parsing
- Audio format: WAV (PCM 16kHz 16‑bit mono).
- Use Whisper `base` model for transcription (or `tiny` for speed).
- Intent extraction: rule‑based with keyword mapping:
  - "arm", "secure", "activate" → `arm_security`
  - "disarm", "deactivate", "off" → `disarm_security`
  - "photo", "capture", "picture" → `take_photo`
  - "alarm", "siren", "trigger" → `trigger_alarm`
- If confidence of intent (based on keyword count or a simple classifier) >0.7, action is taken.

### 7.4 Real‑Time Push (WebSocket)
- Each frontend client connects via WebSocket to `/ws`.
- On any new alert or status change, backend broadcasts the update to all connected clients.
- The payload is a JSON object with `type` (alert, status, command_ack) and `data`.

---

## 8. Frontend Dashboard & User Interaction

### 8.1 Technology Stack
- **Framework:** React 18+ (with Vite for build).
- **State Management:** React Context + useReducer (or Redux for larger scale).
- **Styling:** Tailwind CSS (utility‑first, fast development).
- **Real‑time:** Socket.io‑client (or native WebSocket) to listen for updates.
- **HTTP Client:** Axios.

### 8.2 Dashboard Layout (Wireframes)

```
+-------------------------------------------------------------------+
|  🛡️ GuardianMesh   [System: ARMED]  [User]  [Settings]          |
+-------------------------------------------------------------------+
| Stats:   Alerts Today: 4  |  Uptime: 23:45  |  Devices: 3/5  |
+-------------------------------------------------------------------+
|  Live Feed (Static)                                               |
|  +----------------------------------------------------+          |
|  |   [ Last Captured Image ]                           |          |
|  |                                                    |          |
|  +----------------------------------------------------+          |
+-------------------------------------------------------------------+
|  Recent Alerts (last 10)                                          |
|  Time       | Event       | Status   | Action                   |
|  14:32:21   | Motion      | 🔴 New   | [View] [Dismiss]        |
|  14:28:15   | Face: John  | ✅ Known | [View]                   |
|  14:15:03   | Voice       | 📝 Text  | [View]                   |
+-------------------------------------------------------------------+
|  Controls:  [Arm] [Disarm] [Trigger Alarm] [Take Photo]         |
+-------------------------------------------------------------------+
```

### 8.3 Interaction Flow
1. **Load Dashboard:** Fetch system status (`/api/status`), fetch recent alerts (`/api/alerts?limit=20`). Establish WebSocket connection.
2. **New Alert:** When a new alert is received via WebSocket, append to the top of the alerts table, show a toast notification, and update the stats cards.
3. **View Alert:** Click on an alert row to open a modal showing the captured image, detection results, confidence, and metadata.
4. **Arm/Disarm:** Toggle switch sends `{command_type:"arm_system"}` or `{command_type:"disarm_system"}` to `/api/command`. The backend changes system state and broadcasts the new status.
5. **Trigger Alarm:** Click button → send `{command_type:"trigger_alarm", payload:{duration:5000}}`. The backend forwards to Arduino to sound buzzer.
6. **Take Photo (Manual):** Click button → sends command to ESP‑CAM to capture and upload.

### 8.4 Responsive Design
- The dashboard is designed for desktop (min-width 1024px) but adapts to tablets and mobiles using Tailwind’s responsive classes.
- Stats cards stack vertically on small screens; alerts table becomes horizontally scrollable.

---

## 9. API Contract & Data Models

### 9.1 Common Headers
- `Content-Type: application/json` for most requests.
- For file uploads: `multipart/form-data`.

### 9.2 Endpoint Specifications

#### POST /api/alerts
**Request Body (from PIR node):**
```json
{
  "device_id": "esp32_motion_001",
  "event_type": "motion_start",
  "timestamp": "2026-07-07T14:32:21.123Z"
}
```
**Response:**
```json
{
  "alert_id": "abc-123",
  "status": "pending"
}
```
**Notes:** The backend will immediately return an ID and then (if configured) trigger a capture command.

#### POST /api/upload
**Request (multipart/form-data):**
- `alert_id`: string (required)
- `image`: binary JPEG file
**Response:**
```json
{
  "alert_id": "abc-123",
  "image_url": "/static/images/abc-123.jpg",
  "detections": [
    {"label": "person", "confidence": 0.92, "bbox": [x1,y1,x2,y2]}
  ],
  "face_recognized": "John Doe" | null
}
```
**Processing:** Asynchronous; the response is sent after detection and face recognition are completed.

#### POST /api/voice
**Request (multipart/form-data):**
- `device_id`: string
- `audio`: binary WAV file (PCM 16kHz mono)
**Response:**
```json
{
  "transcript": "arm the system",
  "intent": "arm_security",
  "confidence": 0.95,
  "is_actionable": true,
  "response_message": "System armed"
}
```

#### POST /api/command
**Request Body:**
```json
{
  "command_type": "buzzer_on",
  "device_id": "arduino_001",
  "payload": {"duration": 3000}
}
```
**Response:**
```json
{
  "command_id": "cmd-456",
  "status": "queued"
}
```

#### GET /api/status
**Response:**
```json
{
  "system_status": "armed",
  "last_activity": "2026-07-07T14:32:21Z",
  "devices": [
    {"device_id": "esp32_motion_001", "type": "motion", "status": "online", "last_heartbeat": "..."}
  ],
  "settings": {
    "motion_sensitivity": 5,
    "face_recognition_enabled": true,
    "voice_control_enabled": true,
    "auto_arm_time": "22:00"
  }
}
```

#### WebSocket /ws
- **Messages from server:**
  - `{"type":"alert","data":{...}}` – new alert
  - `{"type":"status_update","data":{...}}` – system state change
  - `{"type":"command_ack","data":{"command_id":"...","status":"executed"}}`
- **Messages from client:** (optional) ping, ack.

### 9.3 Error Handling
All endpoints return appropriate HTTP status codes:
- `200`: Success with data.
- `201`: Resource created.
- `400`: Bad request (validation failed).
- `404`: Resource not found.
- `500`: Internal server error.
Error responses include a `detail` field with explanation.

---

## 10. Memory & Resource Allocation Analysis

### 10.1 ESP‑CAM Memory Map (Critical)
The ESP‑CAM has 4MB PSRAM and 520KB SRAM. The firmware must carefully manage buffers:

```
PSRAM (3.8MB usable):
├── Camera frame buffer (JPEG): up to 1.2MB (for 1600x1200)
├── Secondary buffer for AI inference: 512KB (if running on device, but we offload)
├── Image processing (pre‑processing): 1MB (for resizing, if needed on edge)
├── HTTP client payload buffer: 256KB (for upload)
└── Free/Scratch: 832KB

Internal SRAM (520KB):
├── WiFi stack & TCP/IP: 180KB
├── RTOS & system: 120KB
├── Application code (static): 100KB
└── Heap: 120KB
```
**Recommendation:** To reduce memory pressure, capture at 800x600 (SVGA) which yields ~300‑400KB JPEG. This leaves ample space for other buffers.

### 10.2 Backend Memory (YOLO)
- YOLOv8n ONNX model: ~6MB.
- Input image (640x640x3) in RAM: ~1.2MB.
- Output tensors: ~2.5MB.
- Python overhead: ~100‑200MB.
**Total:** ~250‑300MB per inference (concurrent requests should be limited).

### 10.3 ESP32‑C3 (Voice) Memory
- Audio buffer (3 sec @ 16kHz, 16‑bit mono) = 96KB.
- SRAM usage: 400KB total; after WiFi and system, about 100KB free – comfortable.

### 10.4 Arduino UNO (No RAM concerns – simple state machine)

---

## 11. Feature Roadmap (MVP → Future)

| Phase | Features |
|-------|----------|
| **MVP (Hackathon)** | Motion detection + camera capture + AI analysis (YOLO + face recognition). Voice commands (arm/disarm/trigger). Physical buzzer/LED control. Web dashboard with real‑time alerts. |
| **Phase 2 (Post‑MVP)** | Live video streaming (RTSP/WebRTC). User authentication (JWT). Multiple camera support. Enhanced voice control (wake‑word, custom commands). Email/SMS notifications. |
| **Phase 3 (Advanced)** | Motion heat maps. Integration with IFTTT/Zapier. Schedule‑based arming. Mobile app (React Native). Edge AI with TensorFlow Lite for on‑device detection (reduces backend load). |
| **Phase 4 (Commercial)** | Multi‑user role management. Cloud storage for images. Professional monitoring integration. |

---

## 12. Development Tasks & Role Breakdown

### 12.1 AI/ML + IoT Engineer (Tasks)
**Hardware Firmware:**
- H‑01: Set up ESP32 NodeMCU with Arduino/PlatformIO, WiFi connectivity.
- H‑02: Flash ESP‑CAM with test firmware; confirm camera and WiFi.
- H‑03: Implement PIR interrupt handler with debounce.
- H‑04: Implement ESP‑CAM photo capture (JPEG) at configurable resolution.
- H‑05: Implement HTTP POST to `/api/alerts` from ESP32 on motion.
- H‑06: Implement ESP‑CAM upload to `/api/upload` (multipart).
- H‑07: Implement heartbeat reporting for all nodes.
- H‑08: Set up ESP32‑C3 with I2S microphone; implement audio buffering.
- H‑09: Implement voice sample streaming to `/api/voice` (via button or VAD).
- H‑10: Implement WebSocket command listener on ESP devices (or HTTP polling).
- H‑11: Implement Arduino serial command parser for buzzer/LED.

**Backend & AI:**
- B‑01: Python virtual environment, FastAPI skeleton.
- B‑02: PostgreSQL schema (SQLAlchemy models).
- B‑03: Implement `/api/alerts` POST and GET endpoints.
- B‑04: Implement `/api/upload` endpoint with image storage and AI pipeline.
- B‑05: Integrate YOLOv8n object detection.
- B‑06: Integrate face recognition (`face_recognition`).
- B‑07: Implement `/api/voice` with STT (Whisper) + intent parser.
- B‑08: Implement `/api/command` endpoint.
- B‑09: Implement WebSocket server for real‑time pushes.
- B‑10: Set up Redis for caching and device status.
- B‑11: Implement device heartbeat processing.

### 12.2 Web Developer (Tasks)
- F‑01: Initialize React + Vite project, Tailwind CSS.
- F‑02: Configure routing (Dashboard, Settings, Login).
- F‑03: Build layout components (Navbar, Sidebar, Stats Cards).
- F‑04: Create API service layer (Axios) and WebSocket client (Socket.io).
- F‑05: Build alerts table with sorting, filtering, pagination.
- F‑06: Build alert detail modal (shows image, detection results).
- F‑07: Build system status indicators (online/offline).
- F‑08: Build camera viewport (static, shows last captured image).
- F‑09: Implement arm/disarm toggle with API call.
- F‑10: Implement buzzer/LED control buttons.
- F‑11: Implement real‑time updates via WebSocket (new alerts, status changes).
- F‑12: Implement toast notifications for new alerts.
- F‑13: Responsive design and polish (loading states, error handling).
- F‑14: Integration: replace mock data with real API calls.

---

## 13. Testing & Quality Assurance

### 13.1 Hardware Testing
- Verify each ESP device connects to WiFi and maintains connection.
- Test PIR trigger -> alert sent -> image captured -> upload -> detection -> dashboard update; measure latency.
- Test voice command: speak "arm system" -> transcript -> intent -> system armed.
- Test command: trigger alarm from UI -> Arduino buzzes.

### 13.2 Backend Unit Tests (pytest)
- Test API endpoints with mock requests.
- Test AI pipeline with known images.
- Test WebSocket broadcast.

### 13.3 Frontend Tests (Jest + React Testing Library)
- Test component rendering.
- Test API service calls.
- Test WebSocket message handling.

### 13.4 Integration Tests
- End‑to‑end flow: motion -> alert -> dashboard.
- Voice -> intent -> action.
- Command -> hardware.

### 13.5 Performance Benchmarks
- Alert latency < 3 seconds (motion to dashboard).
- Image upload < 2 seconds.
- AI processing < 2 seconds.

---

## 14. Deployment & Environment Setup

### 14.1 Backend
- Use Docker for containerisation (Dockerfile provided in Appendix C).
- Environment variables: database URL, Redis URL, model paths, STT model.
- Run with `uvicorn main:app --host 0.0.0.0 --port 8000`.

### 14.2 Frontend
- Build with `npm run build`; serve via Nginx or Vercel/Netlify.
- Environment variables for API base URL.

### 14.3 Hardware Flashing
- Use Arduino IDE or PlatformIO. Provide pre‑compiled binaries.

### 14.4 Local Development
- Use `docker-compose` to spin up PostgreSQL, Redis, backend, and frontend.
- Mock hardware using a simulator (optional).

---

## 15. Risk Management & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **ESP‑CAM PSRAM insufficient for high‑res capture** | Medium | High | Lower capture resolution; use JPEG compression; offload AI to backend. |
| **WiFi interference / disconnection** | Medium | Medium | Implement automatic reconnection; store events locally and retry. |
| **YOLO model too slow** | Medium | High | Use YOLOv8n (nano); process asynchronously; consider ONNX/TensorRT. |
| **Voice recognition accuracy** | Medium | Medium | Use robust STT; fallback to simple keyword matching; train a custom intent classifier if needed. |
| **Dashboard‑backend communication lag** | Low | Medium | Use WebSocket for real‑time; optimise API responses. |
| **Arduino serial communication issues** | Low | Low | Use robust framing; add acknowledgements. |
| **Power supply instability** | Low | High | Use quality USB adapters; add bulk capacitors; consider battery backup. |
| **Security (API exposure)** | Medium | High | Use HTTPS for production; implement authentication (JWT) for MVP; rate limiting. |

---

## 16. Success Criteria & KPIs

### 16.1 Technical KPIs
- **Motion → Alert Latency:** ≤ 500ms (edge trigger) + 2 sec (AI processing) = ≤ 2.5s end‑to‑end.
- **Image Upload Time:** ≤ 2 seconds from capture to backend receipt.
- **Voice Command Response:** ≤ 3 seconds from utterance to action.
- **WebSocket Reconnection:** ≤ 5 seconds.
- **System Uptime:** > 99.5% for the demo period.
- **Detection Accuracy:** > 85% for person detection; face recognition > 90% for known faces.

### 16.2 User Experience KPIs
- Dashboard loads < 2 seconds.
- Alerts appear on screen within 1 second of backend processing.
- Controls are responsive (UI feedback < 200ms).

### 16.3 Project Success Criteria
1. All three ESP devices communicate with the backend.
2. Motion triggers image capture and alert with detection results.
3. Face recognition correctly identifies at least two pre‑registered faces.
4. Voice commands successfully arm/disarm and trigger alarm.
5. Physical buzzer/LED respond to UI commands.
6. Dashboard displays real‑time updates without refresh.

---

## 17. Budget & BOM

| Item | Quantity | Cost (₹) | Total (₹) |
|------|----------|----------|-----------|
| ESP32 NodeMCU | 1 | 450 | 450 |
| HC‑SR501 PIR | 1 | 50 | 50 |
| ESP‑CAM (OV3660) | 1 | 550 | 550 |
| ESP32‑C3 Mini | 1 | 350 | 350 |
| INMP441 Mic | 1 | 100 | 100 |
| Arduino UNO | 1 | 450 | 450 |
| 5V Active Buzzer | 1 | 30 | 30 |
| Red LED + Green LED | 2 | 10 | 10 |
| Resistors (220Ω, 10kΩ) | pack | 20 | 20 |
| Jumper wires | pack | 30 | 30 |
| Breadboard | 1 | 50 | 50 |
| USB power supplies (4) | 4 | 100 | 400 |
| **Total** | | | **₹2,490** |

*(Prices are indicative; actual cost may vary by source.)*

**Cost Optimisation:** Use components already available in the lab; reuse USB cables and power supplies.

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **PIR** | Passive Infrared – detects motion by sensing heat changes. |
| **ESP‑CAM** | Development board with integrated camera (ESP32‑S + OV3660). |
| **YOLO** | You Only Look Once – real‑time object detection model. |
| **STT** | Speech‑to‑Text – converts audio to text. |
| **WebSocket** | Full‑duplex communication protocol for real‑time updates. |
| **PSRAM** | Pseudo‑Static RAM – external RAM available on ESP‑CAM. |
| **JWT** | JSON Web Token – for authentication. |

---

## 19. Appendices

### A. Detailed API Endpoint Specifications (OpenAPI summary)
- See Section 9 for details. Full OpenAPI spec will be auto‑generated by FastAPI.

### B. Hardware Wiring Diagrams (Textual)
- See Section 5.2.

### C. Sample Environment Variables (`.env`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/guardianmesh
REDIS_URL=redis://localhost:6379
YOLO_MODEL_PATH=models/yolov8n.onnx
FACE_RECOGNITION_MODEL_PATH=models/face_model.dat
STT_MODEL=base  # whisper model size
CAMERA_RESOLUTION=800x600
```
### D. Code Snippets (Reference)

#### D.1 ESP32 PIR Interrupt (Arduino)
```cpp
volatile bool motionDetected = false;

void IRAM_ATTR motionISR() {
  motionDetected = true;
}

void setup() {
  pinMode(PIR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIR_PIN), motionISR, RISING);
}

void loop() {
  if (motionDetected) {
    motionDetected = false;
    sendAlert();
    delay(1000); // debounce
  }
}
```

#### D.2 FastAPI WebSocket Endpoint
```python
from fastapi import WebSocket

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Add to active connections list
    while True:
        data = await websocket.receive_text()
        # Process any incoming messages if needed
```

#### D.3 Frontend WebSocket Client (React)
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('ws://localhost:8000/ws');

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    socket.on('alert', (data) => {
      setAlerts(prev => [data, ...prev]);
    });
    return () => socket.off('alert');
  }, []);
  // ...
}
```

---

**Document Version:** 2.1 (Servo Removed)  
**Status:** Final – Ready for Implementation  
**Last Updated:** 2026-07-06  
**Approved By:** Project Team Lead

---
