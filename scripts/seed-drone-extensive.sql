-- ============================================
-- EXTENSIVE DEMO SEED: Farm Patrol Drone (Drawers & Artifacts Populated)
-- ============================================
-- Creates a realistic demo with:
-- - All artifact types filled (DB rows populated)
-- - Extensive AI responses with container markers
-- - Full parts and connections seeded in the database
-- - Professional engineering depth
-- ============================================
-- Run this in Supabase SQL Editor or any PostgreSQL client
-- Pure SQL - no psql meta-commands
-- ============================================

BEGIN;

-- Clean up if exists
DELETE FROM chats WHERE title = 'Farm Patrol Autonomous Drone Build';

DO $$
DECLARE
    -- Primary IDs
    v_project_id UUID := gen_random_uuid();
    v_chat_id UUID := gen_random_uuid();
    v_session_id UUID := gen_random_uuid();
    v_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Default/system user ID
    
    -- Message IDs for referential integrity
    v_msg_1_id UUID := gen_random_uuid();
    v_msg_2_id UUID := gen_random_uuid();
    v_msg_3_id UUID := gen_random_uuid();
    v_msg_4_id UUID := gen_random_uuid();
    v_msg_5_id UUID := gen_random_uuid();
    v_msg_6_id UUID := gen_random_uuid();
    v_msg_7_id UUID := gen_random_uuid();
    v_msg_8_id UUID := gen_random_uuid();
    v_msg_9_id UUID := gen_random_uuid();
    v_msg_10_id UUID := gen_random_uuid();
    v_msg_11_id UUID := gen_random_uuid();
    v_msg_12_id UUID := gen_random_uuid();
    
    -- Artifact IDs
    v_art_context_id UUID := gen_random_uuid();
    v_art_mvp_id UUID := gen_random_uuid();
    v_art_prd_id UUID := gen_random_uuid();
    v_art_bom_id UUID := gen_random_uuid();
    v_art_wiring_id UUID := gen_random_uuid();
    v_art_code_id UUID := gen_random_uuid();
    v_art_enclosure_id UUID := gen_random_uuid();
    v_art_budget_id UUID := gen_random_uuid();

    -- Part IDs for connections
    v_part_battery_id UUID := gen_random_uuid();
    v_part_pdb_id UUID := gen_random_uuid();
    v_part_esc_1_id UUID := gen_random_uuid();
    v_part_pixhawk_id UUID := gen_random_uuid();
    v_part_esp32_id UUID := gen_random_uuid();
    v_part_gps_id UUID := gen_random_uuid();
    v_part_ultrasonic_id UUID := gen_random_uuid();
    v_part_barometer_id UUID := gen_random_uuid();

    -- Markdown and JSON texts
    v_mvp_content TEXT;
    v_prd_content TEXT;
    v_context_content TEXT;
    v_bom_json JSONB;
    v_budget_json JSONB;
    v_wiring_json JSONB;
    v_code_json JSONB;
    v_enclosure_json JSONB;
BEGIN

    -- 1. Create project
    INSERT INTO projects (
        id, user_id, name, description, category, status, 
        target_budget, current_estimated_cost, metadata
    ) VALUES (
        v_project_id,
        v_user_id,
        'Farm Patrol Autonomous Drone',
        'DIY autonomous agricultural monitoring drone with video streaming and auto-charging',
        'Robotics',
        'active',
        350.00,
        308.00,
        '{"tags": ["drone", "agriculture", "autonomous", "video-streaming", "GPS"], "difficulty": "advanced", "estimated_build_time": "40 hours"}'::jsonb
    );

    -- 2. Create chat
    INSERT INTO chats (id, project_id, title, user_id, is_public, last_message_at)
    VALUES (
        v_chat_id,
        v_project_id,
        'Farm Patrol Autonomous Drone Build',
        v_user_id,
        true,
        NOW()
    );

    -- 3. Create session (in 'fix' stage since all artifacts are designed)
    INSERT INTO chat_sessions (
        id, chat_id, current_agent, project_stage, 
        auto_orchestration, selected_provider, selected_model, stage_history
    ) VALUES (
        v_session_id,
        v_chat_id,
        'orchestrator',
        'fix',
        true,
        'openrouter',
        'anthropic/claude-3.5-sonnet',
        '[
            {"from": "planning", "to": "design", "timestamp": "2026-06-21T14:16:33Z", "completedArtifacts": ["context", "mvp", "prd"]},
            {"from": "design", "to": "build", "timestamp": "2026-06-21T14:18:33Z", "completedArtifacts": ["bom"]},
            {"from": "build", "to": "fix", "timestamp": "2026-06-21T14:20:00Z", "completedArtifacts": ["wiring", "code"]}
        ]'::jsonb
    );

    -- 4. Define contents for artifact_versions
    v_mvp_content := $$# 🎯 MVP Created: Farm Patrol Autonomous Drone

Build a **semi-autonomous agricultural monitoring drone** capable of:

* Flying predefined patrol routes using GPS waypoints
* Streaming live 1080p video to your mobile phone
* Detecting obstacles and avoiding collisions
* Automatically returning home when battery is low
* Docking with a charging station for autonomous operation

This system will reduce the time spent on manual farm inspections and provide real-time aerial visibility of your crops, irrigation systems, and livestock.$$;

    v_context_content := $$# Project Context: Farm Patrol Autonomous Drone

## Overview
The **Farm Patrol Autonomous Drone** is designed to provide low-cost aerial monitoring for agricultural land. This system will enable farmers to conduct regular aerial inspections without manual flying, reducing labor costs and improving crop management efficiency.

**Target Market**: Small to medium farms (10-100 acres)
**Price Point**: <$350 complete system
**Key Differentiator**: Fully autonomous with auto-charging

## Key Specifications & Use Cases
- **Flight Time**: Up to 22 minutes on a single charge (4S 5000 mAh LiPo battery)
- **Monitoring Range**: Covers 10-acre fields in under 12 minutes
- **Primary Applications**: Irrigation leak detection, crop health mapping, and livestock counting via a live 1080p aerial video stream
- **Safety Features**: Integrated Pixhawk 6C flight controller with autonomous Return-to-Home (RTH) on low battery (20%) or signal loss, and forward-facing ultrasonic sensors for obstacle avoidance$$;

    v_prd_content := $$# Product Requirements Document

## Executive Summary
This document details the functional and non-functional requirements for the Farm Patrol Autonomous Drone.

## Functional Requirements
* **FR-001: Autonomous Navigation**: The drone shall autonomously fly predefined GPS waypoint missions.
* **FR-002: Video Streaming**: The drone shall stream live 1080p video to the mobile app.
* **FR-003: Return To Home**: The drone shall automatically return home when battery is low (< 20%).
* **FR-004: Battery Monitoring**: Real-time voltage and percentage telemetry feedback.

## Non-Functional Requirements
* **NFR-001: Reliability**: 99% mission completion rate.
* **NFR-002: Performance**: Minimum 20-minute flight duration on a single charge.
* **NFR-003: Weather Resistance**: IP54 dust/splash resistant design for agricultural use.$$;

    v_bom_json := $${
      "project_name": "Farm Patrol Drone BOM",
      "summary": "Complete parts list with pricing, sourcing, and specifications.",
      "components": [
        {"name": "Pixhawk 6C Flight Controller", "partNumber": "PIX6C-STD", "quantity": 1, "estimatedCost": 95.00, "supplier": "Holybro", "link": "https://holybro.com"},
        {"name": "u-blox M9N GPS with Compass", "partNumber": "M9N-GPS", "quantity": 1, "estimatedCost": 35.00, "supplier": "Holybro", "link": "https://holybro.com"},
        {"name": "Telemetry Radio 433MHz", "partNumber": "TR-433-V3", "quantity": 1, "estimatedCost": 25.00, "supplier": "HolyBro", "link": "https://holybro.com"},
        {"name": "ESP32-S3-DevKitC", "partNumber": "ESP32-S3-DC", "quantity": 1, "estimatedCost": 8.00, "supplier": "Espressif", "link": "https://amazon.com"},
        {"name": "MicroSD Card 32GB", "partNumber": "SDSQUA4-032", "quantity": 1, "estimatedCost": 7.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "920KV Brushless Motor", "partNumber": "BR920", "quantity": 4, "estimatedCost": 12.00, "supplier": "RacerStar", "link": "https://hobbyking.com"},
        {"name": "30A ESC (BLHeli_32)", "partNumber": "HK-30A-BL32", "quantity": 4, "estimatedCost": 9.00, "supplier": "HobbyKing", "link": "https://hobbyking.com"},
        {"name": "10x4.5 Carbon Fiber Props", "partNumber": "CF-10045-CW/CCW", "quantity": 4, "estimatedCost": 4.00, "supplier": "HQProp", "link": "https://hobbyking.com"},
        {"name": "4S 5000mAh LiPo Battery (XT60)", "partNumber": "TA-5000-4S-45C", "quantity": 1, "estimatedCost": 45.00, "supplier": "Tattu", "link": "https://hobbyking.com"},
        {"name": "XT60 Power Distribution Board", "partNumber": "PDB-XT60", "quantity": 1, "estimatedCost": 6.00, "supplier": "Matek", "link": "https://amazon.com"},
        {"name": "LiPo Battery Charger", "partNumber": "iMAX-B6AC", "quantity": 1, "estimatedCost": 28.00, "supplier": "SkyRC", "link": "https://amazon.com"},
        {"name": "XT60 Connectors (pairs)", "partNumber": "XT60-PAIRS", "quantity": 5, "estimatedCost": 1.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "Raspberry Pi Camera Module 3", "partNumber": "RPi-CAM3", "quantity": 1, "estimatedCost": 35.00, "supplier": "RPi Foundation", "link": "https://amazon.com"},
        {"name": "HC-SR04 Ultrasonic Sensor", "partNumber": "SEN-0193", "quantity": 1, "estimatedCost": 3.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "BMP280 Barometer", "partNumber": "BMP280", "quantity": 1, "estimatedCost": 4.00, "supplier": "Adafruit", "link": "https://amazon.com"},
        {"name": "450mm Carbon Fiber Frame Kit", "partNumber": "F450-CF-KIT", "quantity": 1, "estimatedCost": 28.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "Vibration Dampening Balls", "partNumber": "VIB-DAMP-M3", "quantity": 4, "estimatedCost": 1.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "M3 Nylon Screws/Nuts Set", "partNumber": "M3-NYLON-KIT", "quantity": 1, "estimatedCost": 6.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "Silicone Wire 14AWG (Red/Black)", "partNumber": "SIL-14AWG", "quantity": 3, "estimatedCost": 2.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "Dupont Jumper Wires", "partNumber": "DUPONT-40", "quantity": 40, "estimatedCost": 3.00, "supplier": "Amazon", "link": "https://amazon.com"},
        {"name": "Heat Shrink Tubing Set", "partNumber": "HEAT-SHRINK", "quantity": 1, "estimatedCost": 6.00, "supplier": "Amazon", "link": "https://amazon.com"}
      ],
      "totalCost": 308.00,
      "warnings": [
        "Ensure 5V BEC outputs are isolated",
        "XT60 battery connectors must be clean and fully seated before takeoff"
      ],
      "powerAnalysis": {
        "totalCurrent": "120A Max Draw",
        "recommendedSupply": "4S LiPo battery with min 45C rating"
      }
    }$$::jsonb;

    v_budget_json := $${
      "originalCost": 350.00,
      "optimizedCost": 308.00,
      "savings": "$42.00",
      "bulkOpportunities": [
        "Purchase RacerStar motors as a 4-pack bundle to save 15%",
        "Buy Dupont wires in multi-packs of 40 to decrease unit cost"
      ],
      "qualityWarnings": [
        "Do not select off-brand batteries; agricultural environment requires premium cells",
        "Pixhawk 6C Standard is critical for GPS precision"
      ],
      "recommendations": [
        {
          "component": "920KV Motors",
          "original": "Individual T-Motor Motors ($80.00)",
          "alternative": "RacerStar Bulk Pack ($48.00)",
          "costSavings": 32.00,
          "reasoning": "RacerStar offers equivalent thrust for agricultural monitoring at a significantly lower cost.",
          "tradeoff": "Medium - Lower long-term bearing lifespan"
        },
        {
          "component": "GPS Module",
          "original": "Holybro M9N GPS Standard ($45.00)",
          "alternative": "u-blox M9N GPS Compass Combo ($35.00)",
          "costSavings": 10.00,
          "reasoning": "A combo package from Holybro standard distributor reduces shipping and package costs.",
          "tradeoff": "Low - Identical technical specifications"
        }
      ]
    }$$::jsonb;

    v_wiring_json := $${
      "connections": [
        {"from_component": "Battery", "from_pin": "XT60 Male", "to_component": "Power Module", "to_pin": "XT60 Female Input", "wire_color": "Red", "notes": "Main battery supply"},
        {"from_component": "Power Module", "from_pin": "XT60 Output", "to_component": "PDB", "to_pin": "XT60 Input", "wire_color": "Black", "notes": "Ground connection"},
        {"from_component": "PDB", "from_pin": "ESC1 Power Pads", "to_component": "ESC 1 (Front Right)", "to_pin": "Power Input Pads", "wire_color": "Red/Black", "notes": "Main power for ESC 1"},
        {"from_component": "ESC 1", "from_pin": "PWM Signal Wire", "to_component": "Pixhawk 6C", "to_pin": "MAIN OUT 1", "wire_color": "Yellow", "notes": "Front Right motor control"},
        {"from_component": "Pixhawk 6C", "from_pin": "TELEM2 UART", "to_component": "ESP32", "to_pin": "GPIO16/17 UART", "wire_color": "Green/Yellow", "notes": "MAVLink companion bridge"},
        {"from_component": "Pixhawk 6C", "from_pin": "GPS1 Port", "to_component": "u-blox GPS", "to_pin": "JST-GH Port", "wire_color": "Multi-colored", "notes": "GPS and Compass data"}
      ],
      "instructions": "Solder all power connections with lead-free solder. Use vibration dampeners under Pixhawk.",
      "warnings": [
        "Check battery polarity. XT60 is key-shaped, do not force reverse connection.",
        "Do not power up Pixhawk with propeller blades mounted!"
      ],
      "ai_images": {
        "status": "completed",
        "progress": 100,
        "current_step": "Idle",
        "breadboard": {
          "url": "https://placehold.co/600x400/png?text=Breadboard+Wiring+Diagram",
          "storage_path": "wiring/breadboard.png",
          "prompt": "Fritzing-style wiring diagram of Pixhawk 6C and ESP32 camera",
          "model": "dall-e-3",
          "generated_at": "2026-06-21T14:16:33Z"
        }
      }
    }$$::jsonb;

    v_code_json := $${
      "files": [
        {
          "path": "src/main.cpp",
          "content": "// Farm Patrol Drone - ESP32 Companion Computer\n// Handles: Video Streaming, MAVLink Bridge, WiFi Control\n\n#include <Arduino.h>\n#include <WiFi.h>\n#include \"esp_camera.h\"\n#include \"mavlink_handler.h\"\n#include \"camera_stream.h\"\n#include \"wifi_manager.h\"\n#include \"config.h\"\n\n// Global objects\nMAVLinkHandler mavlink;\nCameraStream camStream;\nWiFiManager wifiMgr;\n\nvoid setup() {\n    Serial.begin(115200);\n    Serial2.begin(57600, SERIAL_8N1, 16, 17); // UART to Pixhawk\n    \n    Serial.println(\"\\n🚁 Farm Drone ESP32 Starting...\");\n    \n    // Initialize WiFi AP\n    if (!wifiMgr.startAccessPoint(WIFI_SSID, WIFI_PASS)) {\n        Serial.println(\"❌ WiFi AP failed!\");\n        return;\n    }\n    Serial.println(\"✅ WiFi AP: \" + String(WIFI_SSID));\n    \n    // Initialize camera\n    if (!camStream.init()) {\n        Serial.println(\"❌ Camera init failed!\");\n        return;\n    }\n    Serial.println(\"✅ Camera ready\");\n    \n    // Initialize MAVLink\n    mavlink.init(&Serial2);\n    Serial.println(\"✅ MAVLink bridge active\");\n    \n    // Start HTTP server\n    camStream.startServer();\n    Serial.println(\"✅ Streaming at http://\" + WiFi.softAPIP().toString());\n    \n    Serial.println(\"\\n🎥 System Ready!\\n\");\n}\n\nvoid loop() {\n    // Handle MAVLink messages\n    mavlink.update();\n    \n    // Stream camera frames\n    camStream.handleClients();\n    \n    // Send telemetry to mobile app\n    if (millis() % 1000 == 0) {\n        mavlink.sendHeartbeat();\n    }\n    \n    delay(1);\n}"
        },
        {
          "path": "src/mavlink_handler.cpp",
          "content": "#include \"mavlink_handler.h\"\n#include <mavlink.h>\n\nvoid MAVLinkHandler::init(HardwareSerial* serial) {\n    _serial = serial;\n    _systemId = 1;\n    _componentId = MAV_COMP_ID_ONBOARD_COMPUTER;\n}\n\nvoid MAVLinkHandler::update() {\n    mavlink_message_t msg;\n    mavlink_status_t status;\n    \n    while (_serial->available()) {\n        uint8_t c = _serial->read();\n        \n        if (mavlink_parse_char(MAVLINK_COMM_0, c, &msg, &status)) {\n            handleMessage(&msg);\n        }\n    }\n}\n\nvoid MAVLinkHandler::handleMessage(mavlink_message_t* msg) {\n    switch (msg->msgid) {\n        case MAVLINK_MSG_ID_HEARTBEAT: {\n            mavlink_heartbeat_t hb;\n            mavlink_msg_heartbeat_decode(msg, &hb);\n            \n            _lastHeartbeat = millis();\n            _armed = (hb.base_mode & MAV_MODE_FLAG_SAFETY_ARMED);\n            \n            Serial.printf(\"💓 Heartbeat: %s\\n\", \n                _armed ? \"ARMED\" : \"DISARMED\");\n            break;\n        }\n        \n        case MAVLINK_MSG_ID_SYS_STATUS: {\n            mavlink_sys_status_t sys;\n            mavlink_msg_sys_status_decode(msg, &sys);\n            \n            _batteryVoltage = sys.voltage_battery / 1000.0;\n            _batteryPercent = sys.battery_remaining;\n            \n            Serial.printf(\"🔋 Battery: %.2fV (%d%%)\\n\", \n                _batteryVoltage, _batteryPercent);\n            break;\n        }\n    }\n}"
        },
        {
          "path": "platformio.ini",
          "content": "[env:esp32s3]\nplatform = espressif32\nboard = esp32-s3-devkitc-1\nframework = arduino\n\nlib_deps = \n    mavlink/MAVLink@^2.0.0\n    esp32-camera@^2.0.0\n\nmonitor_speed = 115200\nupload_speed = 921600"
        }
      ]
    }$$::jsonb;

    v_enclosure_json := $${
      "files": [
        {
          "path": "pixhawk_case.scad",
          "language": "openscad",
          "content": "// Pixhawk 6C Protective Case\n// Print Settings: 0.2mm layer, 20% infill, PETG\n\npcb_length = 84;\npcb_width = 44;\npcb_height = 1.6;\ncase_clearance = 3;\nwall_thickness = 2;\n\nmodule pixhawk_case() {\n    difference() {\n        rounded_box(\n            pcb_length + 2*wall_thickness + 2*case_clearance,\n            pcb_width + 2*wall_thickness + 2*case_clearance,\n            pcb_height + 2*case_clearance + wall_thickness,\n            3\n        );\n        translate([wall_thickness, wall_thickness, wall_thickness])\n            rounded_box(\n                pcb_length + 2*case_clearance,\n                pcb_width + 2*case_clearance,\n                pcb_height + 2*case_clearance + 1,\n                2\n            );\n    }\n}\n\nmodule rounded_box(l, w, h, r) {\n    hull() {\n        translate([r, r, 0]) cylinder(r=r, h=h, $fn=30);\n        translate([l-r, r, 0]) cylinder(r=r, h=h, $fn=30);\n        translate([r, w-r, 0]) cylinder(r=r, h=h, $fn=30);\n        translate([l-r, w-r, 0]) cylinder(r=r, h=h, $fn=30);\n    }\n}\n\npixhawk_case();"
        },
        {
          "path": "esp32_housing.scad",
          "language": "openscad",
          "content": "// ESP32 + Camera Weather-Resistant Housing\nesp32_length = 27;\nesp32_width = 25;\ncamera_diameter = 25;\nwall = 2;\n\nmodule esp32_housing() {\n    difference() {\n        cube([esp32_length + 2*wall, esp32_width + 2*wall, 15]);\n        translate([wall, wall, wall])\n            cube([esp32_length, esp32_width, 12]);\n    }\n}\nesp32_housing();"
        }
      ]
    }$$::jsonb;

    -- 5. Insert sequential messages
    
    -- Message 1 (user)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name)
    VALUES (v_msg_1_id, v_chat_id, 1, 'user', 'I want to build a DIY autonomous drone that can patrol my farm, stream video to my phone, and return to its charging station automatically.', NULL);

    -- Message 2 (assistant)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name, agent_id, input_tokens, output_tokens, metadata)
    VALUES (
        v_msg_2_id, 
        v_chat_id, 
        2, 
        'assistant', 
        'MVP_START' || chr(10) || v_mvp_content || chr(10) || 'MVP_END' || chr(10) || 'Would you like me to proceed with the PRD?',
        'projectInitializer', 
        'projectInitializer', 
        180, 
        950, 
        '{"toolCalls": [{"name": "write", "arguments": {"artifact_type": "mvp", "title": "Farm Patrol Drone MVP"}}]}'::jsonb
    );

    -- Message 3 (user)
    INSERT INTO messages (id, chat_id, sequence_number, role, content)
    VALUES (v_msg_3_id, v_chat_id, 3, 'user', 'Yes, create the PRD and technical architecture.');

    -- Message 4 (assistant)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name, agent_id, input_tokens, output_tokens, metadata)
    VALUES (
        v_msg_4_id, 
        v_chat_id, 
        4, 
        'assistant', 
        'CONTEXT_START' || chr(10) || v_context_content || chr(10) || 'CONTEXT_END' || chr(10) || chr(10) || 'PRD_START' || chr(10) || v_prd_content || chr(10) || 'PRD_END' || chr(10) || 'Ready to generate the Bill of Materials?',
        'productDesigner', 
        'productDesigner', 
        220, 
        1800, 
        '{"toolCalls": [{"name": "write", "arguments": {"artifact_type": "prd", "title": "Farm Patrol Drone PRD"}}, {"name": "write", "arguments": {"artifact_type": "context", "title": "Technical Architecture"}}]}'::jsonb
    );

    -- Message 5 (user)
    INSERT INTO messages (id, chat_id, sequence_number, role, content)
    VALUES (v_msg_5_id, v_chat_id, 5, 'user', 'Yes, generate the complete BOM with pricing and sourcing.');

    -- Message 6 (assistant)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name, agent_id, input_tokens, output_tokens, metadata)
    VALUES (
        v_msg_6_id, 
        v_chat_id, 
        6, 
        'assistant', 
        'Here is the complete BOM for the Farm Patrol Drone.' || chr(10) || '<BOM_CONTAINER>' || chr(10) || v_bom_json::text || chr(10) || '</BOM_CONTAINER>' || chr(10) || 'Ready to generate the wiring diagram?',
        'bomGenerator', 
        'bomGenerator', 
        150, 
        1400, 
        '{"toolCalls": [{"name": "write", "arguments": {"artifact_type": "bom", "title": "Farm Patrol Drone BOM"}}, {"name": "write", "arguments": {"artifact_type": "budget", "title": "Farm Patrol Drone Budget"}}]}'::jsonb
    );

    -- Message 7 (user)
    INSERT INTO messages (id, chat_id, sequence_number, role, content)
    VALUES (v_msg_7_id, v_chat_id, 7, 'user', 'Perfect! Now generate the wiring diagram.');

    -- Message 8 (assistant)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name, agent_id, input_tokens, output_tokens, metadata)
    VALUES (
        v_msg_8_id, 
        v_chat_id, 
        8, 
        'assistant', 
        'Here is the wiring guide and connection map.' || chr(10) || 'Ready to generate the firmware code?',
        'wiringSpecialist', 
        'wiringSpecialist', 
        180, 
        2200, 
        '{"toolCalls": [{"name": "write", "arguments": {"artifact_type": "wiring", "title": "Farm Patrol Drone Wiring"}}]}'::jsonb
    );

    -- Message 9 (user)
    INSERT INTO messages (id, chat_id, sequence_number, role, content)
    VALUES (v_msg_9_id, v_chat_id, 9, 'user', 'Excellent! Generate the firmware for the ESP32 companion computer.');

    -- Message 10 (assistant)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name, agent_id, input_tokens, output_tokens, metadata)
    VALUES (
        v_msg_10_id, 
        v_chat_id, 
        10, 
        'assistant', 
        'I have generated the firmware for the ESP32 companion computer.' || chr(10) || '<CODE_CONTAINER>' || chr(10) || v_code_json::text || chr(10) || '</CODE_CONTAINER>' || chr(10) || 'Ready to design the 3D enclosure?',
        'codeGenerator', 
        'codeGenerator', 
        200, 
        2400, 
        '{"toolCalls": [{"name": "write", "arguments": {"artifact_type": "code", "title": "ESP32 Companion Firmware"}}]}'::jsonb
    );

    -- Message 11 (user)
    INSERT INTO messages (id, chat_id, sequence_number, role, content)
    VALUES (v_msg_11_id, v_chat_id, 11, 'user', 'Perfect! Now design the 3D printable enclosure and charging dock.');

    -- Message 12 (assistant)
    INSERT INTO messages (id, chat_id, sequence_number, role, content, agent_name, agent_id, input_tokens, output_tokens, metadata)
    VALUES (
        v_msg_12_id, 
        v_chat_id, 
        12, 
        'assistant', 
        'Here are the OpenSCAD designs and instructions for the protective enclosure.' || chr(10) || 'Your Farm Patrol Drone project is fully designed!',
        'enclosureDesigner', 
        'enclosureDesigner', 
        250, 
        2800, 
        '{"toolCalls": [{"name": "write", "arguments": {"artifact_type": "enclosure", "title": "3D Enclosure & Charging Dock"}}]}'::jsonb
    );

    -- 6. Insert Artifact Containers
    
    -- context
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_context_id, v_chat_id, v_project_id, 'context', 'Technical Architecture', 1, '{}'::jsonb);

    -- mvp
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_mvp_id, v_chat_id, v_project_id, 'mvp', 'Farm Patrol Drone MVP', 1, '{}'::jsonb);

    -- prd
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_prd_id, v_chat_id, v_project_id, 'prd', 'Farm Patrol Drone PRD', 1, '{}'::jsonb);

    -- bom
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_bom_id, v_chat_id, v_project_id, 'bom', 'Farm Patrol Drone BOM', 1, '{}'::jsonb);

    -- budget
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_budget_id, v_chat_id, v_project_id, 'budget', 'Farm Patrol Drone Budget', 1, '{}'::jsonb);

    -- wiring
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_wiring_id, v_chat_id, v_project_id, 'wiring', 'Farm Patrol Drone Wiring', 1, '{}'::jsonb);

    -- code
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_code_id, v_chat_id, v_project_id, 'code', 'ESP32 Companion Firmware', 1, '{}'::jsonb);

    -- enclosure
    INSERT INTO artifacts (id, chat_id, project_id, type, title, current_version, metadata)
    VALUES (v_art_enclosure_id, v_chat_id, v_project_id, 'enclosure', '3D Enclosure & Charging Dock', 1, '{}'::jsonb);


    -- 7. Insert Artifact Versions

    -- context version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_context_id, 1, v_context_content, NULL, 'architecture.md', 'markdown', v_msg_4_id);

    -- mvp version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_mvp_id, 1, v_mvp_content, NULL, 'mvp.md', 'markdown', v_msg_2_id);

    -- prd version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_prd_id, 1, v_prd_content, NULL, 'prd.md', 'markdown', v_msg_4_id);

    -- bom version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_bom_id, 1, NULL, v_bom_json, 'bom.json', 'json', v_msg_6_id);

    -- budget version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_budget_id, 1, NULL, v_budget_json, 'budget.json', 'json', v_msg_6_id);

    -- wiring version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id, diagram_svg, diagram_status, fritzing_url)
    VALUES (
        v_art_wiring_id, 
        1, 
        NULL, 
        v_wiring_json, 
        'wiring.json', 
        'json', 
        v_msg_8_id,
        '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1e1e1e"/><circle cx="200" cy="150" r="80" stroke="#0071e3" stroke-width="4" fill="none"/><line x1="200" y1="20" x2="200" y2="280" stroke="#444" stroke-width="2"/><line x1="20" y1="150" x2="380" y2="150" stroke="#444" stroke-width="2"/><text x="200" y="155" fill="#fff" font-size="16" font-family="monospace" text-anchor="middle">Pixhawk 6C Setup</text><text x="50" y="50" fill="#0071e3" font-size="12">M1 (CW)</text><text x="350" y="50" fill="#0071e3" font-size="12">M4 (CCW)</text><text x="50" y="250" fill="#0071e3" font-size="12">M3 (CW)</text><text x="350" y="250" fill="#0071e3" font-size="12">M2 (CCW)</text></svg>',
        'completed',
        'https://placehold.co/600x400/png?text=Breadboard+Wiring+Diagram'
    );

    -- code version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_code_id, 1, NULL, v_code_json, 'code.json', 'json', v_msg_10_id);

    -- enclosure version
    INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, filename, language, created_by_message_id)
    VALUES (v_art_enclosure_id, 1, NULL, v_enclosure_json, 'enclosure.json', 'json', v_msg_12_id);


    -- 8. Insert BOM components into parts table
    INSERT INTO parts (id, project_id, artifact_id, name, part_number, category, subcategory, quantity, price, supplier, supplier_url, lead_time_days, specs)
    VALUES
    (v_part_battery_id, v_project_id, v_art_bom_id, '4S 5000mAh LiPo Battery', 'TA-5000-4S-45C', 'Power', 'Battery', 1, 45.00, 'Tattu', 'https://hobbyking.com', 4, '{"capacity": "5000mAh", "voltage": "14.8V"}'::jsonb),
    (v_part_pdb_id, v_project_id, v_art_bom_id, 'XT60 Power Distribution Board', 'PDB-XT60', 'Power', 'PDB', 1, 6.00, 'Matek', 'https://amazon.com', 2, '{"max_current": "120A"}'::jsonb),
    (v_part_esc_1_id, v_project_id, v_art_bom_id, '30A ESC (BLHeli_32)', 'HK-30A-BL32', 'Propulsion', 'ESC', 4, 9.00, 'HobbyKing', 'https://hobbyking.com', 7, '{"current": "30A", "firmware": "BLHeli_32"}'::jsonb),
    (v_part_pixhawk_id, v_project_id, v_art_bom_id, 'Pixhawk 6C Flight Controller', 'PIX6C-STD', 'Flight Controller', 'Electronics', 1, 95.00, 'Holybro', 'https://holybro.com', 3, '{"voltage": "5V"}'::jsonb),
    (v_part_esp32_id, v_project_id, v_art_bom_id, 'ESP32-S3-DevKitC', 'ESP32-S3-DC', 'Companion Computer', 'Electronics', 1, 8.00, 'Espressif', 'https://amazon.com', 2, '{"wifi": "802.11b/g/n"}'::jsonb),
    (v_part_gps_id, v_project_id, v_art_bom_id, 'u-blox M9N GPS with Compass', 'M9N-GPS', 'Sensors', 'GPS', 1, 35.00, 'Holybro', 'https://holybro.com', 3, '{"accuracy": "1.5m"}'::jsonb),
    (v_part_ultrasonic_id, v_project_id, v_art_bom_id, 'HC-SR04 Ultrasonic Sensor', 'HCSR04', 'Sensors', 'Ultrasonic', 1, 3.00, 'Amazon', 'https://amazon.com', 2, '{"range": "400cm"}'::jsonb),
    (v_part_barometer_id, v_project_id, v_art_bom_id, 'BMP280 Barometer', 'BMP280', 'Sensors', 'Barometer', 1, 4.00, 'Adafruit', 'https://amazon.com', 2, '{"sensor": "barometric"}'::jsonb);


    -- 9. Insert connections table entries
    INSERT INTO connections (id, project_id, artifact_id, from_part_id, from_pin, to_part_id, to_pin, wire_color, wire_gauge, notes)
    VALUES
    (gen_random_uuid(), v_project_id, v_art_wiring_id, v_part_battery_id, 'XT60 Male', v_part_pdb_id, 'XT60 Female Input', 'Red', '14AWG', 'Main battery supply connection'),
    (gen_random_uuid(), v_project_id, v_art_wiring_id, v_part_pdb_id, 'ESC1 Pads', v_part_esc_1_id, 'Power Input Pads', 'Red/Black', '14AWG', 'Power to ESC 1'),
    (gen_random_uuid(), v_project_id, v_art_wiring_id, v_part_pdb_id, '5V BEC Output', v_part_pixhawk_id, 'POWER1 Port', 'Red/Black', '22AWG', 'Clean 5V power to Pixhawk'),
    (gen_random_uuid(), v_project_id, v_art_wiring_id, v_part_pixhawk_id, 'TELEM2 TX/RX', v_part_esp32_id, 'GPIO16/17 UART', 'Green/Yellow', '24AWG', 'MAVLink telemetry connection to ESP32 companion'),
    (gen_random_uuid(), v_project_id, v_art_wiring_id, v_part_pixhawk_id, 'GPS1 Port', v_part_gps_id, 'JST-GH connector', 'Multi-colored', '24AWG', 'GPS & Compass connection'),
    (gen_random_uuid(), v_project_id, v_art_wiring_id, v_part_pixhawk_id, 'AUX5/AUX6', v_part_ultrasonic_id, 'TRIG/ECHO', 'Yellow/Green', '22AWG', 'Ultrasonic sensor connection for obstacle avoidance');

    -- Log success information
    RAISE NOTICE 'Successfully created project, chat, session, and 12 messages';
    RAISE NOTICE 'Project ID: %', v_project_id;
    RAISE NOTICE 'Chat ID: %', v_chat_id;
    RAISE NOTICE 'Populated all 8 artifact types with artifact_versions, parts, and connections';
    
END $$;

COMMIT;
