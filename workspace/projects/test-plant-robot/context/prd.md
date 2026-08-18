# Product Requirements — ESP32 Plant Watering Robot

## 1. Product Summary
An ESP32-driven automated watering system for a single houseplant. The device continuously reads soil moisture, waters automatically when the soil is dry (with hysteresis), and shows its state on an OLED. A physical button lets the user water manually at any time. Later stretches add connectivity, logging, and multi-zone capability.

## 2. Goals / Non-Goals
### Goals
- Automatically keep one plant's soil within a healthy moisture band without user intervention for 24h+.
- Give clear visual feedback of moisture, pump state, and water level (MVP: moisture + pump state).
- Survive power cycling: thresholds and state persist sensibly (defaults are safe).
- Be safe to leave unattended: no water on electronics, no runaway pump.

### Non-Goals (v1)
- No mobile/rolling chassis, no camera, no app requirement.
- No WiFi dependency for core function — watering must work fully offline.
- No per-plant calibration profiles; a single global threshold set is fine.

## 3. Functional Requirements

### FR-1 Sensing
- ESP32 reads a soil moisture probe via analog input (with divider if probe is resistance-based).
- Sample and average N readings (e.g., 5 samples / 500ms) to suppress noise.
- Map raw ADC to a normalized dryness percentage used by decision logic.

### FR-2 Decision Logic
- Configurable dry/wet thresholds with **hysteresis band** (e.g., water when moisture < 30%, resume watering only after it rises above 45%).
- Watering dose = fixed pump-on duration per cycle (configurable, e.g., 3 s), with a **minimum time between cycles** (e.g., 30 min) to prevent over-watering.
- No over-watering: hard cap on waterings per hour/day.

### FR-3 Actuation
- Water pump (5V submersible, ~120–200 mA class) switched by the user's **5V relay module**.
- Relay driven by an ESP32 GPIO through the module's optocoupler input; IN pin active-low config noted in wiring.
- Power: pump fed from separate supply rail; ESP32 fed from USB or 5V rail per wiring doc.

### FR-4 Status Display
- SSD1306 OLED (I2C) shows: moisture %, pump state (IDLE/WATERING), next-cycle countdown, and error flags (probe open, pump jam timeout).

### FR-5 Manual Override
- Physical push button (debounced in firmware) triggers an immediate single watering cycle.
- Button also used for config mode (hold 3 s) in stretch — MVP uses short-press only.

### FR-6 Safety
- Pump run watchdog: if a cycle exceeds max duration, cut relay, raise error flag on OLED.
- Probe disconnected detection (reading pinned to rail) surfaces an error instead of constant watering.

## 4. Non-Functional Requirements
- **Platform**: ESP32, Arduino framework via PlatformIO (`code/src/main.cpp`).
- **Reliability**: pump cycles must not rely on WiFi; watchdog covers stuck relay.
- **Debugability**: serial logging of every state transition (D0 → D1 → W1...), timing constants at top of file.
- **Enclosure**: parametric OpenSCAD, fits 220×220 FDM bed, openings for probe cable, pump tube, and OLED.
- **Electrical**: documented in `wiring/wiring.json`; pinouts must match main.cpp; 3.3V vs 5V rail separation explicit.

## 5. Stretch Features (documented, not in MVP)
- **S1 WiFi dashboard**: Blynk / Home Assistant via MQTT — remote status + manual trigger.
- **S2 DHT22 logging**: ambient T/RH recorded alongside moisture to SD or cloud.
- **S3 Water-level sensor**: low-water alert + pump interlock.
- **S4 SG90 nozzle positioning**: servo aims the water stream; "robot" gains articulation.
- **S5 Multi-plant zones**: per-zone probe + shared pump with valve selection.

## 6. Acceptance Criteria (MVP)
1. Plant goes dry → device waters automatically within one poll cycle, relay clicks once, OLED shows WATERING.
2. Relay does not chatter at the threshold (hysteresis verified in serial log).
3. Button press triggers a watering cycle at any time.
4. Unplugged probe → OLED error, no pumping.
5. Power cycle → system resumes in safe idle, no phantom watering.
