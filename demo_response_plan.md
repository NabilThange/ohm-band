user: I want to build a DIY autonomous drone that can patrol my farm, stream video to my phone, and return to its charging station automatically.

then the title becomes "Farm Patrol Autonomous Drone Build"

and then projectinttilaizor fake repsonse comes:
"🎯 MVP Created: Farm Patrol Autonomous Drone
I've analyzed your requirements and created a Minimum Viable Product specification for your autonomous agricultural monitoring drone.

📋 Project Vision
Build a semi-autonomous agricultural monitoring drone capable of:

✅ Flying predefined patrol routes using GPS waypoints ✅ Streaming live 1080p video to your mobile phone ✅ Detecting obstacles and avoiding collisions ✅ Automatically returning home when battery is low ✅ Docking with a charging station for autonomous operation

🎯 MVP Scope
✅ Included in MVP
Feature	Description	Priority
GPS Navigation	Waypoint-based autonomous flight	Critical
Live Video Streaming	1080p video over WiFi to mobile app	Critical
Return To Home (RTH)	Automatic return at low battery	Critical
Battery Monitoring	Real-time voltage and percentage	High
Mobile Dashboard	Android/iOS app for control	High
Obstacle Detection	Basic sonar-based avoidance	Medium
Auto-Charging Dock	Precision landing and charging	Medium
📊 Success Criteria
Metric	Target	Measurement Method
Flight Time	20+ minutes	Battery discharge test
Video Latency	<300ms	Stream timestamp analysis
GPS Accuracy	<2 meters	Position logging comparison
RTH Success Rate	>95%	20 autonomous test flights
Total Cost	<$350	Complete BOM summation
🛠️ Technology Stack
Hardware:

Flight Controller: Pixhawk 6C (ArduPilot firmware)
Companion Computer: ESP32-S3 (WiFi streaming)
GPS: u-blox M9N with compass
Camera: Raspberry Pi Camera Module 3
Motors: 920KV brushless (4x)
Software:

Firmware: ArduCopter 4.5+
Mobile App: React Native (iOS/Android)
Communication: MAVLink protocol
Video: RTSP streaming over UDP
Would you like me to proceed with the PRD?

Open context Drawer ->"
with tool calls paralley to open the drawer of context , and MVP and write in it this things :

Project Context :
Technical Architecture: Farm Patrol Autonomous Drone
System Overview
The drone is built around a dual-brain architecture: the Pixhawk 6C handles all safety-critical flight control (attitude, altitude, GPS hold, RTH), while the ESP32-S3 companion computer manages higher-level tasks (video streaming, Wi-Fi connectivity, telemetry relay, sensor fusion).

Communication between the two brains is via MAVLink 2.0 over UART at 57,600 baud — the industry-standard protocol for drone telemetry.

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
Hardware Layer
Flight Controller — Pixhawk 6C
Firmware: ArduCopter 4.5.x (stable)
IMU: Dual ICM-42688-P (6-axis) with vibration isolation
Barometer: Internal + external BMP280 for redundancy
Interfaces: 8× PWM MAIN OUT, TELEM1/2, GPS1/2, I2C, CAN, SPI
Safety: Hardware kill switch, buzzer, RGB LED status indicator
Companion Computer — ESP32-S3
Role: Camera capture, Wi-Fi AP, MAVLink bridge, OSD overlay
Camera: RPi Camera Module 3 via MIPI-CSI → internal JPEG encoder
Streaming: MJPEG over HTTP on port 80 and WebSocket on port 81
MAVLink: Parses HEARTBEAT, SYS_STATUS, GPS_RAW_INT, ATTITUDE
Power Architecture
Battery (14.8 V nominal) 
  → Power Module (current + voltage sensing → Pixhawk ADC)
  → PDB (distributes raw VBAT to 4× ESCs)
  → ESC integrated 5 V / 3 A BEC → Pixhawk POWER1
  → Separate 3.3 V LDO on ESP32 DevKit
Propulsion
Frame: 450 mm carbon fibre X-quad
Motors: 920 KV brushless, 188 W max each → 752 W total
ESCs: BLHeli_32 30 A, DSHOT600 capable
Props: 10 × 4.5 carbon fibre, CW/CCW matched pairs
Max thrust: ~1,800 g per motor → 7,200 g total vs ~1,100 g AUW
Theoretical hover: ~36 % throttle → ~22 min flight time
Software Stack
Layer	Component	Version
Flight Firmware	ArduCopter	4.5.x
Ground Station	QGroundControl	Latest stable
ESP32 Framework	Arduino / PlatformIO	ESP-IDF 5.2
MAVLink Library	mavlink/c_library_v2	2.0
Camera Driver	esp32-camera	2.0.x
OTA Updates	ArduinoOTA	Built-in
Network Architecture
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
Calibration & Pre-flight Checklist
Accelerometer calibration — flat + 5-orientation in QGC
Compass calibration — outdoor, away from metal structures
ESC calibration — BLHeli_32 Suite via USB
Radio calibration — if using manual RC override
Mission upload — via QGC Plan view, verify fence boundaries
Motor test — low-throttle spin-up, check rotation directions
Prop clearance check — minimum 20 mm tip-to-frame
Battery voltage verify — ≥ 15.8 V before takeoff (4S full = 16.8 V)

MVP:
🚁 MVP: Farm Patrol Autonomous Drone
What We're Building
A fully autonomous agricultural surveillance drone that eliminates the need for manual farm inspections. The system flies pre-programmed GPS patrol routes, streams real-time 1080p video to your smartphone, avoids obstacles intelligently, and returns home to recharge — all without you touching a controller.

Core Capabilities
🛰️ Autonomous Navigation
Pre-load GPS waypoint missions via QGroundControl or the companion mobile app. The drone follows the route precisely using the u-blox M9N GPS (1.5 m CEP accuracy), adjusts altitude based on BMP280 barometer readings, and handles wind disturbances through the Pixhawk 6C's tuned PID loop.

📸 Live Video Streaming
The onboard Raspberry Pi Camera Module 3 delivers 1080p30 video over a dedicated 2.4 GHz Wi-Fi hotspot hosted by the ESP32-S3. Range is ~150 m in open fields. Footage is also written to a 32 GB MicroSD for later review.

🔋 Smart Battery Management
Continuous voltage monitoring via the Holybro Power Module. At 30 % charge the drone emits a low-battery warning. At 20 % it autonomously triggers Return-to-Home (RTH), lands, and waits for reconnection. No more dead-on-the-spot landings.

🛑 Obstacle Avoidance
Forward-facing HC-SR04 ultrasonic sensor feeds real-time distance data to the Pixhawk companion computer. Objects detected within 2 m trigger a halt-and-hover, followed by an automatic route re-plan or pilot alert.

🏠 Autonomous Recharging (Phase 2)
A 3D-printed landing dock with spring-contact charging pads enables unattended battery replenishment. The drone aligns using IR landing beacons and descends onto the contact plate for hands-free charging.

Why This Matters
Problem	Manual Inspection	Farm Patrol Drone
Time per 10-acre scan	~2 hours on foot	~12 minutes
Crop stress detection	Ground-level only	Aerial + thermal (Phase 2)
Irrigation leak visibility	Near-zero	High — overhead view
Livestock head count	Slow and error-prone	Automated via CV (Phase 2)
Cost per inspection	Labour @ ₹500/hr	~₹3 amortised electricity
Phased Rollout
Phase 1 — MVP (This Build): Autonomous waypoint flight, live video, RTH, obstacle avoidance, manual charging. Budget: ₹25,800 (~$308).

Phase 2 — Auto-Charge: Docking station, contact-pad charging, extended route planning. Estimated additional cost: ~$80.

Phase 3 — Precision Ag: Multispectral NDVI camera, AI-driven crop stress heatmaps, integration with farm management software.

Success Criteria for MVP Sign-Off
✅ Completes a 10-waypoint GPS loop with < 2 m deviation at each point
✅ Streams video at ≥ 720p30 with < 300 ms latency
✅ RTH triggers reliably at 20 % battery in all test flights
✅ Obstacle halt activates within 500 ms of detection
✅ Total build cost does not exceed $350