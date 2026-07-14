# Product Requirement Document (PRD) – VitalSense

**Camera-Free Ambient Activity Monitor for Independent Living**

**Document Version:** 2.0 (Formal)  
**Status:** Draft for Hackathon Implementation  
**Last Updated:** July 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [Scope & Objectives](#2-scope--objectives)  
3. [Target Audience & Personas](#3-target-audience--personas)  
4. [System Architecture Overview](#4-system-architecture-overview)  
5. [Hardware Component Specification](#5-hardware-component-specification)  
6. [Firmware & Embedded Logic](#6-firmware--embedded-logic)  
7. [Communication Protocol & Data Schema](#7-communication-protocol--data-schema)  
8. [Backend & Anomaly Detection Engine](#8-backend--anomaly-detection-engine)  
9. [Dashboard & User Interface](#9-dashboard--user-interface)  
10. [Alert & Notification System](#10-alert--notification-system)  
11. [Non-Functional Requirements](#11-non-functional-requirements)  
12. [Hackathon Demo Script](#12-hackathon-demo-script)  
13. [Future Roadmap](#13-future-roadmap)  
14. [Glossary](#14-glossary)  
15. [Appendices](#15-appendices)

---

## 1. Executive Summary

### 1.1 Problem Statement
The global aging population is growing rapidly, with millions of seniors living alone while their families are at work or far away. Ensuring their safety without infringing on their privacy and dignity is a significant challenge. Current solutions are either:

- **Wearable panic buttons** – prone to non‑compliance (forgotten, uncomfortable, or unusable during a fall).
- **Camera-based monitors** – intrusive, raise serious privacy concerns, and are often rejected by the elderly.

### 1.2 VitalSense Solution
VitalSense is a **zero‑camera, ambient monitoring system** that uses passive infrared (PIR) and IR break‑beam sensors to learn a resident’s daily behavioural patterns (room transitions, typical inactivity durations per hour). By processing sparse time‑series data instead of video feeds, it detects severe anomalies—such as an abnormally long period of stillness during active hours or an incomplete room transition—and triggers both physical (audible/visual) and digital alerts for caregivers.

### 1.3 Core Differentiators
- **Privacy by Design** – No image/video capture, processing, or storage.
- **Edge‑Ready AI** – Uses time‑series anomaly detection (statistical or lightweight ML) that can eventually run on the edge.
- **Social Impact** – Directly addresses the growing need for safe, independent aging.

---

## 2. Scope & Objectives

### 2.1 In‑Scope (Hackathon MVP)
- Two sensing nodes: one PIR motion sensor (ESP32 NodeMCU) in the main living area, one IR break‑beam sensor (ESP32‑C3) at a key doorway.
- A central hub (ESP32 NodeMCU) that aggregates local sensor data and forwards it to the cloud backend.
- A lightweight cloud backend (FastAPI) that:
  - Receives sensor events.
  - Maintains a rolling activity timeline.
  - Runs an anomaly detection engine based on a pre‑seeded baseline.
  - Sends alert triggers to the dashboard and the physical alert unit.
- A web dashboard (React/Streamlit) showing real‑time status, activity timeline, and alerts.
- A physical alert station (Arduino UNO with buzzer and LED panel) that activates upon confirmed anomaly.
- Synthetic baseline seeding to bypass multi‑day calibration for the hackathon.
- End‑to‑end demo with two scripted scenarios: normal routine and emergency anomaly.

### 2.2 Out‑of‑Scope (MVP)
- Multi‑day automatic baseline learning (will be simulated with seed data).
- Integration with external SMS/phone gateways (Twilio etc.) – though noted for future.
- Mobile app – web dashboard only.
- On‑device TinyML – planned for post‑hackathon.
- Support for multiple households or user accounts – single‑user for demo.

---

## 3. Target Audience & Personas

| Persona | Description | Needs & Pain Points |
|---------|-------------|----------------------|
| **Elderly Resident (Primary)** | Lives alone, aged 75+, values independence and privacy, refuses cameras or wearables. | – Safety without intrusion.<br>– System works passively, no buttons to press.<br>– No daily maintenance. |
| **Caregiver / Adult Child (Secondary)** | Works full‑time, lives in a different city, constantly worries about parent’s well‑being. | – Reliable, low‑false‑alarm alerts.<br>– Easy remote check‑in.<br>– Peace of mind from a non‑invasive solution. |
| **Neighbour / Emergency Contact** | Listed as a local point of contact. | – Clear guidance when alert is triggered.<br>– Ability to physically check on the resident. |

---

## 4. System Architecture Overview

The system is composed of four logical layers, mapped to physical hardware as follows:

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLOUD BACKEND (FastAPI)                     │
│  - InfluxDB (time‑series)  - Anomaly Engine  - WebSocket       │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTP / WebSocket (WiFi)
                │
┌───────────────▼──────────────────────────────────────────────────┐
│              LOCAL NETWORK (WiFi)                               │
└───┬─────────────────────────────────────────────────────────────┘
    │                                                             │
    │                    ┌─────────────────────┐                  │
    │                    │ ESP32 NodeMCU       │                  │
    │                    │ (Central Hub)       │◄─── PIR Sensor   │
    │                    │                     │                  │
    │                    └──────────┬──────────┘                  │
    │                               │ HTTP / WiFi                 │
    │                    ┌──────────▼──────────┐                  │
    │                    │ ESP32‑C3 Mini       │                  │
    │                    │ (Secondary Node)    │◄─── IR Break‑beam│
    │                    └─────────────────────┘                  │
    │                                                             │
    │                    ┌─────────────────────┐                  │
    │                    │ Arduino UNO         │                  │
    │                    │ (Alert Station)     │─── Buzzer + LEDs │
    │                    └─────────────────────┘                  │
    │                            ▲                                │
    │                            │ Serial / Local Trigger         │
    └────────────────────────────┴────────────────────────────────┘
```

**Data Flow:**
1. Sensor events from the ESP32-C3 (IR transitions) and the ESP32 NodeMCU (PIR motion) are sent via HTTP POST to the backend (or via MQTT, depending on implementation choice).  
2. The backend processes events, updates a sliding window of activity, and runs anomaly detection.  
3. When an anomaly is confirmed, the backend:  
   - Updates the dashboard in real‑time via WebSocket.  
   - Sends an HTTP POST to a local endpoint hosted on the Arduino (e.g., a simple web server) to trigger the physical alert.  
4. The Arduino receives the trigger and activates the buzzer/LED panel.

---

## 5. Hardware Component Specification

### 5.1 Hardware Inventory

| Board | Role | Sensors / Peripherals | Placement |
|-------|------|-----------------------|-----------|
| **ESP32 NodeMCU** | Central Hub + PIR node | – HC‑SR501 PIR motion sensor<br>– (Optional) DHT11 for temperature/humidity (not used in MVP) | Living room, at 2‑2.5m height, facing main traffic area. |
| **ESP32‑C3 Mini** | Secondary Doorway Node | – TCRT5000 or similar IR break‑beam pair (transmitter + receiver) | Doorway between hallway and bathroom (or between living room and kitchen). Installed at 10‑15cm height (avoid pet triggers). |
| **Arduino UNO** | Local Alert Station | – Passive piezo buzzer (85‑90dB)<br>– RGB LED strip or 3 individual LEDs (Red/Amber/Green)<br>– (Optional) push button to acknowledge alert | Near the entrance or kitchen, visible and audible from main areas. |
| **Power** | All boards powered via USB or 5V adapters; no batteries for MVP. | – | – |

### 5.2 Sensor Technical Details

#### PIR Sensor (HC‑SR501)
- Detection range: up to 7m (adjustable).
- Field of view: 120°.
- Output: digital HIGH when motion detected, LOW after timeout.
- Configuration: set to retriggering mode, time delay ~5s to avoid too many triggers.

#### IR Break‑beam (TCRT5000)
- Composed of IR LED and phototransistor.
- Digital output: HIGH when beam is broken, LOW when clear.
- Mount both transmitter and receiver facing each other across the doorway.
- Sensitivity adjustable via potentiometer.

### 5.3 Pin Mapping (Reference)

#### ESP32 NodeMCU (PIR)
| PIR Pin | ESP32 Pin |
|---------|-----------|
| VCC     | 5V        |
| GND     | GND       |
| OUT     | GPIO 4    |

#### ESP32-C3 (IR Break‑beam)
| IR Module Pin | ESP32‑C3 Pin |
|---------------|--------------|
| VCC           | 3.3V         |
| GND           | GND          |
| OUT (receiver)| GPIO 5       |

#### Arduino UNO (Alert Station)
| Component | Arduino Pin |
|-----------|-------------|
| Buzzer    | D9          |
| Red LED   | D10         |
| Amber LED | D11         |
| Green LED | D12         |
| (Optional) Acknowledge button | D8 |

---

## 6. Firmware & Embedded Logic

### 6.1 ESP32 NodeMCU (Central Hub + PIR)

**Responsibilities:**
- Poll PIR sensor every 100ms.
- Detect state changes (LOW→HIGH = motion start, HIGH→LOW = motion end).
- On motion start, send a single event `{type:"motion", node:"livingroom", timestamp}`. No repeated events unless motion stops and restarts.
- Aggregate events from the secondary ESP32‑C3? In this architecture, each node sends directly to the backend to simplify. The "hub" role is only logical; the ESP32 NodeMCU acts as a standalone PIR node.
- Send a heartbeat every 60 seconds: `{type:"heartbeat", node:"livingroom", timestamp}`.

**State Machine:**
```
IDLE → (motion detected) → SEND_EVENT → (wait for debounce) → IDLE
```
- Debounce: ignore further triggers for 2s after sending to avoid flooding.

### 6.2 ESP32‑C3 Mini (IR Break‑beam)

**Responsibilities:**
- Monitor IR receiver output.
- Detect beam break (LOW) and restore (HIGH).
- On break: send `{type:"transition", node:"bathroom_door", event:"enter"}`.
- On restore: send `{type:"transition", node:"bathroom_door", event:"exit"}`.
- Heartbeat every 60 seconds.

**Debounce:** IR beam may flicker; apply a 50ms debounce to avoid multiple triggers.

### 6.3 Arduino UNO (Alert Station)

**Responsibilities:**
- Run a simple HTTP server (using WiFi shield? Or Ethernet? For hackathon, we can use a serial connection to the backend if no network capability).  
   *Alternative:* Use the Arduino with an ESP‑01 Wi‑Fi module to receive HTTP triggers.  
   *Simpler:* The backend can send a command via serial over USB to the Arduino (if connected to the same computer). For the demo, we can either run a local script that listens for backend alerts and writes to serial, or we can use a local MQTT broker.  
   *Recommendation:* Use an ESP8266 or ESP32 instead of Arduino UNO for network connectivity, but the PRD states Arduino UNO. We can still use the UNO with an Ethernet shield or a software serial to an ESP‑01. For hackathon simplicity, we can use a Python script running on the same machine as the backend that listens for alert events and sends a serial command to the Arduino. That script can be part of the demo environment.

**Action on Alert:**
- Activate buzzer (PWM tone) and flash red LED rapidly.
- If amber/green LEDs are used, they indicate system status (e.g., green = normal, amber = warning, red = alert).
- Acknowledge button (optional) can silence the buzzer.

**State Machine:**
```
IDLE (green LED, buzzer off)
→ RECEIVE_ALERT → ACTIVATE_ALERT (red flashing, buzzer on)
→ (button press or backend reset) → RETURN_TO_IDLE
```

---

## 7. Communication Protocol & Data Schema

### 7.1 Transport Layer
- All nodes connect via Wi‑Fi to a local network (2.4 GHz).
- Use **HTTP POST** with JSON payloads to a known backend endpoint (e.g., `http://<backend_ip>:8000/event`).
- For real‑time dashboard updates, use **WebSocket** from backend to frontend.

### 7.2 Event Data Models

#### 7.2.1 Sensor Event (from ESP32 or ESP32‑C3)
```json
{
  "node_id": "esp32_livingroom_001",
  "node_type": "pir",
  "event_type": "motion_start",   // or "motion_end", "transition_enter", "transition_exit"
  "timestamp": "2026-07-07T14:30:25.123Z",
  "sequence_number": 42,
  "metadata": {
    "room": "living_room",
    "sensor_version": "1.0"
  }
}
```
- `timestamp` is ISO 8601 with milliseconds; generated on the node using NTP if available, otherwise local RTC.
- `sequence_number` is a monotonically increasing counter to detect lost packets.

#### 7.2.2 Heartbeat
```json
{
  "node_id": "esp32_livingroom_001",
  "event_type": "heartbeat",
  "timestamp": "2026-07-07T14:31:00.000Z",
  "uptime_seconds": 3600,
  "wifi_rssi": -45
}
```

#### 7.2.3 Anomaly Alert (from Backend to Dashboard & Arduino)
```json
{
  "alert_id": "alt-20260707-143500",
  "severity": "critical",
  "type": "prolonged_inactivity",
  "detected_at": "2026-07-07T14:35:00Z",
  "duration_seconds": 14400,
  "threshold_seconds": 3600,
  "confidence": 0.92,
  "location": "living_room",
  "last_activity_timestamp": "2026-07-07T10:35:00Z",
  "recommended_action": "Check on resident immediately."
}
```

#### 7.2.4 Clear Alert (Backend to Dashboard & Arduino)
```json
{
  "alert_id": "alt-20260707-143500",
  "action": "clear",
  "timestamp": "2026-07-07T14:40:00Z",
  "reason": "motion_detected"
}
```

### 7.3 Endpoints

| Endpoint | Method | Payload | Description |
|----------|--------|---------|-------------|
| `/event` | POST | Sensor Event | Ingest sensor data. |
| `/heartbeat` | POST | Heartbeat | Update node status. |
| `/alert/trigger` | POST | Alert payload | Trigger physical alert (sent to Arduino or its proxy). |
| `/alert/clear` | POST | Clear payload | Clear physical alert. |
| `/dashboard/ws` | WebSocket | – | Real‑time activity and alert updates to dashboard. |

**All endpoints require no authentication for MVP (local network).**

---

## 8. Backend & Anomaly Detection Engine

### 8.1 Technology Stack
- **Framework:** FastAPI (Python 3.10+)
- **Database:** InfluxDB (time‑series) or SQLite for simplicity. For hackathon, we can use in‑memory storage with persistence to JSON.
- **WebSocket:** FastAPI’s built‑in WebSocket support.
- **Anomaly Engine:** Custom Python module with statistical thresholds.

### 8.2 Data Storage Schema

#### Activity Table (Time‑Series)
| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | DateTime | Event time |
| `node_id` | String | Sensor identifier |
| `event_type` | String | motion_start, motion_end, transition_enter, transition_exit |
| `room` | String | Derived from node_id mapping |

#### Baseline Table (Pre‑seeded or Learned)
| Field | Type | Description |
|-------|------|-------------|
| `hour_slot` | Integer (0‑23) | Hour of day |
| `day_of_week` | Integer (0‑6) | 0=Monday, etc. |
| `mean_inactivity_seconds` | Float | Historical average of longest inactivity within that slot. |
| `std_inactivity_seconds` | Float | Standard deviation. |

For hackathon, we pre‑populate this table with synthetic data representing a typical elderly routine (e.g., active in morning, longer inactivity after lunch and overnight).

### 8.3 Anomaly Detection Algorithm

#### 8.3.1 Sliding Window Activity Tracking
For each node (room), maintain a queue of the last `N` events (or timestamps). The system computes the current inactivity duration as:
```
current_inactivity = now() - last_motion_timestamp
```
If no motion has been detected for a given room, that room is considered inactive.

#### 8.3.2 Dynamic Threshold Calculation
For a given hour of the day `h` and day of week `d`, retrieve the baseline mean (`μ`) and standard deviation (`σ`) for that slot. The threshold is:
```
threshold = μ + k * σ
```
where `k` is a sensitivity factor (default = 2.0). For night hours (22‑6), we multiply threshold by 2.0 to allow sleep.

#### 8.3.3 Anomaly Evaluation
The backend evaluates every incoming event or on a fixed cadence (e.g., every 30 seconds):
- For each monitored room, calculate `current_inactivity`.
- If `current_inactivity > threshold`, flag a potential anomaly.
- Confidence score is computed as:
```
confidence = min(1.0, (current_inactivity - μ) / (4 * σ))
```
If `confidence > 0.7`, an alert is generated.

#### 8.3.4 Sequence Break Detection (Bonus)
- If a `transition_enter` is received for a high‑risk area (bathroom) but no corresponding `transition_exit` or subsequent motion in the main room within a reasonable time (e.g., 30 minutes), the system increases the confidence score by 0.2.
- This can catch falls in the bathroom.

#### 8.3.5 Calibration Mode (Hackathon Seed)
- At startup, the backend loads the pre‑seeded baseline from a JSON file.
- A “Calibration” endpoint can be used to reset the baseline or add new data.

### 8.4 Alert Engine
- When an anomaly is confirmed (confidence > threshold), the backend:
  - Creates an alert record with a unique `alert_id`.
  - Sends a WebSocket message to all connected dashboard clients.
  - Sends an HTTP POST to the Arduino’s trigger endpoint (or to a local proxy script).
- If subsequent motion is detected in the affected room, the alert is automatically cleared, and a “clear” command is sent.

---

## 9. Dashboard & User Interface

### 9.1 Technology
- **Framework:** React (or Streamlit for rapid prototyping). We’ll use React with Chart.js for graphs.
- **Styling:** Material‑UI or custom CSS, focusing on large, clear text suitable for elder caregivers.

### 9.2 Dashboard Layout

```
+--------------------------------------------------+
| VitalSense                        [Status: Online] |
+--------------------------------------------------+
|  NODES:  ● Living Room (active)   ● Bathroom (ok) |
|          ● Alert Station (ready)                  |
+--------------------------------------------------+
|  ACTIVITY TIMELINE (Last 12 hours)                |
|  ┌────────────────────────────────────────────┐   |
|  │  ████████░░░░░░██████████████████████████   │   |
|  │  08:00  10:00  12:00  14:00  16:00  18:00  │   |
|  └────────────────────────────────────────────┘   |
|  Current Inactivity: Living Room: 2 min           |
|  Baseline: Normal                                 |
+--------------------------------------------------+
|  ALERTS (0 active)                               |
|  [No recent alerts]                              |
+--------------------------------------------------+
|  System Log                                       |
|  [14:30:25] Motion detected in Living Room       |
|  [14:35:10] Transition detected: Bathroom entry  |
+--------------------------------------------------+
```

### 9.3 Real‑Time Updates
- Dashboard connects via WebSocket and updates:
  - Node status (heartbeat)
  - Activity timeline (new events are appended)
  - Current inactivity durations
  - Alert banner (flashing red when alert active)

### 9.4 Admin Controls (for demo)
- A “Trigger Demo Anomaly” button to simulate a fall for testing.
- A “Clear Alert” button.

---

## 10. Alert & Notification System

### 10.1 Physical Alert (Arduino)
- On trigger: buzzer emits a pulsing tone (e.g., 2 kHz, 500ms on/off). Red LED flashes.
- On clear: buzzer stops, red LED turns off, green LED turns on.
- The Arduino hosts a simple HTTP server (via ESP‑01) that listens for POST requests at `/alert` with a JSON payload. Alternatively, use a serial bridge script.

### 10.2 Digital Alerts (Dashboard)
- Dashboard shows a prominent red banner with the alert details, timestamp, and location.
- A "Acknowledge" button can be used to silence the physical alert remotely.

### 10.3 Alert Escalation (Not in MVP, but described)
- Future: SMS/WhatsApp to caregiver and neighbours after 2 minutes of unacknowledged alert.

---

## 11. Non‑Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Privacy** | System must not capture, store, or transmit any image or video data. |
| **Latency** | Alert must fire within 5 seconds of anomaly condition being met (excluding network delays). |
| **Reliability** | Nodes shall send heartbeats; backend shall mark nodes as offline if no heartbeat received for 120 seconds. |
| **Scalability** | The backend should handle up to 10 events per second for MVP. |
| **Portability** | All software components must run on a single laptop for demo; hardware connected via USB or Wi‑Fi. |
| **Security** | For MVP, no authentication; but all traffic is within local network. |
| **Usability** | Dashboard shall be readable from 2m away (large fonts). |

---

## 12. Hackathon Demo Script

### 12.1 Setup
- Place all hardware on a table with labels.
- Laptop runs backend, dashboard, and serial bridge (if used).
- Connect Arduino to laptop via USB.
- Start backend and dashboard.

### 12.2 Scenario 1: Normal Routine (2 min)
1. Judge observes dashboard showing “Online” and green status.
2. Demonstrate motion: wave hand over PIR – dashboard updates with “Motion detected in Living Room” and activity graph shows a spike.
3. Demonstrate transition: break the IR beam – dashboard shows “Bathroom entry” and a transition marker.
4. Emphasize no camera is involved.

### 12.3 Scenario 2: Anomaly Detection (2 min)
1. Switch to demo mode: adjust baseline to reduce inactivity threshold (or use the “Demo Anomaly” button) to simulate a 4‑hour inactivity.
2. Alternatively, remain motionless for ~30 seconds (with threshold artificially lowered) until the alert triggers.
3. Dashboard flashes red with alert message, and Arduino buzzer/LED activates.
4. Demonstrate clear: wave hand over PIR – alert clears, Arduino stops, dashboard returns to normal.
5. Highlight the speed and reliability.

### 12.4 Closing Pitch
- Emphasize the social impact, privacy‑first design, and potential for real‑world deployment.
- Mention future enhancements (edge AI, SMS, smart home integration).

---

## 13. Future Roadmap

| Phase | Feature | Description |
|-------|---------|-------------|
| **Post‑Hackathon** | Edge ML (TinyML) | Compile anomaly model to run on ESP32, eliminating cloud dependency. |
| | SMS/WhatsApp Alerts | Integrate Twilio to send alerts to caregivers. |
| | Multiple Households | Allow caregivers to monitor multiple homes from one dashboard. |
| | Utility Data Integration | Connect to smart plugs (water/electricity usage) to enrich activity baseline. |
| | Mobile App | Provide native app for caregivers. |
| | Auto‑Learning | Automatically update baseline from real‑time data after an initial calibration period. |

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **PIR** | Passive Infrared sensor; detects motion by sensing heat changes. |
| **IR Break‑beam** | Infrared transmitter/receiver pair; beam break indicates passage. |
| **NodeMCU** | Development board based on ESP8266 or ESP32. |
| **ESP32‑C3** | Low‑cost, RISC‑V based Wi‑Fi/Bluetooth SoC. |
| **Baseline** | Statistical profile of normal activity patterns per hour/day. |
| **Anomaly** | Deviation from baseline indicating possible emergency. |
| **Confidence Score** | Value between 0 and 1 indicating likelihood of real anomaly. |
| **Heartbeat** | Periodic message from a node to confirm it is alive. |

---

## 15. Appendices

### A. Sample Baseline Data (JSON)
```json
{
  "baseline": [
    {"hour": 0, "dow": 0, "mean": 14400, "std": 3600},
    {"hour": 1, "dow": 0, "mean": 14400, "std": 3600},
    ...
    {"hour": 8, "dow": 0, "mean": 600, "std": 120},
    {"hour": 9, "dow": 0, "mean": 300, "std": 60},
    ...
  ]
}
```

### B. Arduino HTTP Trigger Endpoint (using ESP‑01)
- IP: 192.168.1.100, port 80.
- POST `/alert` with `{"action":"trigger","alert_id":"..."}`
- POST `/alert` with `{"action":"clear"}`

### C. Backend Environment Variables
```
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BASELINE_FILE=baseline.json
ALERT_STATION_URL=http://192.168.1.100/alert
```

### D. Quick Start Guide (for hackathon)
1. Flash ESP32 NodeMCU with firmware (Arduino IDE).
2. Flash ESP32‑C3 with firmware.
3. Set up Arduino UNO with Ethernet shield/ESP‑01, or run serial bridge.
4. Run backend: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Run dashboard: `npm start` (or `streamlit run dashboard.py`)
6. Connect all to same Wi‑Fi.
7. Start demo.
