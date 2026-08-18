# Project Context — ESP32 Plant Watering Robot

## Project ID
test-plant-robot

## The Ask
> "Design a plant watering robot with ESP32"

## Interpretation of "Robot"
The user is not asking for a mobile/rolling robot. We interpret "robot" as an **automated plant-watering system** built around an ESP32: it senses the environment, makes a decision, and acts on it. The decision pipeline is:

1. **Sense** — soil moisture probe reads the substrate dryness.
2. **Decide** — the ESP32 compares the reading against a configurable threshold (plus hysteresis to avoid relay chatter).
3. **Act** — a water pump (or valve) delivers a measured dose of water.
4. **Report** — the SSD1306 OLED shows live moisture, pump state, and system status.

This is a classic sense-decide-act feedback loop, which is exactly the semantics of a "robot" without wheels.

## User Profile (Intermediate Maker)
- Skills: can solder, uses a multimeter, comfortable on a breadboard with jumper wires.
- Fabrication: owns an FDM 3D printer with a **220 × 220 mm** build plate (constrains enclosure and mounting parts).
- Test gear: multimeter only — no oscilloscope or bench supply mentioned. Design for debug-friendly pin choices and on-board indicators.

### Known inventory (should be reused before buying new parts)
| Part | Status |
|---|---|
| ESP32 DevKit (preferred MCU) | assumed available |
| Resistors, capacitors, LEDs | available |
| 5V relay module | **available — reuse for pump/valve switching** |
| I2C OLED SSD1306 (128×64) | available — status display |
| DHT22 temperature/humidity | available — stretch goal |
| SG90 micro servos | available — stretch goal (nozzle aiming) |
| Breadboard + jumpers | available |

## Key Design Decisions (locked in at planning)
1. **Control switching**: use the user's existing **5V relay module** to switch the pump's power line. MOSFET is an alternative, but relay is in-hand and adequate for a small pump. Decide relay vs MOSFET finality in BOM.
2. **Threshold + hysteresis** logic instead of naive "wet/dry" — prevents the relay from clicking on/off rapidly at the boundary.
3. **Safety-first wiring**: pump powered from a separate supply rail (not the ESP32 5V pin); flyback considerations documented in wiring; manual override button always works.
4. **OLED as primary UI** in MVP; WiFi dashboards are a stretch goal, not required.
5. **Everything testable in stages**: breadboard first, pump dry-test with water bucket, then 3D-printed case.

## Deliverables in this project (per project rules)
| Artifact | Location |
|---|---|
| Bill of materials | `bom/bom.json` |
| Pinout + power wiring | `wiring/wiring.json` |
| Firmware (Arduino/PlatformIO) | `code/src/main.cpp` |
| Parametric enclosure (FDM ≤220×220) | `enclosure/case.scad` |
| Requirements | `context/prd.md` |
| MVP scope | `context/mvp.md` |
