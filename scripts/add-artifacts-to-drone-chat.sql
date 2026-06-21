-- ====================================================================
-- ENHANCED INCREMENTAL SEED: Drawers & Artifacts for Farm Patrol Drone
-- ====================================================================
-- Run AFTER scripts/seed-drone-extensive.sql
-- Populates artifacts, artifact_versions, parts, and connections
-- for the 'Farm Patrol Autonomous Drone Build' chat.
-- ====================================================================

BEGIN;

DO $$
DECLARE
    -- Primary IDs
    v_project_id  UUID;
    v_chat_id     UUID;

    -- Message IDs from existing chat
    v_msg_2_id    UUID;
    v_msg_4_id    UUID;
    v_msg_6_id    UUID;
    v_msg_8_id    UUID;
    v_msg_10_id   UUID;
    v_msg_12_id   UUID;

    -- Artifact IDs
    v_art_context_id   UUID := gen_random_uuid();
    v_art_mvp_id       UUID := gen_random_uuid();
    v_art_prd_id       UUID := gen_random_uuid();
    v_art_bom_id       UUID := gen_random_uuid();
    v_art_wiring_id    UUID := gen_random_uuid();
    v_art_code_id      UUID := gen_random_uuid();
    v_art_enclosure_id UUID := gen_random_uuid();
    v_art_budget_id    UUID := gen_random_uuid();

    -- Part IDs (for connections)
    v_part_battery_id    UUID := gen_random_uuid();
    v_part_pdb_id        UUID := gen_random_uuid();
    v_part_esc_1_id      UUID := gen_random_uuid();
    v_part_pixhawk_id    UUID := gen_random_uuid();
    v_part_esp32_id      UUID := gen_random_uuid();
    v_part_gps_id        UUID := gen_random_uuid();
    v_part_ultrasonic_id UUID := gen_random_uuid();
    v_part_barometer_id  UUID := gen_random_uuid();

    -- Text content
    v_mvp_content     TEXT;
    v_prd_content     TEXT;
    v_context_content TEXT;

    -- JSON content
    v_bom_json       JSONB;
    v_budget_json    JSONB;
    v_wiring_json    JSONB;
    v_code_json      JSONB;
    v_enclosure_json JSONB;

BEGIN
    -- ----------------------------------------------------------------
    -- 1. Locate the existing chat and project
    -- ----------------------------------------------------------------
    SELECT id, project_id
    INTO   v_chat_id, v_project_id
    FROM   chats
    WHERE  title = 'Farm Patrol Autonomous Drone Build'
    ORDER  BY created_at DESC
    LIMIT  1;

    IF v_chat_id IS NULL THEN
        RAISE EXCEPTION
            'Chat "Farm Patrol Autonomous Drone Build" not found. '
            'Run seed-drone-extensive.sql first.';
    END IF;

    RAISE NOTICE 'Found Chat ID: %  |  Project ID: %', v_chat_id, v_project_id;

    -- ----------------------------------------------------------------
    -- 2. Locate assistant messages by sequence number
    -- ----------------------------------------------------------------
    SELECT id INTO v_msg_2_id  FROM messages WHERE chat_id = v_chat_id AND sequence_number = 2;
    SELECT id INTO v_msg_4_id  FROM messages WHERE chat_id = v_chat_id AND sequence_number = 4;
    SELECT id INTO v_msg_6_id  FROM messages WHERE chat_id = v_chat_id AND sequence_number = 6;
    SELECT id INTO v_msg_8_id  FROM messages WHERE chat_id = v_chat_id AND sequence_number = 8;
    SELECT id INTO v_msg_10_id FROM messages WHERE chat_id = v_chat_id AND sequence_number = 10;
    SELECT id INTO v_msg_12_id FROM messages WHERE chat_id = v_chat_id AND sequence_number = 12;

    -- ================================================================
    -- 3. CONTENT: MVP
    -- ================================================================
    v_mvp_content := $MVP$
# 🚁 MVP: Farm Patrol Autonomous Drone

## What We're Building

A **fully autonomous agricultural surveillance drone** that eliminates the need for manual farm inspections. The system flies pre-programmed GPS patrol routes, streams real-time 1080p video to your smartphone, avoids obstacles intelligently, and returns home to recharge — all without you touching a controller.

---

## Core Capabilities

### 🛰️ Autonomous Navigation
Pre-load GPS waypoint missions via QGroundControl or the companion mobile app. The drone follows the route precisely using the u-blox M9N GPS (1.5 m CEP accuracy), adjusts altitude based on BMP280 barometer readings, and handles wind disturbances through the Pixhawk 6C's tuned PID loop.

### 📸 Live Video Streaming
The onboard Raspberry Pi Camera Module 3 delivers 1080p30 video over a dedicated 2.4 GHz Wi-Fi hotspot hosted by the ESP32-S3. Range is ~150 m in open fields. Footage is also written to a 32 GB MicroSD for later review.

### 🔋 Smart Battery Management
Continuous voltage monitoring via the Holybro Power Module. At 30 % charge the drone emits a low-battery warning. At 20 % it autonomously triggers Return-to-Home (RTH), lands, and waits for reconnection. No more dead-on-the-spot landings.

### 🛑 Obstacle Avoidance
Forward-facing HC-SR04 ultrasonic sensor feeds real-time distance data to the Pixhawk companion computer. Objects detected within 2 m trigger a halt-and-hover, followed by an automatic route re-plan or pilot alert.

### 🏠 Autonomous Recharging (Phase 2)
A 3D-printed landing dock with spring-contact charging pads enables unattended battery replenishment. The drone aligns using IR landing beacons and descends onto the contact plate for hands-free charging.

---

## Why This Matters

| Problem | Manual Inspection | Farm Patrol Drone |
|---|---|---|
| Time per 10-acre scan | ~2 hours on foot | ~12 minutes |
| Crop stress detection | Ground-level only | Aerial + thermal (Phase 2) |
| Irrigation leak visibility | Near-zero | High — overhead view |
| Livestock head count | Slow and error-prone | Automated via CV (Phase 2) |
| Cost per inspection | Labour @ ₹500/hr | ~₹3 amortised electricity |

---

## Phased Rollout

**Phase 1 — MVP (This Build):** Autonomous waypoint flight, live video, RTH, obstacle avoidance, manual charging. Budget: **₹25,800 (~$308)**.

**Phase 2 — Auto-Charge:** Docking station, contact-pad charging, extended route planning. Estimated additional cost: ~$80.

**Phase 3 — Precision Ag:** Multispectral NDVI camera, AI-driven crop stress heatmaps, integration with farm management software.

---

## Success Criteria for MVP Sign-Off

- ✅ Completes a 10-waypoint GPS loop with < 2 m deviation at each point
- ✅ Streams video at ≥ 720p30 with < 300 ms latency
- ✅ RTH triggers reliably at 20 % battery in all test flights
- ✅ Obstacle halt activates within 500 ms of detection
- ✅ Total build cost does not exceed $350
$MVP$;

    -- ================================================================
    -- 4. CONTENT: Project Context / Technical Architecture
    -- ================================================================
    v_context_content := $CTX$
# Technical Architecture: Farm Patrol Autonomous Drone

## System Overview

The drone is built around a **dual-brain architecture**: the Pixhawk 6C handles all safety-critical flight control (attitude, altitude, GPS hold, RTH), while the ESP32-S3 companion computer manages higher-level tasks (video streaming, Wi-Fi connectivity, telemetry relay, sensor fusion).

Communication between the two brains is via **MAVLink 2.0 over UART at 57,600 baud** — the industry-standard protocol for drone telemetry.

```
┌──────────────────────────────────────────────────────────┐
│                   DRONE SYSTEM DIAGRAM                   │
│                                                          │
│  [4S LiPo 5000mAh]──[Power Module]──[PDB]               │
│                          │                               │
│                    ┌─────┴─────┐                         │
│                    │ Pixhawk 6C│◄──── u-blox M9N GPS     │
│                    │(ArduCopter│◄──── BMP280 Barometer   │
│                    │ 4.5.x)    │◄──── HC-SR04 Ultrasonic │
│                    └─────┬─────┘                         │
│              MAVLink     │   UART 57600                  │
│              ◄───────────┤                               │
│                    ┌─────┴─────┐                         │
│                    │  ESP32-S3 │──── RPi Cam 3 (MIPI)   │
│                    │ Companion │──── Wi-Fi AP (2.4 GHz) │
│                    └───────────┘──── MicroSD 32 GB      │
│                                                          │
│  [ESC ×4]──[Motors 920 KV ×4]──[10×4.5 CF Props ×4]    │
└──────────────────────────────────────────────────────────┘
```

---

## Hardware Layer

### Flight Controller — Pixhawk 6C
- **Firmware:** ArduCopter 4.5.x (stable)
- **IMU:** Dual ICM-42688-P (6-axis) with vibration isolation
- **Barometer:** Internal + external BMP280 for redundancy
- **Interfaces:** 8× PWM MAIN OUT, TELEM1/2, GPS1/2, I2C, CAN, SPI
- **Safety:** Hardware kill switch, buzzer, RGB LED status indicator

### Companion Computer — ESP32-S3
- **Role:** Camera capture, Wi-Fi AP, MAVLink bridge, OSD overlay
- **Camera:** RPi Camera Module 3 via MIPI-CSI → internal JPEG encoder
- **Streaming:** MJPEG over HTTP on port 80 and WebSocket on port 81
- **MAVLink:** Parses HEARTBEAT, SYS_STATUS, GPS_RAW_INT, ATTITUDE

### Power Architecture
```
Battery (14.8 V nominal) 
  → Power Module (current + voltage sensing → Pixhawk ADC)
  → PDB (distributes raw VBAT to 4× ESCs)
  → ESC integrated 5 V / 3 A BEC → Pixhawk POWER1
  → Separate 3.3 V LDO on ESP32 DevKit
```

### Propulsion
- **Frame:** 450 mm carbon fibre X-quad
- **Motors:** 920 KV brushless, 188 W max each → 752 W total
- **ESCs:** BLHeli_32 30 A, DSHOT600 capable
- **Props:** 10 × 4.5 carbon fibre, CW/CCW matched pairs
- **Max thrust:** ~1,800 g per motor → 7,200 g total vs ~1,100 g AUW
- **Theoretical hover:** ~36 % throttle → ~22 min flight time

---

## Software Stack

| Layer | Component | Version |
|---|---|---|
| Flight Firmware | ArduCopter | 4.5.x |
| Ground Station | QGroundControl | Latest stable |
| ESP32 Framework | Arduino / PlatformIO | ESP-IDF 5.2 |
| MAVLink Library | mavlink/c_library_v2 | 2.0 |
| Camera Driver | esp32-camera | 2.0.x |
| OTA Updates | ArduinoOTA | Built-in |

---

## Network Architecture

```
Smartphone / Tablet
       │
       │  Wi-Fi (192.168.4.x)
       │
  [ESP32-S3 Access Point]  SSID: FarmPatrol-Drone
       │                   Pass: FarmSecure2026
       │
       ├── /          → Live MJPEG stream (1080p30)
       ├── /ws        → WebSocket telemetry (JSON, 10 Hz)
       ├── /cmd       → Command endpoint (arm/disarm/RTH/goto)
       └── /status    → JSON health dump (battery, GPS, mode)
```

---

## Calibration & Pre-flight Checklist

1. **Accelerometer calibration** — flat + 5-orientation in QGC
2. **Compass calibration** — outdoor, away from metal structures
3. **ESC calibration** — BLHeli_32 Suite via USB
4. **Radio calibration** — if using manual RC override
5. **Mission upload** — via QGC Plan view, verify fence boundaries
6. **Motor test** — low-throttle spin-up, check rotation directions
7. **Prop clearance check** — minimum 20 mm tip-to-frame
8. **Battery voltage verify** — ≥ 15.8 V before takeoff (4S full = 16.8 V)
$CTX$;

    -- ================================================================
    -- 5. CONTENT: PRD
    -- ================================================================
    v_prd_content := $PRD$
# Product Requirements Document
## Farm Patrol Autonomous Drone — v1.0

**Status:** Approved for Build  
**Owner:** Hardware Engineering  
**Last Updated:** June 2026

---

## 1. Executive Summary

This PRD defines the complete functional, non-functional, and safety requirements for the Farm Patrol Autonomous Drone MVP. The system must be buildable under $350, operable by a non-pilot farmer after a 30-minute onboarding session, and robust enough for daily agricultural use in dusty, humid, and GPS-challenged field environments.

---

## 2. User Personas

**Primary — Rajan (Farmer, 45):** Owns 25 acres of mixed crops in Maharashtra. Inspects fields twice daily on foot, spending 3+ hours. Not technically skilled; needs a "press start and walk away" experience.

**Secondary — Priya (Farm Manager, 30):** Manages 3 farms for an agri-cooperative. Needs fleet visibility, log exports, and integration with existing farm management software.

---

## 3. Functional Requirements

### 3.1 Flight & Navigation

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | Autonomous waypoint flight | P0 | Completes 10-point GPS mission with < 2 m deviation per waypoint |
| FR-002 | Return-to-Home (RTH) | P0 | Triggers at ≤ 20 % battery; lands within 1 m of launch point |
| FR-003 | Altitude hold | P0 | Maintains set altitude ± 0.5 m in winds up to 7 m/s |
| FR-004 | Geofence enforcement | P1 | Does not exit operator-defined polygon; triggers RTH if fence breached |
| FR-005 | Manual override | P1 | Pilot can take RC control at any time; Pixhawk returns to AUTO on switch |
| FR-006 | Auto-land on comms loss | P1 | If telemetry lost for > 15 s, drone descends at 0.5 m/s and lands |

### 3.2 Video & Telemetry

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-010 | Live video stream | P0 | 1080p30 MJPEG stream visible in mobile browser within 5 s of power-on |
| FR-011 | Video recording | P1 | Continuous SD recording; 32 GB stores ≥ 4 hours at 10 Mbps |
| FR-012 | Telemetry overlay | P1 | Battery %, GPS coords, altitude, speed rendered as OSD on stream |
| FR-013 | Low-latency streaming | P1 | End-to-end latency < 300 ms at 20 m range |

### 3.3 Obstacle Avoidance

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-020 | Forward obstacle detection | P1 | Detects objects ≥ 30 cm width within 0–200 cm range |
| FR-021 | Halt-and-hover response | P1 | Drone halts within 500 ms of detection; holds position |
| FR-022 | Pilot obstacle alert | P1 | Mobile app displays red "OBSTACLE DETECTED" banner with distance |

### 3.4 Battery & Power

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-030 | Battery voltage telemetry | P0 | Voltage reported to ± 0.1 V accuracy at 2 Hz |
| FR-031 | Low-battery warning | P0 | Audible + visual alert at ≤ 30 % charge |
| FR-032 | Critical RTH trigger | P0 | Autonomous RTH at ≤ 20 % charge, no pilot input required |
| FR-033 | Over-discharge protection | P0 | ESC cuts power before cell voltage drops below 3.3 V/cell |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Flight Endurance | ≥ 20 minutes at 50 % payload (camera + ESP32) |
| NFR-002 | Weather Resistance | IP54 — dust-tight, splash-resistant (light rain) |
| NFR-003 | Operating Temperature | 0 °C to 50 °C (Indian agricultural environment) |
| NFR-004 | MTBF | > 50 flight hours before first component failure |
| NFR-005 | Build Cost | Total BOM ≤ $350 USD |
| NFR-006 | Setup Time | < 30 minutes from box to first autonomous flight |
| NFR-007 | Weight | All-up weight (AUW) < 1,200 g (below DGCA micro-UAS threshold) |
| NFR-008 | Noise | < 72 dB at 3 m (not to disturb livestock) |

---

## 5. Safety & Compliance

- **DGCA India:** Compliant with Drone Rules 2021 — Nano/Micro category (< 250 g or Green Zone micro registration)
- **Pre-arm Checks:** Pixhawk enforces GPS lock (≥ 6 satellites), battery voltage, compass health, and barometer calibration before arming
- **Kill Switch:** Hardware safety button on Pixhawk disables all motor output instantly
- **Propeller Guards:** Recommended for Phase 1 testing over crops

---

## 6. Out of Scope (Phase 1)

- Thermal / multispectral imaging
- AI-powered crop stress detection
- Automatic recharging dock
- Fleet management (multiple drones)
- 4G/LTE telemetry link
$PRD$;

    -- ================================================================
    -- 6. CONTENT: BOM JSON
    -- ================================================================
    v_bom_json := $BOM${
      "project_name": "Farm Patrol Autonomous Drone — Complete BOM v1.2",
      "revision": "1.2",
      "revision_date": "2026-06-21",
      "currency": "USD",
      "summary": {
        "total_components": 21,
        "total_line_items": 21,
        "subtotal": 286.00,
        "shipping_estimate": 22.00,
        "grand_total": 308.00,
        "target_budget": 350.00,
        "budget_headroom": 42.00
      },
      "components": [
        {
          "id": "FC-001",
          "name": "Pixhawk 6C Flight Controller (Standard Set)",
          "partNumber": "PIX6C-STD",
          "category": "Flight Controller",
          "quantity": 1,
          "unitCost": 95.00,
          "lineCost": 95.00,
          "supplier": "Holybro",
          "link": "https://holybro.com/products/pixhawk-6c",
          "leadTimeDays": 5,
          "specs": {
            "MCU": "STM32H753",
            "IMU": "ICM-42688-P (×2)",
            "barometer": "BMP388",
            "interfaces": "8× PWM, TELEM1/2, GPS1/2, I2C, CAN, SPI, USB-C",
            "voltage": "4.75–5.25 V",
            "dimensions": "84 × 44 × 12 mm",
            "weight": "59 g with dampener"
          },
          "notes": "Includes power module, GPS mast, and JST-GH cable set. Do NOT substitute — clone units lack dual-IMU redundancy."
        },
        {
          "id": "SN-001",
          "name": "u-blox M9N GPS + IST8310 Compass",
          "partNumber": "M9N-GPS-COMBO",
          "category": "Sensors",
          "quantity": 1,
          "unitCost": 35.00,
          "lineCost": 35.00,
          "supplier": "Holybro",
          "link": "https://holybro.com/products/m9n-gps",
          "leadTimeDays": 5,
          "specs": {
            "chip": "u-blox M9N",
            "accuracyCEP": "1.5 m",
            "acquisitionColdStart": "24 s",
            "updateRate": "18 Hz",
            "interface": "UART + I2C",
            "compass": "IST8310 3-axis"
          },
          "notes": "Mount on top mast, minimum 5 cm above PDB to reduce magnetic interference."
        },
        {
          "id": "CC-001",
          "name": "ESP32-S3-DevKitC-1 (N16R8)",
          "partNumber": "ESP32-S3-DC-N16R8",
          "category": "Companion Computer",
          "quantity": 1,
          "unitCost": 8.00,
          "lineCost": 8.00,
          "supplier": "Espressif / Amazon",
          "link": "https://www.amazon.in/dp/B0C5JTHWMZ",
          "leadTimeDays": 3,
          "specs": {
            "CPU": "Xtensa LX7 dual-core 240 MHz",
            "RAM": "512 KB SRAM + 8 MB PSRAM",
            "flash": "16 MB",
            "wifi": "802.11 b/g/n 2.4 GHz",
            "bluetooth": "BLE 5.0",
            "camera": "MIPI-CSI 2-lane interface",
            "uart": "3× hardware UART"
          },
          "notes": "N16R8 variant is required — the extra PSRAM is essential for MJPEG frame buffering."
        },
        {
          "id": "CM-001",
          "name": "Raspberry Pi Camera Module 3",
          "partNumber": "SC0872",
          "category": "Camera",
          "quantity": 1,
          "unitCost": 35.00,
          "lineCost": 35.00,
          "supplier": "RPi Foundation / Amazon",
          "link": "https://www.raspberrypi.com/products/camera-module-3/",
          "leadTimeDays": 4,
          "specs": {
            "sensor": "Sony IMX708",
            "resolution": "12 MP",
            "videoMax": "1080p30 / 720p60",
            "interface": "MIPI-CSI 2-lane",
            "FOV": "66° diagonal",
            "autofocus": "Phase-detect AF",
            "dimensions": "25 × 24 × 11.5 mm"
          },
          "notes": "Use 15 cm flat-flex FPC cable to bridge ESP32-S3 MIPI connector. Protect with 3D-printed camera nacelle."
        },
        {
          "id": "MT-001",
          "name": "RacerStar 920 KV Brushless Motor (4-pack)",
          "partNumber": "BR2212-920KV-4PK",
          "category": "Propulsion",
          "quantity": 4,
          "unitCost": 12.00,
          "lineCost": 48.00,
          "supplier": "RacerStar / HobbyKing",
          "link": "https://hobbyking.com/en_us/racerstar-br2212.html",
          "leadTimeDays": 7,
          "specs": {
            "KV": "920 KV",
            "maxPower": "188 W",
            "maxThrust": "850 g with 10×4.5 prop",
            "statorSize": "2212",
            "shaft": "3.17 mm",
            "weight": "52 g",
            "connectors": "3.5 mm banana plugs"
          },
          "notes": "Buy as a 4-pack. CW and CCW shaft threads are in the pack — label each motor before mounting."
        },
        {
          "id": "ES-001",
          "name": "30 A BLHeli_32 ESC",
          "partNumber": "HK-30A-BL32",
          "category": "Propulsion",
          "quantity": 4,
          "unitCost": 9.00,
          "lineCost": 36.00,
          "supplier": "HobbyKing",
          "link": "https://hobbyking.com/en_us/blheli32-30a.html",
          "leadTimeDays": 7,
          "specs": {
            "continuousCurrent": "30 A",
            "burstCurrent": "40 A (10 s)",
            "inputVoltage": "2–6S LiPo",
            "firmware": "BLHeli_32",
            "protocol": "DSHOT600 / OneShot125 / PWM",
            "BEC": "5 V / 3 A",
            "weight": "15 g"
          },
          "notes": "Flash BLHeli_32 latest firmware before installation. Enable motor direction in BLHeli Suite — CW motors need reverse rotation."
        },
        {
          "id": "PR-001",
          "name": "HQProp 10×4.5 Carbon Fibre Props (2× CW + 2× CCW)",
          "partNumber": "HQ-1045-CF-SET",
          "category": "Propulsion",
          "quantity": 4,
          "unitCost": 4.00,
          "lineCost": 16.00,
          "supplier": "HQProp / HobbyKing",
          "link": "https://hobbyking.com",
          "leadTimeDays": 5,
          "specs": {
            "diameter": "10 inch",
            "pitch": "4.5 inch",
            "material": "Carbon fibre reinforced nylon",
            "hubBore": "10 mm with adapters for 8, 6, 5 mm",
            "balancing": "Factory balanced",
            "tipClearance": "22 mm from frame arm (450 mm frame)"
          },
          "notes": "Order 2 spare sets. CF props are brittle on hard landings. Always balance before first flight."
        },
        {
          "id": "BT-001",
          "name": "Tattu 4S 5000 mAh LiPo 45C (XT60)",
          "partNumber": "TA-5000-4S-45C-XT60",
          "category": "Power",
          "quantity": 1,
          "unitCost": 45.00,
          "lineCost": 45.00,
          "supplier": "Tattu / GensAce",
          "link": "https://www.gensace.de/tattu-5000mah-4s-45c.html",
          "leadTimeDays": 5,
          "specs": {
            "cells": "4S (4× 3.7 V nominal)",
            "nominalVoltage": "14.8 V",
            "fullVoltage": "16.8 V",
            "cutoffVoltage": "13.2 V (3.3 V/cell)",
            "capacity": "5000 mAh",
            "dischargeRating": "45C continuous / 90C burst",
            "maxCurrent": "225 A continuous",
            "weight": "345 g",
            "connector": "XT60 female"
          },
          "notes": "Do NOT use unknown-brand cells — low-quality batteries are the #1 cause of agricultural drone fires. Tattu or GensAce only."
        },
        {
          "id": "PW-001",
          "name": "Matek FCHUB-6S Power Distribution Board",
          "partNumber": "FCHUB-6S",
          "category": "Power",
          "quantity": 1,
          "unitCost": 6.00,
          "lineCost": 6.00,
          "supplier": "Matek Systems",
          "link": "https://www.mateksys.com/?portfolio=fchub-6s",
          "leadTimeDays": 3,
          "specs": {
            "inputVoltage": "3–6S LiPo",
            "maxCurrent": "120 A continuous",
            "ESCpads": "4× ESC pads (solder)",
            "5VBEC": "5 V / 2 A regulated BEC",
            "currentSensor": "Built-in 184 A sensor",
            "dimensions": "40 × 40 mm",
            "mountingPattern": "30.5 × 30.5 mm"
          },
          "notes": "Route 14 AWG power wires. Keep solder joints < 3 mm above pad surface to avoid shorts."
        },
        {
          "id": "PW-002",
          "name": "SkyRC iMAX B6AC V2 Charger",
          "partNumber": "SK-100006-02",
          "category": "Power",
          "quantity": 1,
          "unitCost": 28.00,
          "lineCost": 28.00,
          "supplier": "SkyRC / Amazon",
          "link": "https://www.skyrc.com/imax-b6ac-v2",
          "leadTimeDays": 3,
          "specs": {
            "maxChargeRate": "6 A",
            "maxPower": "80 W",
            "inputAC": "100–240 V",
            "inputDC": "11–18 V",
            "balanceCells": "2–6S",
            "storageMode": "Yes",
            "display": "Colour LCD"
          },
          "notes": "Always charge at 1C rate (5 A for 5000 mAh pack). Never charge unattended. Storage charge at 3.85 V/cell between flights."
        },
        {
          "id": "FR-001",
          "name": "F450 450 mm Carbon Fibre Frame Kit",
          "partNumber": "F450-CF-KIT",
          "category": "Frame",
          "quantity": 1,
          "unitCost": 28.00,
          "lineCost": 28.00,
          "supplier": "Amazon / Banggood",
          "link": "https://www.amazon.in/dp/B07X2BH6BV",
          "leadTimeDays": 3,
          "specs": {
            "wheelbase": "450 mm motor-to-motor",
            "material": "Carbon fibre arms + PCB centre plates",
            "maxAUW": "1800 g recommended",
            "armDiameter": "16 mm",
            "motorMountHoles": "16 × 19 mm pattern",
            "includesHardware": "M3 screws, standoffs, nuts"
          },
          "notes": "The PCB top/bottom plates act as the power bus — solder XT60 input to bottom plate pads."
        },
        {
          "id": "SN-002",
          "name": "HC-SR04 Ultrasonic Distance Sensor",
          "partNumber": "SEN-HC-SR04",
          "category": "Sensors",
          "quantity": 1,
          "unitCost": 3.00,
          "lineCost": 3.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B07THHQMHM",
          "leadTimeDays": 2,
          "specs": {
            "range": "2 cm – 400 cm",
            "accuracy": "± 3 mm",
            "frequency": "40 kHz",
            "triggerPulse": "10 µs TTL",
            "supplyVoltage": "5 V",
            "current": "15 mA",
            "fieldOfView": "15° cone"
          },
          "notes": "Mount facing forward on the nose of the frame. Use a 5 V → 3.3 V voltage divider on the ECHO pin before connecting to ESP32."
        },
        {
          "id": "SN-003",
          "name": "BMP280 Barometric Pressure + Temperature Sensor",
          "partNumber": "BMP280-MODULE",
          "category": "Sensors",
          "quantity": 1,
          "unitCost": 4.00,
          "lineCost": 4.00,
          "supplier": "Adafruit / Amazon",
          "link": "https://www.adafruit.com/product/2651",
          "leadTimeDays": 2,
          "specs": {
            "interface": "I2C (0x76) or SPI",
            "pressureRange": "300–1100 hPa",
            "altitudeResolution": "0.12 m RMS",
            "supplyVoltage": "1.8–3.6 V",
            "current": "2.7 µA at 1 Hz"
          },
          "notes": "Mount inside a small foam-padded enclosure to shield from rotor downwash pressure spikes."
        },
        {
          "id": "ST-001",
          "name": "Holybro Telemetry Radio 433 MHz (Air + Ground set)",
          "partNumber": "TR-433-V3-SET",
          "category": "Telemetry",
          "quantity": 1,
          "unitCost": 25.00,
          "lineCost": 25.00,
          "supplier": "Holybro",
          "link": "https://holybro.com/products/sik-telemetry-radio-v3",
          "leadTimeDays": 5,
          "specs": {
            "frequency": "433 MHz",
            "range": "300 m LOS",
            "txPower": "100 mW (20 dBm)",
            "protocol": "SiK 2.0 + MAVLink",
            "dataRate": "250 kbps air",
            "interface": "UART 57600 baud",
            "encryption": "AES-128"
          },
          "notes": "Connect air module to Pixhawk TELEM1. Plug ground module into laptop for QGroundControl. Must legally stay at 433 MHz in India."
        },
        {
          "id": "ST-002",
          "name": "MicroSD Card 32 GB (Class 10 / A1)",
          "partNumber": "SDSQUA4-032G",
          "category": "Storage",
          "quantity": 1,
          "unitCost": 7.00,
          "lineCost": 7.00,
          "supplier": "SanDisk / Amazon",
          "link": "https://www.amazon.in/dp/B073K14CVB",
          "leadTimeDays": 2,
          "specs": {
            "capacity": "32 GB",
            "speedClass": "A1 / Class 10",
            "readSpeed": "100 MB/s",
            "writeSpeed": "40 MB/s",
            "formFactor": "MicroSDHC"
          },
          "notes": "Format as FAT32. Pixhawk logs DataFlash to it; ESP32 writes MJPEG recordings. Replace every 50 flight hours."
        },
        {
          "id": "HW-001",
          "name": "Anti-vibration Silicone Grommets M3 (16-pack)",
          "partNumber": "VIB-DAMP-M3-16",
          "category": "Hardware",
          "quantity": 16,
          "unitCost": 0.06,
          "lineCost": 1.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B08CY7JQRM",
          "leadTimeDays": 2,
          "specs": {
            "material": "Silicone 40 Shore A",
            "thread": "M3",
            "isolationFreq": "80–200 Hz (motor harmonics)"
          },
          "notes": "Use under all 4 Pixhawk mounting screws to isolate IMU from motor vibration. Critical for stable attitude estimation."
        },
        {
          "id": "HW-002",
          "name": "Silicone Wire 14 AWG Red + Black (3 m each)",
          "partNumber": "SIL-14AWG-RB",
          "category": "Hardware",
          "quantity": 1,
          "unitCost": 5.00,
          "lineCost": 5.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B07G2GLKMP",
          "leadTimeDays": 2,
          "specs": {
            "gauge": "14 AWG",
            "maxCurrent": "32 A",
            "insulation": "Silicone — flexible at -50 °C to +200 °C",
            "strandCount": "400 × 0.08 mm ultra-fine stranded"
          },
          "notes": "Use exclusively for high-current runs (battery → PDB → ESC). Silicone flex wire survives vibration far better than PVC."
        },
        {
          "id": "HW-003",
          "name": "XT60 Male + Female Connector Pairs (5-pack)",
          "partNumber": "XT60-5PK",
          "category": "Hardware",
          "quantity": 5,
          "unitCost": 0.80,
          "lineCost": 4.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B07BJRL2CS",
          "leadTimeDays": 2,
          "specs": {
            "rating": "60 A continuous",
            "burstRating": "90 A",
            "material": "Nylon PA66 + gold-plated copper",
            "keyedPolarity": "Yes — cannot reverse-connect"
          },
          "notes": "Tin the wires and connector cups before joining. Do NOT solder with the connector mated — heat warps the nylon."
        },
        {
          "id": "HW-004",
          "name": "Dupont Jumper Wire Set 40-pin (M-F, F-F, M-M)",
          "partNumber": "DUPONT-40-SET",
          "category": "Hardware",
          "quantity": 1,
          "unitCost": 3.00,
          "lineCost": 3.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B07GD2BWPY",
          "leadTimeDays": 2,
          "specs": {
            "gauge": "24 AWG",
            "lengths": "20 cm",
            "types": "M-M, M-F, F-F (120 wires total)"
          },
          "notes": "Use for low-current signal connections only (sensors, UART, I2C). Secure bundles with zip ties every 5 cm."
        },
        {
          "id": "HW-005",
          "name": "Heat Shrink Tubing Assortment (3–20 mm, 350 pcs)",
          "partNumber": "HEAT-SHRINK-350",
          "category": "Hardware",
          "quantity": 1,
          "unitCost": 6.00,
          "lineCost": 6.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B07JCKZC3H",
          "leadTimeDays": 2,
          "specs": {
            "ratio": "2:1 shrink ratio",
            "material": "Polyolefin",
            "temperatureRating": "125 °C",
            "sizes": "3 / 4 / 6 / 8 / 10 / 13 / 16 / 20 mm"
          },
          "notes": "Cover all solder joints on power wires and motor connectors. Use larger sizes over ESC solder pads."
        },
        {
          "id": "HW-006",
          "name": "M3 Nylon Screw + Nut Assortment (200 pcs)",
          "partNumber": "M3-NYLON-200",
          "category": "Hardware",
          "quantity": 1,
          "unitCost": 6.00,
          "lineCost": 6.00,
          "supplier": "Amazon",
          "link": "https://www.amazon.in/dp/B07VKQHBPC",
          "leadTimeDays": 2,
          "specs": {
            "material": "PA66 nylon — non-conductive, non-magnetic",
            "sizes": "M3 × 5 / 8 / 10 / 12 / 16 mm with hex nuts",
            "use": "Electronics mounting where metal fasteners risk shorts"
          },
          "notes": "Use nylon for all Pixhawk and ESP32 board mounts. Use metal M3 for frame assembly and motor attachment."
        }
      ],
      "warnings": [
        "⚠️  Never exceed 45C discharge rating on the battery — it degrades cells and is a fire risk.",
        "⚠️  XT60 connectors are keyed but not foolproof; verify polarity with a multimeter before first battery connection.",
        "⚠️  BLHeli_32 ESCs require calibration after firmware flash — skip this and motors spin unevenly.",
        "⚠️  Ensure Pixhawk GPS mast provides clear sky view and is at least 5 cm from carbon fibre arms (RF interference).",
        "⚠️  PETG or ABS only for enclosure prints — PLA softens above 60 °C in direct Indian summer sun."
      ],
      "powerBudget": {
        "hoverCurrentPerMotor_A": 8.5,
        "totalHoverCurrent_A": 34,
        "batteryCapacity_mAh": 5000,
        "estimatedHoverTime_min": 22,
        "peakCurrentAt100pct_A": 120,
        "batteryRating_A": 225,
        "safetyMargin": "88 % headroom at peak"
      }
    }$BOM$::jsonb;

    -- ================================================================
    -- 7. CONTENT: Budget JSON
    -- ================================================================
    v_budget_json := $BGT${
      "summary": {
        "originalQuoteTotal": 390.00,
        "optimisedTotal": 308.00,
        "totalSavings": 82.00,
        "savingsPercent": 21,
        "targetBudget": 350.00,
        "remainingHeadroom": 42.00,
        "currency": "USD"
      },
      "costBreakdownByCategory": [
        { "category": "Flight Controller", "cost": 95.00, "percentOfTotal": 31 },
        { "category": "Propulsion (motors + ESCs + props)", "cost": 100.00, "percentOfTotal": 32 },
        { "category": "Camera + Companion", "cost": 43.00, "percentOfTotal": 14 },
        { "category": "Power System", "cost": 79.00, "percentOfTotal": 26 },
        { "category": "Frame + Hardware", "cost": 49.00, "percentOfTotal": 16 },
        { "category": "Sensors + Telemetry", "cost": 67.00, "percentOfTotal": 22 }
      ],
      "optimisations": [
        {
          "id": "OPT-001",
          "component": "Brushless Motors",
          "original": { "item": "T-Motor MN2212 (individual units)", "cost": 80.00 },
          "alternative": { "item": "RacerStar 920 KV 4-pack bundle", "cost": 48.00 },
          "savings": 32.00,
          "riskLevel": "Low-Medium",
          "reasoning": "RacerStar motors have comparable thrust-to-weight for agricultural monitoring payloads. T-Motor's premium is justified for racing, not 20-minute patrol missions.",
          "tradeoff": "Bearing lifespan ~600 h vs T-Motor ~1,500 h. Plan motor replacement at 150 h."
        },
        {
          "id": "OPT-002",
          "component": "GPS Module",
          "original": { "item": "Here3 CAN GPS (RTK-ready)", "cost": 120.00 },
          "alternative": { "item": "Holybro M9N GPS + IST8310 combo", "cost": 35.00 },
          "savings": 85.00,
          "riskLevel": "Low",
          "reasoning": "RTK is overkill for farm patrol. The M9N gives 1.5 m CEP — more than adequate for waypoint missions with 5 m safety corridors.",
          "tradeoff": "No RTK precision (< 2 cm). Acceptable for Phase 1."
        },
        {
          "id": "OPT-003",
          "component": "Telemetry Radio",
          "original": { "item": "RFD900x long-range radio set", "cost": 180.00 },
          "alternative": { "item": "Holybro SiK 433 MHz V3 set", "cost": 25.00 },
          "savings": 155.00,
          "riskLevel": "Medium",
          "reasoning": "RFD900x has 40 km range — far beyond farm size or DGCA visual-line-of-sight requirements. SiK V3 at 300 m range is legally and practically sufficient.",
          "tradeoff": "Max range 300 m vs 40 km. Adequate for 25-acre operations."
        },
        {
          "id": "OPT-004",
          "component": "Companion Computer",
          "original": { "item": "Raspberry Pi 4 (4 GB)", "cost": 55.00 },
          "alternative": { "item": "ESP32-S3 DevKitC N16R8", "cost": 8.00 },
          "savings": 47.00,
          "riskLevel": "Medium",
          "reasoning": "RPi 4 adds Linux flexibility but draws 3 W continuously — reducing flight time by ~2 min. ESP32-S3 handles MJPEG streaming and MAVLink bridging within its PSRAM, draws 0.3 W.",
          "tradeoff": "No Linux, no OpenCV on-board. Phase 2 AI vision module will need RPi 5 add-on."
        }
      ],
      "phaseInvestments": [
        {
          "phase": 1,
          "label": "MVP Build (This Phase)",
          "cost": 308.00,
          "included": ["Autonomous waypoint flight", "1080p live streaming", "RTH + obstacle detection", "Manual charging"]
        },
        {
          "phase": 2,
          "label": "Auto-Charging Dock",
          "estimatedAdditional": 80.00,
          "included": ["3D-printed landing dock", "Contact-pad charger", "IR landing beacon", "Extended route planning"]
        },
        {
          "phase": 3,
          "label": "Precision Agriculture",
          "estimatedAdditional": 250.00,
          "included": ["Multispectral NDVI camera", "Onboard AI crop stress detection", "Farm management software API"]
        }
      ],
      "riskFlags": [
        "🔴 HIGH: Do not cut cost on the battery — cheap cells in agricultural climates (50 °C ambient) are a fire hazard.",
        "🟡 MEDIUM: GPS accuracy depends on unobstructed sky view; additional 20 cm mast may be needed in dense orchards.",
        "🟢 LOW: Motor brand can be substituted if RacerStar 4-pack goes out of stock — see OPT-001 alternatives."
      ],
      "shippingNotes": {
        "estimatedShipping": 22.00,
        "recommendations": [
          "Consolidate HobbyKing orders to one shipment — free shipping above $50.",
          "Holybro ships Pixhawk + GPS together as a bundle — saves ₹400 in customs clearance.",
          "Battery must ship via ground freight — air freight of LiPo restricted in India."
        ]
      }
    }$BGT$::jsonb;

    -- ================================================================
    -- 8. CONTENT: Wiring JSON
    -- ================================================================
    v_wiring_json := $WRG${
      "schemaVersion": "2.0",
      "droneModel": "Farm Patrol Autonomous Drone",
      "powerRail": "4S LiPo (14.8 V nominal)",
      "connections": [
        {
          "id": "PWR-001",
          "label": "Main Battery → Power Module",
          "from_component": "Tattu 4S 5000 mAh Battery",
          "from_pin": "XT60 Male (positive)",
          "to_component": "Holybro Power Module",
          "to_pin": "XT60 Female Battery IN",
          "wire_color": "Red",
          "wire_gauge": "14 AWG",
          "voltage": "14.8 V nominal",
          "current": "120 A peak",
          "notes": "Main supply connection. Keep wire run < 15 cm to minimise inductance. Secure with cable tie every 5 cm.",
          "safety": "Verify polarity before first connection. XT60 is keyed but double-check with multimeter."
        },
        {
          "id": "PWR-002",
          "label": "Power Module → PDB",
          "from_component": "Holybro Power Module",
          "from_pin": "XT60 Male Output",
          "to_component": "Matek FCHUB-6S PDB",
          "to_pin": "XT60 Female IN",
          "wire_color": "Red/Black",
          "wire_gauge": "14 AWG",
          "voltage": "14.8 V nominal",
          "current": "120 A peak",
          "notes": "Run VBAT from power module to PDB. The power module senses current on this rail and reports to Pixhawk ADC."
        },
        {
          "id": "PWR-003",
          "label": "PDB → ESC 1 (Front Right — CW)",
          "from_component": "Matek FCHUB-6S PDB",
          "from_pin": "ESC Solder Pad A+",
          "to_component": "ESC 1 (Front Right)",
          "to_pin": "Power Lead +",
          "wire_color": "Red",
          "wire_gauge": "14 AWG",
          "voltage": "14.8 V",
          "current": "30 A",
          "notes": "Front-right motor is CW rotation. Label ESC before mounting."
        },
        {
          "id": "PWR-004",
          "label": "PDB → ESC 2 (Rear Left — CW)",
          "from_component": "Matek FCHUB-6S PDB",
          "from_pin": "ESC Solder Pad B+",
          "to_component": "ESC 2 (Rear Left)",
          "to_pin": "Power Lead +",
          "wire_color": "Red",
          "wire_gauge": "14 AWG",
          "voltage": "14.8 V",
          "current": "30 A",
          "notes": "Rear-left motor is CW rotation. Diagonal pair with ESC 1."
        },
        {
          "id": "PWR-005",
          "label": "PDB → ESC 3 (Front Left — CCW)",
          "from_component": "Matek FCHUB-6S PDB",
          "from_pin": "ESC Solder Pad C+",
          "to_component": "ESC 3 (Front Left)",
          "to_pin": "Power Lead +",
          "wire_color": "Red",
          "wire_gauge": "14 AWG",
          "voltage": "14.8 V",
          "current": "30 A",
          "notes": "Front-left motor is CCW rotation."
        },
        {
          "id": "PWR-006",
          "label": "PDB → ESC 4 (Rear Right — CCW)",
          "from_component": "Matek FCHUB-6S PDB",
          "from_pin": "ESC Solder Pad D+",
          "to_component": "ESC 4 (Rear Right)",
          "to_pin": "Power Lead +",
          "wire_color": "Red",
          "wire_gauge": "14 AWG",
          "voltage": "14.8 V",
          "current": "30 A",
          "notes": "Rear-right motor is CCW rotation."
        },
        {
          "id": "PWR-007",
          "label": "PDB 5 V BEC → Pixhawk POWER1",
          "from_component": "Matek FCHUB-6S PDB",
          "from_pin": "5 V BEC Output",
          "to_component": "Pixhawk 6C",
          "to_pin": "POWER1 6-pin JST-GH",
          "wire_color": "Red (5 V) / Black (GND)",
          "wire_gauge": "22 AWG",
          "voltage": "5.1 V regulated",
          "current": "2 A max",
          "notes": "Uses the power module's regulated 5 V rail, not raw battery. Provides voltage + current ADC data to Pixhawk."
        },
        {
          "id": "SIG-001",
          "label": "ESC 1 PWM → Pixhawk MAIN OUT 1",
          "from_component": "ESC 1 (Front Right)",
          "from_pin": "Signal wire (White)",
          "to_component": "Pixhawk 6C",
          "to_pin": "MAIN OUT 1 (Signal pin)",
          "wire_color": "White",
          "wire_gauge": "26 AWG",
          "voltage": "3.3 V signal",
          "current": "< 5 mA",
          "notes": "Connect signal wire only. ESC provides its own 5 V via BEC — do NOT connect ESC red BEC wire to Pixhawk rail (backfeed risk)."
        },
        {
          "id": "SIG-002",
          "label": "ESC 2 PWM → Pixhawk MAIN OUT 2",
          "from_component": "ESC 2 (Rear Left)",
          "from_pin": "Signal wire (White)",
          "to_component": "Pixhawk 6C",
          "to_pin": "MAIN OUT 2 (Signal pin)",
          "wire_color": "White",
          "wire_gauge": "26 AWG",
          "voltage": "3.3 V signal",
          "current": "< 5 mA",
          "notes": "Same as SIG-001 — signal wire only."
        },
        {
          "id": "SIG-003",
          "label": "ESC 3 PWM → Pixhawk MAIN OUT 3",
          "from_component": "ESC 3 (Front Left)",
          "from_pin": "Signal wire (White)",
          "to_component": "Pixhawk 6C",
          "to_pin": "MAIN OUT 3 (Signal pin)",
          "wire_color": "White",
          "wire_gauge": "26 AWG",
          "voltage": "3.3 V signal",
          "current": "< 5 mA",
          "notes": "Same as SIG-001 — signal wire only."
        },
        {
          "id": "SIG-004",
          "label": "ESC 4 PWM → Pixhawk MAIN OUT 4",
          "from_component": "ESC 4 (Rear Right)",
          "from_pin": "Signal wire (White)",
          "to_component": "Pixhawk 6C",
          "to_pin": "MAIN OUT 4 (Signal pin)",
          "wire_color": "White",
          "wire_gauge": "26 AWG",
          "voltage": "3.3 V signal",
          "current": "< 5 mA",
          "notes": "Same as SIG-001 — signal wire only."
        },
        {
          "id": "SIG-005",
          "label": "Pixhawk TELEM2 → ESP32 UART",
          "from_component": "Pixhawk 6C",
          "from_pin": "TELEM2 TX (JST-GH pin 3)",
          "to_component": "ESP32-S3 DevKitC",
          "to_pin": "GPIO17 (U1RXD)",
          "wire_color": "Yellow",
          "wire_gauge": "24 AWG",
          "voltage": "3.3 V",
          "current": "< 20 mA",
          "notes": "MAVLink 2.0 UART at 57,600 baud. TX on Pixhawk → RX on ESP32. Note: Pixhawk TELEM2 runs at 3.3 V — compatible with ESP32 directly."
        },
        {
          "id": "SIG-006",
          "label": "ESP32 UART → Pixhawk TELEM2",
          "from_component": "ESP32-S3 DevKitC",
          "from_pin": "GPIO16 (U1TXD)",
          "to_component": "Pixhawk 6C",
          "to_pin": "TELEM2 RX (JST-GH pin 2)",
          "wire_color": "Green",
          "wire_gauge": "24 AWG",
          "voltage": "3.3 V",
          "current": "< 20 mA",
          "notes": "Return channel ESP32 → Pixhawk. Used for companion computer commands (e.g. mode switches, mission uploads)."
        },
        {
          "id": "SIG-007",
          "label": "Pixhawk GPS1 → u-blox M9N",
          "from_component": "Pixhawk 6C",
          "from_pin": "GPS1 Port (JST-GH 10-pin)",
          "to_component": "u-blox M9N GPS + Compass",
          "to_pin": "JST-GH 10-pin connector",
          "wire_color": "Multi-colour ribbon",
          "wire_gauge": "26 AWG",
          "voltage": "5 V (supply) + 3.3 V (signal)",
          "current": "50 mA",
          "notes": "Plug-and-play cable included with M9N. Mount GPS module on top mast with clear sky view — minimum 5 cm above carbon arms."
        },
        {
          "id": "SIG-008",
          "label": "Pixhawk I2C → BMP280",
          "from_component": "Pixhawk 6C",
          "from_pin": "I2C2 Bus (SDA + SCL)",
          "to_component": "BMP280 Barometer Module",
          "to_pin": "SDA / SCL pins",
          "wire_color": "Blue (SDA) / Orange (SCL)",
          "wire_gauge": "26 AWG",
          "voltage": "3.3 V",
          "current": "2.7 µA",
          "notes": "External barometer provides redundant altitude. Mount inside foam-padded cavity in enclosure to shield from rotor downwash."
        },
        {
          "id": "SIG-009",
          "label": "HC-SR04 → ESP32 (obstacle sensor)",
          "from_component": "HC-SR04 Ultrasonic Sensor",
          "from_pin": "TRIG / ECHO",
          "to_component": "ESP32-S3 DevKitC",
          "to_pin": "GPIO5 (TRIG) / GPIO18 (ECHO via divider)",
          "wire_color": "Yellow (TRIG) / Green (ECHO)",
          "wire_gauge": "24 AWG",
          "voltage": "5 V supply; ECHO output needs 5 V→3.3 V divider (1k + 2k resistors)",
          "current": "15 mA",
          "notes": "⚠️ ECHO pin is 5 V logic — must use voltage divider before ESP32 GPIO (3.3 V max). Burn-in risk if skipped."
        },
        {
          "id": "SIG-010",
          "label": "RPi Camera → ESP32 MIPI-CSI",
          "from_component": "Raspberry Pi Camera Module 3",
          "from_pin": "15-pin MIPI-CSI FPC",
          "to_component": "ESP32-S3 DevKitC",
          "to_pin": "MIPI-CSI2 interface (J3 on DevKit)",
          "wire_color": "FPC ribbon (15-pin, 15 cm)",
          "wire_gauge": "FPC",
          "voltage": "3.3 V (supply via DevKit)",
          "current": "200 mA",
          "notes": "Use 15 cm FPC for clean routing. Lock FPC latch firmly — a loose connection causes intermittent video drop. Mount camera on forward-facing nacelle."
        }
      ],
      "assemblyOrder": [
        "1. Solder motor leads to ESCs — tin wires first, short joints.",
        "2. Solder ESC power leads to PDB pads — red to +, black to −.",
        "3. Connect XT60 from Power Module to PDB input.",
        "4. Run 5 V BEC cable from PDB to Pixhawk POWER1.",
        "5. Plug GPS cable into Pixhawk GPS1 port.",
        "6. Wire ESC signal lines to Pixhawk MAIN OUT 1–4.",
        "7. Connect TELEM2 UART cables between Pixhawk and ESP32.",
        "8. Connect HC-SR04 to ESP32 (with voltage divider on ECHO).",
        "9. Attach RPi Camera FPC to ESP32 MIPI connector.",
        "10. Final: connect battery last — always the final step before power-on."
      ],
      "safetyWarnings": [
        "⚠️  ALWAYS connect battery LAST — after all wiring is complete and inspected.",
        "⚠️  NEVER power on with propellers installed during bench testing.",
        "⚠️  The HC-SR04 ECHO pin is 5 V — do not connect directly to ESP32 3.3 V GPIO.",
        "⚠️  Verify ESC motor rotation BEFORE fitting propellers using BLHeli Suite.",
        "⚠️  Use heat shrink on every solder joint — exposed copper near the battery is a short-circuit risk."
      ],
      "ai_images": {
        "status": "completed",
        "breadboard": {
          "url": "https://placehold.co/800x600/1e1e1e/0071e3?text=Pixhawk+6C+%E2%86%94+ESP32+Wiring",
          "prompt": "Fritzing-style breadboard wiring diagram: Pixhawk 6C connected to ESP32-S3 via UART, HC-SR04 with voltage divider, RPi Camera Module 3",
          "generated_at": "2026-06-21T14:16:33Z"
        },
        "schematic": {
          "url": "https://placehold.co/800x600/1e1e1e/00cc44?text=Power+Distribution+Schematic",
          "prompt": "Clean electrical schematic: 4S LiPo to Power Module to PDB, 4x ESCs, 5V BEC to Pixhawk",
          "generated_at": "2026-06-21T14:16:45Z"
        }
      }
    }$WRG$::jsonb;

    -- ================================================================
    -- 9. CONTENT: Code JSON
    -- ================================================================
    v_code_json := $CODE${
      "projectName": "Farm Patrol Drone — ESP32-S3 Companion Firmware",
      "framework": "Arduino / PlatformIO",
      "targetBoard": "esp32-s3-devkitc-1",
      "sdkVersion": "ESP-IDF 5.2",
      "mavlinkVersion": "2.0",
      "files": [
        {
          "path": "platformio.ini",
          "language": "ini",
          "description": "PlatformIO project configuration",
          "content": "[env:farm_drone_esp32s3]\nplatform = espressif32\nboard = esp32-s3-devkitc-1\nframework = arduino\nboard_build.arduino.memory_type = qio_opi\n\nlib_deps =\n    mavlink/MAVLink@^2.0.0\n    esp32-camera@^2.0.0\n    ArduinoJson@^7.0.0\n    ArduinoOTA\n\nbuild_flags =\n    -DBOARD_HAS_PSRAM\n    -mfix-esp32-psram-cache-issue\n    -DCONFIG_SPIRAM_SUPPORT=1\n    -DCORE_DEBUG_LEVEL=3\n\nmonitor_speed = 115200\nmonitor_filters = esp32_exception_decoder\nupload_speed = 921600\n\n[env]\ncheck_tool = clangtidy\ncheck_flags = clangtidy: --checks=-*,clang-analyzer-*"
        },
        {
          "path": "include/config.h",
          "language": "cpp",
          "description": "Central configuration — edit before flashing",
          "content": "#pragma once\n\n// ─── Wi-Fi Access Point ───────────────────────────────────────────\n#define WIFI_SSID       \"FarmPatrol-Drone\"\n#define WIFI_PASS       \"FarmSecure2026\"\n#define WIFI_CHANNEL    6\n#define WIFI_MAX_CLIENTS 4\n\n// ─── Camera ───────────────────────────────────────────────────────\n#define CAMERA_FRAME_SIZE FRAMESIZE_FHD   // 1920×1080\n#define CAMERA_QUALITY    12              // 0–63 (lower = better quality)\n#define CAMERA_FPS        30\n\n// ─── MAVLink UART (Pixhawk TELEM2) ───────────────────────────────\n#define PIX_UART_PORT   Serial2\n#define PIX_BAUD        57600\n#define PIX_TX_PIN      17\n#define PIX_RX_PIN      16\n\n// ─── Obstacle Sensor (HC-SR04) ────────────────────────────────────\n#define US_TRIG_PIN     5\n#define US_ECHO_PIN     18\n#define OBSTACLE_HALT_CM 200   // Halt if object within 2 m\n#define OBSTACLE_WARN_CM 300   // Warn at 3 m\n\n// ─── LED Status Indicator ─────────────────────────────────────────\n#define STATUS_LED_PIN  2\n\n// ─── Battery Thresholds ───────────────────────────────────────────\n#define BATT_WARN_PCT   30\n#define BATT_RTH_PCT    20\n\n// ─── System ───────────────────────────────────────────────────────\n#define HEARTBEAT_INTERVAL_MS  1000\n#define TELEMETRY_INTERVAL_MS  100\n#define SENSOR_INTERVAL_MS     50"
        },
        {
          "path": "src/main.cpp",
          "language": "cpp",
          "description": "Main application entry point — setup and loop",
          "content": "// ╔══════════════════════════════════════════════════════════════════╗\n// ║  Farm Patrol Drone — ESP32-S3 Companion Computer               ║\n// ║  Responsibilities:                                              ║\n// ║    • MJPEG live video streaming over Wi-Fi AP                  ║\n// ║    • MAVLink 2.0 bridge to/from Pixhawk 6C                     ║\n// ║    • HC-SR04 obstacle detection with Pixhawk halt command       ║\n// ║    • WebSocket telemetry to mobile app (10 Hz)                  ║\n// ║    • OTA firmware updates                                       ║\n// ╚══════════════════════════════════════════════════════════════════╝\n\n#include <Arduino.h>\n#include <WiFi.h>\n#include <ArduinoOTA.h>\n#include \"config.h\"\n#include \"camera_stream.h\"\n#include \"mavlink_handler.h\"\n#include \"obstacle_sensor.h\"\n#include \"telemetry_server.h\"\n#include \"status_led.h\"\n\n// ─── Global Singletons ─────────────────────────────────────────────\nCameraStream      camStream;\nMAVLinkHandler    mavlink;\nObstacleSensor    obstacle(US_TRIG_PIN, US_ECHO_PIN);\nTelemetryServer   telemetry;\nStatusLED         led(STATUS_LED_PIN);\n\n// ─── Timing ────────────────────────────────────────────────────────\nuint32_t lastHeartbeat  = 0;\nuint32_t lastSensorRead = 0;\nuint32_t lastTelemetry  = 0;\n\nvoid setup() {\n    Serial.begin(115200);\n    delay(500);\n    Serial.println(\"\\n╔══════════════════════════════╗\");\n    Serial.println(  \"║  Farm Patrol Drone v1.0      ║\");\n    Serial.println(  \"║  ESP32-S3 Companion Boot     ║\");\n    Serial.println(  \"╚══════════════════════════════╝\\n\");\n\n    // ── 1. MAVLink UART ──────────────────────────────────────────\n    PIX_UART_PORT.begin(PIX_BAUD, SERIAL_8N1, PIX_RX_PIN, PIX_TX_PIN);\n    mavlink.init(&PIX_UART_PORT);\n    Serial.println(\"[OK] MAVLink UART initialised at \" + String(PIX_BAUD) + \" baud\");\n\n    // ── 2. Wi-Fi Access Point ────────────────────────────────────\n    WiFi.softAP(WIFI_SSID, WIFI_PASS, WIFI_CHANNEL, 0, WIFI_MAX_CLIENTS);\n    Serial.println(\"[OK] Wi-Fi AP: \" + String(WIFI_SSID));\n    Serial.println(\"     IP: \" + WiFi.softAPIP().toString());\n\n    // ── 3. Camera ────────────────────────────────────────────────\n    if (!camStream.init()) {\n        Serial.println(\"[ERR] Camera init failed! Check FPC cable.\");\n        led.blink(500); // Fast blink = camera error\n    } else {\n        Serial.println(\"[OK] Camera ready — \" + camStream.getResolutionStr());\n    }\n\n    // ── 4. Telemetry WebSocket Server ────────────────────────────\n    telemetry.begin(81);\n    Serial.println(\"[OK] Telemetry WS on ws://\" + WiFi.softAPIP().toString() + \":81\");\n\n    // ── 5. Camera HTTP Stream ────────────────────────────────────\n    camStream.startServer(80);\n    Serial.println(\"[OK] Video stream at http://\" + WiFi.softAPIP().toString() + \"/stream\");\n\n    // ── 6. OTA Updates ───────────────────────────────────────────\n    ArduinoOTA.setHostname(\"farm-drone-esp32\");\n    ArduinoOTA.begin();\n    Serial.println(\"[OK] OTA enabled — hostname: farm-drone-esp32\");\n\n    // ── 7. Status LED ────────────────────────────────────────────\n    led.setMode(StatusLED::IDLE);\n    Serial.println(\"\\n[READY] All systems nominal. Waiting for Pixhawk...\");\n}\n\nvoid loop() {\n    uint32_t now = millis();\n\n    // ── Process MAVLink messages from Pixhawk ─────────────────────\n    mavlink.update();\n\n    // ── Send heartbeat to Pixhawk ────────────────────────────────\n    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {\n        mavlink.sendHeartbeat();\n        lastHeartbeat = now;\n    }\n\n    // ── Read obstacle sensor and halt if triggered ────────────────\n    if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {\n        float dist_cm = obstacle.readCm();\n        if (dist_cm > 0 && dist_cm < OBSTACLE_HALT_CM) {\n            mavlink.sendHaltCommand();\n            telemetry.sendObstacleAlert(dist_cm);\n            led.setMode(StatusLED::OBSTACLE);\n        } else {\n            led.setMode(mavlink.isArmed() ? StatusLED::FLYING : StatusLED::IDLE);\n        }\n        lastSensorRead = now;\n    }\n\n    // ── Broadcast telemetry to mobile app ─────────────────────────\n    if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {\n        telemetry.broadcast(mavlink.getState());\n        lastTelemetry = now;\n    }\n\n    // ── Handle camera client requests ─────────────────────────────\n    camStream.handleClients();\n\n    // ── Handle OTA ───────────────────────────────────────────────\n    ArduinoOTA.handle();\n}"
        },
        {
          "path": "src/mavlink_handler.cpp",
          "language": "cpp",
          "description": "MAVLink 2.0 parser and command sender",
          "content": "#include \"mavlink_handler.h\"\n#include <mavlink.h>\n#include \"config.h\"\n\nvoid MAVLinkHandler::init(HardwareSerial* serial) {\n    _serial = serial;\n    _sysId = 255;         // GCS system ID\n    _compId = MAV_COMP_ID_ONBOARD_COMPUTER;\n    _targetSysId  = 1;    // Pixhawk system ID\n    _targetCompId = 1;    // Pixhawk autopilot component\n    Serial.println(\"[MAVLink] Handler initialised\");\n}\n\nvoid MAVLinkHandler::update() {\n    mavlink_message_t msg;\n    mavlink_status_t  status;\n\n    while (_serial->available()) {\n        uint8_t c = _serial->read();\n        if (mavlink_parse_char(MAVLINK_COMM_0, c, &msg, &status)) {\n            _handleMessage(&msg);\n        }\n    }\n}\n\nvoid MAVLinkHandler::_handleMessage(mavlink_message_t* msg) {\n    switch (msg->msgid) {\n\n        case MAVLINK_MSG_ID_HEARTBEAT: {\n            mavlink_heartbeat_t hb;\n            mavlink_msg_heartbeat_decode(msg, &hb);\n            _lastHeartbeatMs = millis();\n            _armed   = hb.base_mode & MAV_MODE_FLAG_SAFETY_ARMED;\n            _mode    = hb.custom_mode;\n            _status  = hb.system_status;\n            break;\n        }\n\n        case MAVLINK_MSG_ID_SYS_STATUS: {\n            mavlink_sys_status_t sys;\n            mavlink_msg_sys_status_decode(msg, &sys);\n            _battVoltage = sys.voltage_battery / 1000.0f;\n            _battPercent = sys.battery_remaining;\n            if (_battPercent <= BATT_RTH_PCT) {\n                Serial.printf(\"[BATT] CRITICAL %d%% — RTH should trigger\\n\", _battPercent);\n            } else if (_battPercent <= BATT_WARN_PCT) {\n                Serial.printf(\"[BATT] WARNING %d%%\\n\", _battPercent);\n            }\n            break;\n        }\n\n        case MAVLINK_MSG_ID_GPS_RAW_INT: {\n            mavlink_gps_raw_int_t gps;\n            mavlink_msg_gps_raw_int_decode(msg, &gps);\n            _latitude   = gps.lat / 1e7;\n            _longitude  = gps.lon / 1e7;\n            _altitude_m = gps.alt / 1000.0f;\n            _satellites = gps.satellites_visible;\n            _gpsFix     = gps.fix_type;\n            break;\n        }\n\n        case MAVLINK_MSG_ID_ATTITUDE: {\n            mavlink_attitude_t att;\n            mavlink_msg_attitude_decode(msg, &att);\n            _roll_deg  = att.roll  * RAD_TO_DEG;\n            _pitch_deg = att.pitch * RAD_TO_DEG;\n            _yaw_deg   = att.yaw   * RAD_TO_DEG;\n            break;\n        }\n\n        case MAVLINK_MSG_ID_VFR_HUD: {\n            mavlink_vfr_hud_t hud;\n            mavlink_msg_vfr_hud_decode(msg, &hud);\n            _airspeed_ms  = hud.airspeed;\n            _groundspeed_ms = hud.groundspeed;\n            _heading_deg  = hud.heading;\n            _throttlePct  = hud.throttle;\n            _climbRate_ms = hud.climb;\n            break;\n        }\n    }\n}\n\nvoid MAVLinkHandler::sendHeartbeat() {\n    mavlink_message_t msg;\n    uint8_t buf[MAVLINK_MAX_PACKET_LEN];\n    mavlink_msg_heartbeat_pack(\n        _sysId, _compId, &msg,\n        MAV_TYPE_ONBOARD_CONTROLLER,\n        MAV_AUTOPILOT_INVALID,\n        0, 0,\n        MAV_STATE_ACTIVE\n    );\n    uint16_t len = mavlink_msg_to_send_buffer(buf, &msg);\n    _serial->write(buf, len);\n}\n\nvoid MAVLinkHandler::sendHaltCommand() {\n    // Send SET_MODE to BRAKE (ArduCopter mode 17)\n    mavlink_message_t msg;\n    uint8_t buf[MAVLINK_MAX_PACKET_LEN];\n    mavlink_msg_set_mode_pack(\n        _sysId, _compId, &msg,\n        _targetSysId,\n        MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,\n        17 // BRAKE mode in ArduCopter\n    );\n    uint16_t len = mavlink_msg_to_send_buffer(buf, &msg);\n    _serial->write(buf, len);\n    Serial.println(\"[MAVLink] BRAKE mode sent — obstacle halt\");\n}"
        },
        {
          "path": "src/obstacle_sensor.cpp",
          "language": "cpp",
          "description": "HC-SR04 ultrasonic obstacle detection",
          "content": "#include \"obstacle_sensor.h\"\n#include <Arduino.h>\n\nObstacleSensor::ObstacleSensor(uint8_t trigPin, uint8_t echoPin)\n    : _trig(trigPin), _echo(echoPin) {\n    pinMode(_trig, OUTPUT);\n    pinMode(_echo, INPUT);\n    digitalWrite(_trig, LOW);\n}\n\nfloat ObstacleSensor::readCm() {\n    // Send 10 µs trigger pulse\n    digitalWrite(_trig, LOW);\n    delayMicroseconds(2);\n    digitalWrite(_trig, HIGH);\n    delayMicroseconds(10);\n    digitalWrite(_trig, LOW);\n\n    // Measure echo pulse width (timeout = 25 ms → 430 cm max)\n    long duration = pulseIn(_echo, HIGH, 25000UL);\n    if (duration == 0) return -1.0f; // No echo / out of range\n\n    float distance_cm = (duration * 0.0343f) / 2.0f;\n\n    // Reject obviously bad readings\n    if (distance_cm < 2.0f || distance_cm > 400.0f) return -1.0f;\n\n    // Exponential moving average for stability\n    _filtered = (_filtered * 0.8f) + (distance_cm * 0.2f);\n    return _filtered;\n}\n\nbool ObstacleSensor::isBlocked() {\n    float d = readCm();\n    return (d > 0 && d < _haltThresholdCm);\n}"
        },
        {
          "path": "src/telemetry_server.cpp",
          "language": "cpp",
          "description": "WebSocket server — broadcasts JSON telemetry at 10 Hz to the mobile app",
          "content": "#include \"telemetry_server.h\"\n#include <ArduinoJson.h>\n\nvoid TelemetryServer::begin(uint16_t port) {\n    _ws = new AsyncWebServer(port);\n    _wsHandler = new AsyncWebSocket(\"/\");\n    _ws->addHandler(_wsHandler);\n    _ws->begin();\n    Serial.println(\"[WS] Telemetry server on port \" + String(port));\n}\n\nvoid TelemetryServer::broadcast(const DroneState& state) {\n    if (_wsHandler->count() == 0) return;\n\n    JsonDocument doc;\n    doc[\"t\"]          = millis();\n    doc[\"armed\"]      = state.armed;\n    doc[\"mode\"]       = state.modeName;\n    doc[\"batt_v\"]     = serialized(String(state.battVoltage, 2));\n    doc[\"batt_pct\"]   = state.battPercent;\n    doc[\"lat\"]        = serialized(String(state.latitude, 7));\n    doc[\"lon\"]        = serialized(String(state.longitude, 7));\n    doc[\"alt_m\"]      = serialized(String(state.altitude_m, 1));\n    doc[\"sats\"]       = state.satellites;\n    doc[\"gps_fix\"]    = state.gpsFix;\n    doc[\"roll\"]       = serialized(String(state.roll_deg, 1));\n    doc[\"pitch\"]      = serialized(String(state.pitch_deg, 1));\n    doc[\"yaw\"]        = serialized(String(state.yaw_deg, 1));\n    doc[\"spd_ms\"]     = serialized(String(state.groundspeed_ms, 1));\n    doc[\"hdg\"]        = state.heading_deg;\n    doc[\"throttle\"]   = state.throttlePct;\n    doc[\"climb_ms\"]   = serialized(String(state.climbRate_ms, 2));\n\n    String output;\n    serializeJson(doc, output);\n    _wsHandler->textAll(output);\n}\n\nvoid TelemetryServer::sendObstacleAlert(float distanceCm) {\n    if (_wsHandler->count() == 0) return;\n\n    JsonDocument doc;\n    doc[\"alert\"]    = \"OBSTACLE_DETECTED\";\n    doc[\"dist_cm\"]  = serialized(String(distanceCm, 1));\n    doc[\"action\"]   = \"BRAKE\";\n    doc[\"t\"]        = millis();\n\n    String output;\n    serializeJson(doc, output);\n    _wsHandler->textAll(output);\n}"
        }
      ],
      "buildInstructions": [
        "1. Install PlatformIO in VS Code (https://platformio.org/install/ide?install=vscode).",
        "2. Clone this project and open in VS Code — PlatformIO auto-detects platformio.ini.",
        "3. Edit include/config.h — set your Wi-Fi SSID and password.",
        "4. Connect ESP32-S3 DevKitC via USB-C.",
        "5. Run: pio run --target upload",
        "6. Open serial monitor: pio device monitor -b 115200",
        "7. After successful boot, connect laptop to 'FarmPatrol-Drone' Wi-Fi network.",
        "8. Open browser to http://192.168.4.1/stream to verify video.",
        "9. Open QGroundControl, set MAV_SYS_ID=1 on Pixhawk, verify telemetry link."
      ],
      "flashingNotes": "Hold BOOT button on ESP32-S3 DevKitC while connecting USB if upload fails. Release after connection is established."
    }$CODE$::jsonb;

    -- ================================================================
    -- 10. CONTENT: 3D Enclosure JSON (with 5 detailed OpenSCAD models)
    -- ================================================================
    v_enclosure_json := $ENC${
      "projectName": "Farm Patrol Drone — 3D-Printed Enclosures & Mounts",
      "printRecommendations": {
        "material": "PETG (preferred) or ABS. Do NOT use PLA — softens at 60 °C in direct Indian summer sun.",
        "layerHeight": "0.2 mm for functional parts; 0.15 mm for snap-fit features",
        "infill": "30–40 % Gyroid for impact resistance",
        "walls": "4 perimeter lines (≥ 1.6 mm) for weather resistance",
        "supports": "Tree supports only — touching build plate",
        "bed": "75 °C for PETG; 90 °C for ABS",
        "colourRecommendation": "Orange or yellow for field visibility"
      },
      "files": [
        {
          "path": "models/pixhawk_case.scad",
          "language": "openscad",
          "description": "Pixhawk 6C protective case with vibration-isolating mounting flanges, connector access ports, and lid snap-fit",
          "printTime_hr": 3.5,
          "material_g": 45,
          "content": "// ══════════════════════════════════════════════════════════\n// Pixhawk 6C Protective Enclosure with Snap-Fit Lid\n// Print in PETG, 0.2 mm layers, 35 % Gyroid infill\n// ══════════════════════════════════════════════════════════\n\n// PCB dimensions (Pixhawk 6C)\npcb_l = 84;     // mm\npcb_w = 44;     // mm\npcb_h = 20;     // mm (including connectors on top)\n\n// Clearance and walls\nclearance   = 1.5;\nwall        = 2.5;\nboss_h      = 3;    // standoff height below PCB\nmount_hole  = 3.5;  // M3 clearance hole\nlid_lip     = 1.5;  // snap-fit lip depth\n\n// Derived outer dimensions\nouter_l = pcb_l + 2*wall + 2*clearance;\nouter_w = pcb_w + 2*wall + 2*clearance;\nouter_h = pcb_h + boss_h + wall + clearance;\n\n$fn = 36;\n\nmodule rounded_box(l, w, h, r) {\n    hull() {\n        for (x = [r, l-r]) for (y = [r, w-r])\n            translate([x, y, 0]) cylinder(r=r, h=h);\n    }\n}\n\nmodule m3_boss() {\n    // Threaded insert boss — 5.5 mm OD, 3.5 mm bore\n    difference() {\n        cylinder(r=4, h=boss_h);\n        cylinder(r=1.75, h=boss_h+1);\n    }\n}\n\nmodule pixhawk_base() {\n    difference() {\n        // Outer shell\n        rounded_box(outer_l, outer_w, outer_h - lid_lip, 4);\n\n        // Interior cavity\n        translate([wall, wall, wall + boss_h])\n            rounded_box(pcb_l + 2*clearance, pcb_w + 2*clearance,\n                        pcb_h + clearance + 1, 3);\n\n        // USB-C access port (right side)\n        translate([outer_l - wall - 0.5, outer_w/2 - 5, wall + boss_h + 2])\n            cube([wall + 1, 10, 6]);\n\n        // TELEM1/2 port cutout (left side)\n        translate([-0.5, outer_w/2 - 14, wall + boss_h + 2])\n            cube([wall + 1, 28, 8]);\n\n        // GPS/I2C port cutout (rear)\n        translate([outer_l/2 - 8, -0.5, wall + boss_h + 2])\n            cube([16, wall + 1, 8]);\n\n        // Power module port cutout (front)\n        translate([outer_l/2 - 6, outer_w - wall - 0.5, wall + boss_h + 2])\n            cube([12, wall + 1, 6]);\n\n        // Ventilation slots (bottom)\n        for (i = [0:4])\n            translate([10 + i*14, outer_w/2 - 8, -0.5])\n                cube([6, 16, wall + 1]);\n\n        // M3 mounting holes in flanges\n        for (x = [8, outer_l - 8]) for (y = [8, outer_w - 8])\n            translate([x, y, -0.5]) cylinder(r=mount_hole/2, h=wall+1);\n    }\n\n    // PCB standoff bosses\n    for (x = [wall + clearance + 3.5, wall + clearance + pcb_l - 3.5])\n        for (y = [wall + clearance + 3.5, wall + clearance + pcb_w - 3.5])\n            translate([x, y, wall]) m3_boss();\n\n    // Snap-fit rails on interior lip\n    translate([wall - 0.5, wall - 0.5, outer_h - lid_lip*2])\n        cube([0.5, outer_w - wall, lid_lip]);\n    translate([outer_l - wall, wall - 0.5, outer_h - lid_lip*2])\n        cube([0.5, outer_w - wall, lid_lip]);\n}\n\nmodule pixhawk_lid() {\n    difference() {\n        rounded_box(outer_l, outer_w, wall + lid_lip, 4);\n        // Label recess\n        translate([outer_l/2 - 20, outer_w/2 - 6, -0.5])\n            cube([40, 12, 1]);\n    }\n    // Snap-fit tongues\n    translate([wall, wall, wall])\n        cube([1, outer_w - 2*wall, lid_lip]);\n    translate([outer_l - wall - 1, wall, wall])\n        cube([1, outer_w - 2*wall, lid_lip]);\n}\n\n// Render both parts\npixhawk_base();\ntranslate([0, outer_w + 10, 0]) pixhawk_lid();"
        },
        {
          "path": "models/esp32_camera_nacelle.scad",
          "language": "openscad",
          "description": "ESP32-S3 + RPi Camera Module 3 combined housing with forward tilt, cable routing channel, and anti-vibration mounts",
          "printTime_hr": 2.0,
          "material_g": 28,
          "content": "// ══════════════════════════════════════════════════════════\n// ESP32-S3 + RPi Camera Module 3 Nacelle\n// Forward-facing camera with 10° downward tilt\n// Integrated FPC cable routing channel\n// ══════════════════════════════════════════════════════════\n\nesp_l = 27;   esp_w = 25;   esp_h = 10;\ncam_l = 25;   cam_w = 24;   cam_h = 11.5;\nwall  = 2.0;\ncam_tilt_deg = 10;  // degrees downward\nfpc_w = 5.5;        // FPC ribbon width\n\n$fn = 36;\n\nmodule rounded_box(l, w, h, r) {\n    hull() {\n        for (x = [r, l-r]) for (y = [r, w-r])\n            translate([x, y, 0]) cylinder(r=r, h=h);\n    }\n}\n\nmodule fpc_channel() {\n    // Slot for 15 cm FPC ribbon between camera and ESP32\n    translate([0, 0, 0])\n        cube([fpc_w + 1, 20, 2.5]);\n}\n\nmodule camera_cell() {\n    // Camera module pocket with front glass aperture\n    difference() {\n        rounded_box(cam_l + 2*wall, cam_w + 2*wall, cam_h + wall, 3);\n        // Camera cavity\n        translate([wall, wall, wall])\n            cube([cam_l, cam_w, cam_h + 1]);\n        // Lens aperture hole (8 mm diameter)\n        translate([cam_l/2 + wall, cam_w/2 + wall, -0.5])\n            cylinder(r=4, h=wall + 1);\n        // FPC exit slot at rear\n        translate([(cam_l + 2*wall)/2 - fpc_w/2, cam_w + wall - 1, wall/2])\n            cube([fpc_w, wall + 1, 3]);\n    }\n}\n\nmodule esp32_cell() {\n    // ESP32-S3 board pocket\n    difference() {\n        rounded_box(esp_l + 2*wall, esp_w + 2*wall, esp_h + wall, 3);\n        // PCB cavity\n        translate([wall, wall, wall])\n            cube([esp_l, esp_w, esp_h + 1]);\n        // USB-C access slot on end\n        translate([(esp_l + 2*wall)/2 - 5, esp_w + wall - 0.5, wall + 1])\n            cube([10, wall + 1, 5]);\n        // FPC entry slot at front\n        translate([(esp_l + 2*wall)/2 - fpc_w/2, -0.5, wall/2])\n            cube([fpc_w, wall + 1, 3]);\n        // M2 mounting holes\n        for (x = [3, esp_l + 2*wall - 3]) for (y = [3, esp_w + 2*wall - 3])\n            translate([x, y, -0.5]) cylinder(r=1.2, h=wall + 1);\n    }\n}\n\nmodule nacelle_assembly() {\n    // Camera section (tilted forward 10°)\n    rotate([cam_tilt_deg, 0, 0])\n        camera_cell();\n\n    // FPC channel bridge\n    translate([(cam_l + 2*wall)/2 - fpc_w/2, cam_w + 2*wall, 0])\n        fpc_channel();\n\n    // ESP32 section (behind camera)\n    translate([0, cam_w + 2*wall + 20, 0])\n        esp32_cell();\n\n    // Drone-mount tab (for frame arm attachment)\n    difference() {\n        translate([-2, (cam_w + esp_w)/2 + wall, -wall])\n            cube([esp_l + 2*wall + 4, 4, wall + 5]);\n        // M3 mount slot\n        translate([esp_l/2 + wall, (cam_w + esp_w)/2 + wall + 1, -wall - 0.5])\n            cylinder(r=1.75, h=wall + 7);\n    }\n}\n\nnacelle_assembly();"
        },
        {
          "path": "models/gps_mast_mount.scad",
          "language": "openscad",
          "description": "GPS mast mount for u-blox M9N — positions GPS 60 mm above frame to minimise magnetic interference from carbon arms and PDB",
          "printTime_hr": 1.0,
          "material_g": 12,
          "content": "// ══════════════════════════════════════════════════════════\n// GPS Mast Mount — u-blox M9N\n// Positions GPS 60 mm above frame top plate\n// Twist-lock base fits F450 centre plate M3 standoffs\n// ══════════════════════════════════════════════════════════\n\nmast_h        = 60;  // elevation above frame\nmast_od       = 12;\nmast_id       = 8;\ngps_od        = 36;  // M9N module diameter\ngps_h         = 8;\nbase_d        = 40;\nbase_h        = 8;\nbase_slot_w   = 33;  // F450 standoff spacing\n\n$fn = 48;\n\nmodule mast() {\n    difference() {\n        cylinder(r=mast_od/2, h=mast_h);\n        // Hollow core for cable routing\n        cylinder(r=mast_id/2, h=mast_h + 1);\n        // JST-GH cable exit slot at base\n        translate([-3, -mast_od/2 - 0.5, 5])\n            cube([6, mast_od + 1, 8]);\n    }\n}\n\nmodule gps_head() {\n    // Circular top plate for M9N module\n    difference() {\n        union() {\n            cylinder(r=gps_od/2 + 2, h=gps_h);\n            // Raised rim to retain module\n            cylinder(r=gps_od/2, h=gps_h + 2);\n        }\n        // Module cavity\n        translate([0, 0, 3])\n            cylinder(r=gps_od/2 - 0.5, h=gps_h);\n        // Cable pass-through to mast\n        cylinder(r=mast_id/2, h=gps_h + 3);\n        // Two M2 retention screws\n        for (a = [45, 225])\n            rotate([0, 0, a])\n                translate([gps_od/2 - 2, 0, -0.5])\n                    cylinder(r=1.2, h=gps_h + 4);\n    }\n}\n\nmodule base_plate() {\n    // Square base with 30.5 mm F450 bolt pattern\n    difference() {\n        union() {\n            cylinder(r=base_d/2, h=base_h);\n            // Stiffening ribs\n            for (a = [0, 90])\n                rotate([0, 0, a])\n                    cube([base_d, 3, base_h], center=true);\n        }\n        // M3 clearance holes on 30.5 mm pattern\n        for (x = [-15.25, 15.25]) for (y = [-15.25, 15.25])\n            translate([x, y, -0.5]) cylinder(r=1.75, h=base_h + 1);\n        // M3 countersink\n        for (x = [-15.25, 15.25]) for (y = [-15.25, 15.25])\n            translate([x, y, base_h - 2]) cylinder(r1=1.75, r2=3.5, h=2.5);\n        // Cable pass-through to mast core\n        cylinder(r=mast_id/2, h=base_h + 1);\n    }\n}\n\n// Full assembly\nbase_plate();\ntranslate([0, 0, base_h]) mast();\ntranslate([0, 0, base_h + mast_h]) gps_head();"
        },
        {
          "path": "models/landing_leg_set.scad",
          "language": "openscad",
          "description": "Set of 4 landing legs with shock-absorbing flex node — reduces landing impact on camera and electronics. Parametric height adjustment.",
          "printTime_hr": 2.5,
          "material_g": 35,
          "content": "// ══════════════════════════════════════════════════════════\n// Shock-Absorbing Landing Legs (×4 set)\n// Flex node at ankle dissipates landing energy\n// Print 4 copies. Material: PETG for flex node stiffness.\n// ══════════════════════════════════════════════════════════\n\nleg_h         = 80;  // total leg height\nleg_od        = 10;\nleg_id        = 6;   // hollow for weight reduction\nflex_w        = 4;   // flex node width (thinner = more flex)\nflex_h        = 12;  // flex node height\nfoot_r        = 18;  // foot pad radius\nfoot_h        = 5;\narm_w         = 16;  // frame arm clamp width\narm_clamp_h   = 20;\nbolt_d        = 3.5; // M3 clamp bolt\n\n$fn = 32;\n\nmodule flex_node() {\n    // Slim cross-section ankle joint — acts as leaf spring\n    hull() {\n        translate([-flex_w/2, -leg_od/2, 0])  cube([flex_w, leg_od, 1]);\n        translate([-leg_od/2, -leg_od/2, flex_h]) cube([leg_od, leg_od, 1]);\n    }\n}\n\nmodule foot_pad() {\n    // Rubberised-profile foot for grip on soft soil\n    difference() {\n        union() {\n            cylinder(r=foot_r, h=foot_h);\n            // Central boss for leg attachment\n            cylinder(r=leg_od/2 + 1, h=foot_h + 4);\n        }\n        // Tread grooves for grip\n        for (a = [0:30:150])\n            rotate([0, 0, a])\n                translate([-foot_r, -1, -0.5])\n                    cube([foot_r*2, 2, 3]);\n        // Hollow leg socket\n        cylinder(r=leg_od/2, h=foot_h + 5);\n    }\n}\n\nmodule upper_leg() {\n    // Hollow tube from ankle to arm clamp\n    difference() {\n        cylinder(r=leg_od/2, h=leg_h - flex_h - foot_h);\n        cylinder(r=leg_id/2, h=leg_h);\n    }\n}\n\nmodule arm_clamp() {\n    // Saddle clamp — wraps around F450 arm tube (16 mm OD)\n    clamp_r = arm_w/2 + 1;\n    difference() {\n        union() {\n            // Clamp body\n            translate([-clamp_r, -clamp_r, 0])\n                cube([clamp_r*2, clamp_r + 8, arm_clamp_h]);\n            // Flange for leg tube\n            cylinder(r=leg_od/2 + 2, h=arm_clamp_h);\n        }\n        // Arm groove\n        translate([0, 0, arm_clamp_h/2])\n            rotate([90, 0, 0])\n                cylinder(r=arm_w/2, h=clamp_r*2 + 10, center=true);\n        // M3 bolt holes (×2) for clamp tightening\n        for (y = [2, arm_clamp_h - 6])\n            translate([-clamp_r - 0.5, 2, y])\n                rotate([0, 90, 0]) cylinder(r=bolt_d/2, h=clamp_r*2 + 1);\n        // Leg socket through centre\n        cylinder(r=leg_od/2 - 0.5, h=arm_clamp_h + 1);\n    }\n}\n\n// Single leg assembly\nmodule landing_leg() {\n    // Bottom to top: foot → flex node → upper leg → arm clamp\n    foot_pad();\n    translate([0, 0, foot_h + 2]) flex_node();\n    translate([0, 0, foot_h + flex_h + 2]) upper_leg();\n    translate([0, 0, leg_h - arm_clamp_h + 2]) arm_clamp();\n}\n\n// Print all 4 legs spaced on build plate\nfor (i = [0:3])\n    translate([i * 45, 0, 0]) landing_leg();"
        },
        {
          "path": "models/battery_tray.scad",
          "language": "openscad",
          "description": "Battery tray with Tattu 5000 mAh 4S profile recess, Velcro strap slots, and XT60 cable management. Mounts to F450 bottom plate.",
          "printTime_hr": 2.0,
          "material_g": 30,
          "content": "// ══════════════════════════════════════════════════════════\n// Battery Tray — Tattu 4S 5000 mAh (158 × 46 × 42 mm)\n// Features:\n//   - Exact-fit recess keeps battery from sliding\n//   - 25 mm Velcro strap slots (×2)\n//   - XT60 cable guide to keep plug accessible\n//   - Mounts to F450 bottom plate via 30.5 mm bolt pattern\n// ══════════════════════════════════════════════════════════\n\n// Tattu 4S 5000 mAh dimensions + clearance\nbatt_l  = 158 + 2;  // 160\nbatt_w  =  46 + 2;  //  48\nbatt_h  =  42 + 2;  //  44\n\nwall        = 2.5;\nstrap_w     = 27;   // Velcro strap slot width\nstrap_h     = 6;    // Velcro strap slot height\nxt60_w      = 16;   // XT60 plug clearance\nxt60_h      = 14;\nmount_pitch = 30.5; // F450 bottom plate bolt pitch\n\n$fn = 32;\n\nmodule rounded_box(l, w, h, r) {\n    hull() {\n        for (x = [r, l-r]) for (y = [r, w-r])\n            translate([x, y, 0]) cylinder(r=r, h=h);\n    }\n}\n\nmodule battery_tray() {\n    outer_l = batt_l + 2*wall;\n    outer_w = batt_w + 2*wall;\n    outer_h = batt_h/2 + wall;  // Open top — battery slides in from above\n\n    difference() {\n        rounded_box(outer_l, outer_w, outer_h, 5);\n\n        // Battery recess cavity (open top)\n        translate([wall, wall, wall])\n            cube([batt_l, batt_w, batt_h + 1]);\n\n        // Velcro strap slots — front\n        translate([outer_l/2 - strap_w/2, -0.5, outer_h/2 - strap_h/2])\n            cube([strap_w, outer_w + 1, strap_h]);\n\n        // Velcro strap slots — rear\n        translate([outer_l/2 - strap_w/2, -0.5, outer_h - strap_h - 4])\n            cube([strap_w, outer_w + 1, strap_h]);\n\n        // XT60 cable guide on right end\n        translate([outer_l - wall - 0.5, outer_w/2 - xt60_w/2, wall])\n            cube([wall + 1, xt60_w, xt60_h]);\n\n        // Weight relief cutouts in base\n        for (i = [-1, 1])\n            translate([outer_l/2 + i*30, outer_w/2, -0.5])\n                cylinder(r=12, h=wall + 1);\n\n        // F450 mounting holes (30.5 mm pattern)\n        for (x = [outer_l/2 - mount_pitch/2, outer_l/2 + mount_pitch/2])\n            for (y = [outer_w/2 - mount_pitch/2, outer_w/2 + mount_pitch/2])\n                translate([x, y, -0.5]) cylinder(r=1.75, h=wall + 1);\n    }\n\n    // Low-profile side walls to retain battery laterally\n    translate([wall, wall, outer_h])\n        difference() {\n            cube([batt_l, batt_w, 8]);\n            translate([2, 2, -0.5]) cube([batt_l-4, batt_w-4, 9]);\n        }\n}\n\nbattery_tray();"
        }
      ]
    }$ENC$::jsonb;

    -- ================================================================
    -- 11. Clean up existing data for this chat / project
    -- ================================================================
    DELETE FROM artifacts  WHERE chat_id    = v_chat_id;
    DELETE FROM connections WHERE project_id = v_project_id;
    DELETE FROM parts       WHERE project_id = v_project_id;

    -- ================================================================
    -- 12. Insert Artifact Containers
    -- ================================================================
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata) VALUES
        (v_art_context_id,   v_chat_id, v_project_id, 'context',   'Technical Architecture',        1, '{}'::jsonb),
        (v_art_mvp_id,       v_chat_id, v_project_id, 'mvp',       'Farm Patrol Drone — MVP',       1, '{}'::jsonb),
        (v_art_prd_id,       v_chat_id, v_project_id, 'prd',       'Farm Patrol Drone — PRD v1.0',  1, '{}'::jsonb),
        (v_art_bom_id,       v_chat_id, v_project_id, 'bom',       'Complete BOM v1.2',             1, '{}'::jsonb),
        (v_art_budget_id,    v_chat_id, v_project_id, 'budget',    'Cost Optimisation Report',      1, '{}'::jsonb),
        (v_art_wiring_id,    v_chat_id, v_project_id, 'wiring',    'Wiring & Connections Guide',    1, '{}'::jsonb),
        (v_art_code_id,      v_chat_id, v_project_id, 'code',      'ESP32-S3 Companion Firmware',   1, '{}'::jsonb),
        (v_art_enclosure_id, v_chat_id, v_project_id, 'enclosure', '3D Enclosures & Mounts (×5)',   1, '{}'::jsonb);

    -- ================================================================
    -- 13. Insert Artifact Versions
    -- ================================================================

    -- Context / Architecture
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_context_id, 1, v_context_content, NULL, 'architecture.md', 'markdown', v_msg_4_id);

    -- MVP
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_mvp_id, 1, v_mvp_content, NULL, 'mvp.md', 'markdown', v_msg_2_id);

    -- PRD
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_prd_id, 1, v_prd_content, NULL, 'prd.md', 'markdown', v_msg_4_id);

    -- BOM
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_bom_id, 1, NULL, v_bom_json, 'bom.json', 'json', v_msg_6_id);

    -- Budget
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_budget_id, 1, NULL, v_budget_json, 'budget.json', 'json', v_msg_6_id);

    -- Wiring (with SVG diagram and Fritzing URL)
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language,
         created_by_message_id, diagram_svg, diagram_status, fritzing_url)
    VALUES (
        v_art_wiring_id,
        1,
        NULL,
        v_wiring_json,
        'wiring.json',
        'json',
        v_msg_8_id,
        $SVG$<svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
  <rect width="600" height="420" fill="#111827"/>
  <!-- Grid lines -->
  <line x1="0" y1="210" x2="600" y2="210" stroke="#1f2937" stroke-width="1"/>
  <line x1="300" y1="0" x2="300" y2="420" stroke="#1f2937" stroke-width="1"/>
  <!-- Motor circles -->
  <circle cx="150" cy="105" r="45" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2.5"/>
  <text x="150" y="100" fill="#93c5fd" font-size="10" text-anchor="middle">M1 FR</text>
  <text x="150" y="114" fill="#60a5fa" font-size="9" text-anchor="middle">CW 920KV</text>
  <circle cx="450" cy="105" r="45" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2.5"/>
  <text x="450" y="100" fill="#93c5fd" font-size="10" text-anchor="middle">M4 FL</text>
  <text x="450" y="114" fill="#60a5fa" font-size="9" text-anchor="middle">CCW 920KV</text>
  <circle cx="150" cy="315" r="45" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2.5"/>
  <text x="150" y="310" fill="#93c5fd" font-size="10" text-anchor="middle">M2 RR</text>
  <text x="150" y="324" fill="#60a5fa" font-size="9" text-anchor="middle">CCW 920KV</text>
  <circle cx="450" cy="315" r="45" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2.5"/>
  <text x="450" y="310" fill="#93c5fd" font-size="10" text-anchor="middle">M3 RL</text>
  <text x="450" y="324" fill="#60a5fa" font-size="9" text-anchor="middle">CW 920KV</text>
  <!-- Central FC box -->
  <rect x="230" y="160" width="140" height="100" rx="8" fill="#1a2e4a" stroke="#0ea5e9" stroke-width="2"/>
  <text x="300" y="185" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">Pixhawk 6C</text>
  <text x="300" y="200" fill="#7dd3fc" font-size="9" text-anchor="middle">ArduCopter 4.5</text>
  <text x="300" y="218" fill="#94a3b8" font-size="8" text-anchor="middle">MAIN OUT 1-4</text>
  <text x="300" y="232" fill="#94a3b8" font-size="8" text-anchor="middle">TELEM2 → ESP32</text>
  <text x="300" y="246" fill="#94a3b8" font-size="8" text-anchor="middle">GPS1 → M9N</text>
  <!-- ESC signal lines (white) -->
  <line x1="188" y1="120" x2="235" y2="185" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="412" y1="120" x2="365" y2="185" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="188" y1="300" x2="235" y2="245" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="412" y1="300" x2="365" y2="245" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4,3"/>
  <!-- GPS annotation -->
  <rect x="255" y="60" width="90" height="28" rx="5" fill="#14532d" stroke="#22c55e" stroke-width="1.5"/>
  <text x="300" y="77" fill="#86efac" font-size="9" text-anchor="middle">u-blox M9N GPS</text>
  <line x1="300" y1="88" x2="300" y2="160" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Battery + PDB annotation -->
  <rect x="245" y="350" width="110" height="40" rx="5" fill="#451a03" stroke="#f97316" stroke-width="1.5"/>
  <text x="300" y="368" fill="#fdba74" font-size="9" font-weight="bold" text-anchor="middle">4S LiPo 5000mAh</text>
  <text x="300" y="383" fill="#fb923c" font-size="8" text-anchor="middle">→ PDB → 4× ESC</text>
  <line x1="300" y1="350" x2="300" y2="260" stroke="#f97316" stroke-width="2"/>
  <!-- Legend -->
  <line x1="20" y1="395" x2="45" y2="395" stroke="#f1f5f9" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="50" y="399" fill="#94a3b8" font-size="8">PWM Signal</text>
  <line x1="110" y1="395" x2="135" y2="395" stroke="#f97316" stroke-width="2"/>
  <text x="140" y="399" fill="#94a3b8" font-size="8">Power Rail</text>
  <line x1="200" y1="395" x2="225" y2="395" stroke="#22c55e" stroke-width="1.5"/>
  <text x="230" y="399" fill="#94a3b8" font-size="8">Data/UART</text>
</svg>$SVG$,
        'completed',
        'https://placehold.co/800x600/111827/0ea5e9?text=Fritzing+Wiring+Diagram'
    );

    -- Code
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_code_id, 1, NULL, v_code_json, 'code.json', 'json', v_msg_10_id);

    -- Enclosure
    INSERT INTO artifact_versions
        (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES
        (v_art_enclosure_id, 1, NULL, v_enclosure_json, 'enclosure.json', 'json', v_msg_12_id);

    -- ================================================================
    -- 14. Insert Parts
    -- ================================================================
    INSERT INTO parts
        (id, project_id, artifact_id, name, part_number, category, subcategory,
         quantity, price, supplier, supplier_url, lead_time_days, specs)
    VALUES
    (v_part_battery_id, v_project_id, v_art_bom_id,
        '4S 5000 mAh LiPo Battery (Tattu 45C)', 'TA-5000-4S-45C-XT60',
        'Power', 'Battery', 1, 45.00, 'Tattu / GensAce', 'https://hobbyking.com', 5,
        '{"cells":4,"voltage_nominal":"14.8V","capacity":"5000mAh","discharge":"45C","weight_g":345}'::jsonb),

    (v_part_pdb_id, v_project_id, v_art_bom_id,
        'Matek FCHUB-6S Power Distribution Board', 'FCHUB-6S',
        'Power', 'PDB', 1, 6.00, 'Matek Systems', 'https://www.mateksys.com', 3,
        '{"max_current":"120A","bec_output":"5V/2A","sensor":"184A built-in","mount":"30.5mm"}'::jsonb),

    (v_part_esc_1_id, v_project_id, v_art_bom_id,
        'BLHeli_32 30 A ESC', 'HK-30A-BL32',
        'Propulsion', 'ESC', 4, 9.00, 'HobbyKing', 'https://hobbyking.com', 7,
        '{"continuous_A":30,"burst_A":40,"firmware":"BLHeli_32","protocol":"DSHOT600","bec":"5V/3A"}'::jsonb),

    (v_part_pixhawk_id, v_project_id, v_art_bom_id,
        'Pixhawk 6C Flight Controller (Standard)', 'PIX6C-STD',
        'Flight Controller', 'Electronics', 1, 95.00, 'Holybro', 'https://holybro.com', 5,
        '{"MCU":"STM32H753","IMU":"ICM-42688-P×2","baro":"BMP388","interfaces":"8xPWM,TELEM,GPS,I2C,CAN"}'::jsonb),

    (v_part_esp32_id, v_project_id, v_art_bom_id,
        'ESP32-S3-DevKitC-1 (N16R8)', 'ESP32-S3-DC-N16R8',
        'Companion Computer', 'Electronics', 1, 8.00, 'Espressif / Amazon', 'https://www.amazon.in', 3,
        '{"cpu":"Xtensa LX7 dual 240MHz","ram":"512KB+8MB PSRAM","flash":"16MB","wifi":"802.11bgn"}'::jsonb),

    (v_part_gps_id, v_project_id, v_art_bom_id,
        'u-blox M9N GPS + IST8310 Compass', 'M9N-GPS-COMBO',
        'Sensors', 'GPS', 1, 35.00, 'Holybro', 'https://holybro.com', 5,
        '{"chip":"u-blox M9N","accuracy_cep":"1.5m","update_hz":18,"cold_start_s":24,"compass":"IST8310"}'::jsonb),

    (v_part_ultrasonic_id, v_project_id, v_art_bom_id,
        'HC-SR04 Ultrasonic Obstacle Sensor', 'SEN-HC-SR04',
        'Sensors', 'Ultrasonic', 1, 3.00, 'Amazon', 'https://www.amazon.in', 2,
        '{"range_cm":"2–400","accuracy_mm":3,"frequency_khz":40,"supply_v":5,"fov_deg":15}'::jsonb),

    (v_part_barometer_id, v_project_id, v_art_bom_id,
        'BMP280 Barometric Pressure + Temp Sensor', 'BMP280-MODULE',
        'Sensors', 'Barometer', 1, 4.00, 'Adafruit / Amazon', 'https://www.adafruit.com', 2,
        '{"interface":"I2C 0x76","pressure_hpa":"300-1100","altitude_res_m":0.12,"supply_v":"1.8-3.6"}'::jsonb);

    -- ================================================================
    -- 15. Insert Connections
    -- ================================================================
    INSERT INTO connections
        (id, project_id, artifact_id, from_part_id, from_pin, to_part_id, to_pin,
         wire_color, wire_gauge, notes)
    VALUES
    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_battery_id,  'XT60 Male +',
        v_part_pdb_id,      'XT60 Female IN',
        'Red', '14AWG', 'Main high-current supply. Verify polarity before first connection.'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_pdb_id,      'ESC Pad A+ / A−',
        v_part_esc_1_id,    'Power Lead + / −',
        'Red/Black', '14AWG', 'Power to all 4 ESCs from PDB solder pads. Tin pads and wires before joining.'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_pdb_id,      '5V BEC Output',
        v_part_pixhawk_id,  'POWER1 6-pin JST-GH',
        'Red/Black', '22AWG', 'Regulated 5.1V rail. Provides voltage + current telemetry to Pixhawk ADC.'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_pixhawk_id,  'TELEM2 TX (JST-GH pin 3)',
        v_part_esp32_id,    'GPIO17 U1RXD',
        'Yellow', '24AWG', 'MAVLink 2.0 at 57,600 baud. Pixhawk TX → ESP32 RX. 3.3V compatible — no level shifting needed.'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_esp32_id,    'GPIO16 U1TXD',
        v_part_pixhawk_id,  'TELEM2 RX (JST-GH pin 2)',
        'Green', '24AWG', 'Return channel for companion computer commands (mode switch, mission upload).'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_pixhawk_id,  'GPS1 Port (JST-GH 10-pin)',
        v_part_gps_id,      'JST-GH 10-pin',
        'Multi-colour ribbon', '26AWG', 'Plug-and-play Holybro cable. Mount GPS on top mast minimum 5 cm above carbon arms.'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_pixhawk_id,  'I2C2 SDA/SCL',
        v_part_barometer_id,'SDA/SCL',
        'Blue/Orange', '26AWG', 'External redundant barometer. Mount in foam-padded enclosure to shield from prop downwash.'),

    (gen_random_uuid(), v_project_id, v_art_wiring_id,
        v_part_esp32_id,    'GPIO5 (TRIG) / GPIO18 (ECHO via 1k+2k divider)',
        v_part_ultrasonic_id,'TRIG / ECHO',
        'Yellow/Green', '24AWG', '⚠️ ECHO is 5V logic — MUST use resistor voltage divider (1kΩ + 2kΩ) before ESP32 GPIO18.');

    -- ================================================================
    -- 16. Update chat_sessions stage and stage_history
    -- ================================================================
    UPDATE chat_sessions
    SET
        project_stage = 'fix',
        stage_history = '[
            {
                "from": "planning",
                "to": "design",
                "timestamp": "2026-06-21T14:10:00Z",
                "completedArtifacts": ["context", "mvp", "prd"],
                "notes": "Architecture defined; MVP scope locked; PRD approved"
            },
            {
                "from": "design",
                "to": "build",
                "timestamp": "2026-06-21T14:16:00Z",
                "completedArtifacts": ["bom", "budget"],
                "notes": "BOM finalised at $308; budget optimised with 4 cost-saving alternatives"
            },
            {
                "from": "build",
                "to": "fix",
                "timestamp": "2026-06-21T14:22:00Z",
                "completedArtifacts": ["wiring", "code", "enclosure"],
                "notes": "Wiring guide with 10 connections documented; firmware written; 5 OpenSCAD models created"
            }
        ]'::jsonb
    WHERE chat_id = v_chat_id;

    -- ================================================================
    -- 17. Update project budget summary
    -- ================================================================
    UPDATE projects
    SET
        target_budget           = 350.00,
        current_estimated_cost  = 308.00
    WHERE id = v_project_id;

    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'SUCCESS: Enhanced seed complete!';
    RAISE NOTICE '  Artifacts: 8 (context, mvp, prd, bom, budget, wiring, code, enclosure)';
    RAISE NOTICE '  Parts: 8 in BOM';
    RAISE NOTICE '  Connections: 8 wiring entries';
    RAISE NOTICE '  3D Models: 5 OpenSCAD files in enclosure artifact';
    RAISE NOTICE '  Stage: build → fix (all milestones complete)';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';

END $$;

COMMIT;