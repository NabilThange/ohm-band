# MVP Scope — ESP32 Plant Watering Robot

## Definition of Done (MVP)
A single plant is kept watered automatically by an ESP32 using a soil moisture probe, a 5V relay switching a submersible pump, an SSD1306 OLED status display, and a manual override button. No WiFi. No servo. One zone.

## In Scope (must ship)

### Hardware
- ESP32 DevKit (module of user's choice; pin mapping fixed in `wiring/wiring.json`).
- Capacitive or resistive soil moisture probe (type locked in BOM; resistive needs a voltage divider documented in wiring).
- 5V submersible pump (small DC, e.g., 3–5 V, ≤ ~300 mA) + silicone tubing.
- **User's 5V relay module** as the pump switch (in-hand inventory reused).
- SSD1306 OLED 128×64, I2C (user inventory) for status.
- Tactile push button (manual override) with pull-up + RC debounce.
- Breadboard + jumpers for bring-up; pump powered from its own 5V rail (never from the ESP32 5V pin).
- Power: single 5V supply (USB charger or PSU) with shared GND; ESP32 from 5V/VIN or its own USB per wiring decision.

### Firmware (`code/src/main.cpp`, Arduino/PlatformIO)
- Modular: `sensor.h/.cpp` (moisture sampling + averaging), `pump.h/.cpp` (relay control + watchdog), `display.h/.cpp` (OLED render), `logic.h/.cpp` (threshold + hysteresis state machine), `main.cpp` (wiring it together).
- Config constants at top: DRY_THRESHOLD=30, WET_THRESHOLD=45, PUMP_ON_MS=3000, MIN_CYCLE_GAP_MS=30min, ADC_PIN, RELAY_PIN, BUTTON_PIN, I2C pins.
- States: `IDLE → PUMPING → COOLDOWN`, plus `ERROR` (probe fault / pump timeout).
- Serial logging of every transition; OLED mirrors state.
- Debounced button → one immediate watering cycle.

### Wiring (`wiring/wiring.json`)
- Full pin map (ESP32 GPIO ↔ probe, relay IN, button, OLED SDA/SCL/VCC/GND) matching main.cpp.
- Power rail map: logic 3.3V, relay coil 5V, pump 5V; explicit GND common point.
- Relay active-low vs active-high resolved and documented.

### Enclosure (`enclosure/case.scad`)
- Parametric: box sized from component dimensions (ESP32, relay, pump mount slot, OLED window, button hole, probe cable gland, tube exit).
- Fits 220×220 FDM bed; printed in parts (base + lid), holes for airflow and wiring.
- Pump may live outside the case inside the water reservoir; case holds electronics only.

### BOM (`bom/bom.json`)
- Every component + quantities + reuse-vs-buy flag, priced. Relay and OLED marked "in inventory".

## Out of Scope for MVP (stretch, tracked in prd.md §5)
- WiFi/Blynk/Home Assistant/MQTT dashboard.
- DHT22 logging.
- Water-level sensor + interlock.
- SG90 nozzle aiming.
- Multi-plant zones.

## MVP Build Sequence (for the builder agent)
1. Breadboard the ESP32 + OLED I2C scan; confirm display draws text.
2. Add probe on ADC; log raw and normalized values to serial.
3. Wire relay + pump with separate 5V rail; test manual pump trigger via serial command.
4. Implement threshold + hysteresis state machine; verify no chatter on wet/dry transitions.
5. Add button override; verify debounce and immediate watering.
6. Dry-run full loop over a simulated moisture input; confirm watchdog and error paths.
7. Print parametric case, assemble, final acceptance test per prd.md §6.

## MVP Exit Criteria
All six acceptance criteria in `context/prd.md` §6 pass on the real breadboard build; `bom/bom.json`, `wiring/wiring.json`, `code/src/main.cpp`, and `enclosure/case.scad` are complete and consistent with each other.
