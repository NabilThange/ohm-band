-- ============================================
-- Seed Fake Chat Continuation
-- Adds fake messages to chat: f05fabd8-947f-4a3c-94ee-0720ab9d48a9
-- Run: psql <connection_string> -f seed-fake-continuation.sql
-- Or execute via Supabase SQL Editor
-- ============================================

-- Message 11: User asks for wiring diagram and code
INSERT INTO messages (chat_id, sequence_number, role, content, agent_name, agent_model, intent, metadata)
VALUES (
  'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
  11,
  'user',
  'yes please! show me both the wiring diagram and the code',
  NULL,
  NULL,
  'FALLBACK',
  NULL
);

-- Message 12: AI responds with wiring diagram AND code (inline components via toolCalls)
INSERT INTO messages (chat_id, sequence_number, role, content, agent_name, agent_model, intent, metadata)
VALUES (
  'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
  12,
  'assistant',
  E'Perfect! Here''s your complete wiring diagram and Arduino code.

## 🔌 Wiring Connections

I''ve created a detailed wiring diagram showing all connections. The diagram includes:

- **I2C Bus** (LCD + DS3231): Both share SDA (A4) and SCL (A5) pins
- **DHT11 Sensor**: Connected to Digital Pin 2
- **Power Distribution**: 5V and GND rails

You can view the full interactive diagram with wire colors and connection table in the wiring drawer above.

---

## 💻 Arduino Code

Here''s your complete firmware with temperature sensing, RTC, and LCD display:

```cpp
// temperature_monitor.ino
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <RTClib.h>

// Pin Definitions
#define DHTPIN 2
#define DHTTYPE DHT11

// Initialize components
LiquidCrystal_I2C lcd(0x27, 16, 2);  // I2C address 0x27 (try 0x3F if not working)
DHT dht(DHTPIN, DHTTYPE);
RTC_DS3231 rtc;

void setup() {
  Serial.begin(9600);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Temp Monitor");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");
  delay(2000);
  
  // Initialize DHT
  dht.begin();
  
  // Initialize RTC
  if (!rtc.begin()) {
    lcd.clear();
    lcd.print("RTC Error!");
    while (1);
  }
  
  // Set time (run once, then comment out)
  // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  
  lcd.clear();
}

void loop() {
  // Read temperature
  float temp = dht.readTemperature();
  
  // Read time
  DateTime now = rtc.now();
  
  // Check for sensor error
  if (isnan(temp)) {
    lcd.setCursor(0, 0);
    lcd.print("Sensor Error!   ");
    delay(2000);
    return;
  }
  
  // Display temperature on Line 1
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temp, 1);
  lcd.print((char)223);  // Degree symbol
  lcd.print("C  ");
  
  // Display time on Line 2
  lcd.setCursor(0, 1);
  if (now.hour() < 10) lcd.print("0");
  lcd.print(now.hour());
  lcd.print(":");
  if (now.minute() < 10) lcd.print("0");
  lcd.print(now.minute());
  lcd.print(" ");
  lcd.print(now.day());
  lcd.print("/");
  lcd.print(now.month());
  
  delay(2000);  // Update every 2 seconds
}
```

The code is ready to upload! Make sure you:
1. Install libraries: `LiquidCrystal_I2C`, `DHT sensor library`, `RTClib`
2. Set the time once by uncommenting line 43
3. Upload to your Arduino Uno

---

## 📚 What''s Included

✅ **Wiring Diagram** - Visual schematic with all connections  
✅ **Arduino Code** - Complete sketch with comments  
✅ **BOM** - Parts list (already created)  

Need help with the enclosure next?',
  'codeGenerator',
  NULL,
  'FALLBACK',
  '{
    "toolCalls": [
      {
        "name": "write",
        "arguments": {
          "artifact_type": "wiring",
          "content": {
            "components": [
              {"id": "arduino", "name": "Arduino Uno", "type": "microcontroller"},
              {"id": "lcd", "name": "16x2 LCD + I2C Backpack", "type": "display"},
              {"id": "dht11", "name": "DHT11 Sensor", "type": "sensor"},
              {"id": "rtc", "name": "DS3231 RTC", "type": "timekeeping"}
            ],
            "connections": [
              {"from": "arduino", "from_pin": "5V", "to": "lcd", "to_pin": "VCC", "wire_color": "red", "notes": "Power for LCD"},
              {"from": "arduino", "from_pin": "GND", "to": "lcd", "to_pin": "GND", "wire_color": "black", "notes": "Ground for LCD"},
              {"from": "arduino", "from_pin": "A4", "to": "lcd", "to_pin": "SDA", "wire_color": "green", "notes": "I2C data line (shared with RTC)"},
              {"from": "arduino", "from_pin": "A5", "to": "lcd", "to_pin": "SCL", "wire_color": "blue", "notes": "I2C clock line (shared with RTC)"},
              {"from": "arduino", "from_pin": "5V", "to": "rtc", "to_pin": "VCC", "wire_color": "red", "notes": "Power for RTC"},
              {"from": "arduino", "from_pin": "GND", "to": "rtc", "to_pin": "GND", "wire_color": "black", "notes": "Ground for RTC"},
              {"from": "arduino", "from_pin": "A4", "to": "rtc", "to_pin": "SDA", "wire_color": "green", "notes": "I2C data line (shared with LCD)"},
              {"from": "arduino", "from_pin": "A5", "to": "rtc", "to_pin": "SCL", "wire_color": "blue", "notes": "I2C clock line (shared with LCD)"},
              {"from": "arduino", "from_pin": "5V", "to": "dht11", "to_pin": "VCC", "wire_color": "red", "notes": "Power for DHT11"},
              {"from": "arduino", "from_pin": "GND", "to": "dht11", "to_pin": "GND", "wire_color": "black", "notes": "Ground for DHT11"},
              {"from": "arduino", "from_pin": "D2", "to": "dht11", "to_pin": "DATA", "wire_color": "yellow", "notes": "DHT11 data signal"}
            ],
            "instructions": "## Wiring Instructions\n\n### I2C Bus Connections (LCD + RTC)\n1. Connect Arduino **5V** → LCD VCC and RTC VCC (red wires)\n2. Connect Arduino **GND** → LCD GND and RTC GND (black wires)\n3. Connect Arduino **A4 (SDA)** → LCD SDA and RTC SDA (green wires)\n4. Connect Arduino **A5 (SCL)** → LCD SCL and RTC SCL (blue wires)\n\n### DHT11 Sensor\n5. Connect Arduino **5V** → DHT11 VCC (red wire)\n6. Connect Arduino **GND** → DHT11 GND (black wire)\n7. Connect Arduino **D2** → DHT11 DATA (yellow wire)\n\n### Important Notes\n- **I2C addresses**: LCD = 0x27 or 0x3F, RTC = 0x68\n- **Total wires**: Only 11 connections needed\n- **CR2032 battery**: Install in DS3231 before first use\n- **DHT11 reading**: Wait 2 seconds between reads\n\n### Testing\n1. Upload I2C scanner sketch to find LCD address\n2. Test each component individually\n3. Upload final code",
            "warnings": [
              "Unplug USB before making any wiring changes",
              "Double-check I2C addresses - LCD might be 0x27 or 0x3F",
              "Install CR2032 battery in RTC module before powering on",
              "DHT11 requires 2+ seconds between reads or returns garbage data"
            ]
          }
        }
      },
      {
        "name": "write",
        "arguments": {
          "artifact_type": "code",
          "path": "temperature_monitor.ino",
          "language": "cpp",
          "content": "// Room Temperature Desk Gadget\n// Displays temperature and time on 16x2 LCD\n// Hardware: Arduino Uno, DHT11, DS3231 RTC, I2C LCD\n\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n#include <DHT.h>\n#include <RTClib.h>\n\n// ===== Pin Definitions =====\n#define DHTPIN 2        // DHT11 data pin connected to D2\n#define DHTTYPE DHT11   // DHT11 sensor type\n\n// ===== Component Initialization =====\n// LCD: I2C address 0x27 (16 chars x 2 lines)\n// If LCD doesn''t work, try 0x3F instead\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\n// DHT Sensor\nDHT dht(DHTPIN, DHTTYPE);\n\n// Real-Time Clock\nRTC_DS3231 rtc;\n\n// ===== Setup Function =====\nvoid setup() {\n  Serial.begin(9600);\n  Serial.println(\"Temperature Desk Gadget Starting...\");\n  \n  // Initialize LCD\n  lcd.init();\n  lcd.backlight();\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"Temp Monitor\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Starting...\");\n  delay(2000);\n  \n  // Initialize DHT11 sensor\n  dht.begin();\n  Serial.println(\"DHT11 initialized\");\n  \n  // Initialize RTC\n  if (!rtc.begin()) {\n    Serial.println(\"ERROR: RTC not found!\");\n    lcd.clear();\n    lcd.setCursor(0, 0);\n    lcd.print(\"RTC Error!\");\n    lcd.setCursor(0, 1);\n    lcd.print(\"Check wiring\");\n    while (1);  // Halt if RTC not found\n  }\n  \n  Serial.println(\"RTC initialized\");\n  \n  // ===== IMPORTANT: Set RTC Time (Run Once) =====\n  // Uncomment the next line ONCE to set the time, then re-comment and re-upload\n  // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));\n  // This sets the RTC to the compile time of this sketch\n  \n  // Check if RTC lost power and needs reset\n  if (rtc.lostPower()) {\n    Serial.println(\"WARNING: RTC lost power, time may be incorrect!\");\n    lcd.clear();\n    lcd.print(\"RTC needs time\");\n    lcd.setCursor(0, 1);\n    lcd.print(\"set! See code\");\n    delay(3000);\n  }\n  \n  lcd.clear();\n  Serial.println(\"Setup complete!\");\n}\n\n// ===== Main Loop =====\nvoid loop() {\n  // Read temperature from DHT11\n  float temp = dht.readTemperature();  // Celsius\n  float humidity = dht.readHumidity();\n  \n  // Read current time from RTC\n  DateTime now = rtc.now();\n  \n  // Check if sensor read failed\n  if (isnan(temp) || isnan(humidity)) {\n    Serial.println(\"ERROR: Failed to read from DHT sensor!\");\n    lcd.clear();\n    lcd.setCursor(0, 0);\n    lcd.print(\"Sensor Error!\");\n    lcd.setCursor(0, 1);\n    lcd.print(\"Check DHT11\");\n    delay(2000);\n    return;  // Skip this iteration\n  }\n  \n  // Print to Serial Monitor for debugging\n  Serial.print(\"Temp: \");\n  Serial.print(temp, 1);\n  Serial.print(\"C | Time: \");\n  Serial.print(now.hour());\n  Serial.print(\":\");\n  Serial.println(now.minute());\n  \n  // ===== Display on LCD =====\n  \n  // Line 1: Temperature\n  lcd.setCursor(0, 0);\n  lcd.print(\"Temp: \");\n  lcd.print(temp, 1);            // 1 decimal place\n  lcd.print((char)223);          // Degree symbol (°)\n  lcd.print(\"C  \");              // Extra spaces to clear previous text\n  \n  // Line 2: Time and Date\n  lcd.setCursor(0, 1);\n  \n  // Hour (with leading zero)\n  if (now.hour() < 10) lcd.print(\"0\");\n  lcd.print(now.hour());\n  lcd.print(\":\");\n  \n  // Minute (with leading zero)\n  if (now.minute() < 10) lcd.print(\"0\");\n  lcd.print(now.minute());\n  lcd.print(\" \");\n  \n  // Date (DD/MM format)\n  if (now.day() < 10) lcd.print(\"0\");\n  lcd.print(now.day());\n  lcd.print(\"/\");\n  if (now.month() < 10) lcd.print(\"0\");\n  lcd.print(now.month());\n  \n  // Wait 2 seconds before next reading\n  // DHT11 requires minimum 2 seconds between reads\n  delay(2000);\n}\n\n// ===== Additional Functions (Optional) =====\n\n// Function to convert Celsius to Fahrenheit\nfloat celsiusToFahrenheit(float celsius) {\n  return (celsius * 9.0 / 5.0) + 32.0;\n}\n\n// Note: You can extend this code to:\n// - Toggle between °C and °F with a button\n// - Add humidity display\n// - Add temperature threshold alerts\n// - Add auto-dimming backlight based on time\n"
        }
      }
    ]
  }'::jsonb
);

-- Message 13: User asks for 3D enclosure
INSERT INTO messages (chat_id, sequence_number, role, content, agent_name, agent_model, intent, metadata)
VALUES (
  'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
  13,
  'user',
  'awesome! can you design a 3D enclosure for this?',
  NULL,
  NULL,
  'FALLBACK',
  NULL
);

-- Message 14: AI responds with 3D enclosure (OpenSCAD files)
INSERT INTO messages (chat_id, sequence_number, role, content, agent_name, agent_model, intent, metadata)
VALUES (
  'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
  14,
  'assistant',
  E'Perfect timing! I''ll design a simple enclosure for your desk gadget.

## 📦 3D Printable Enclosure

I''ve created a modular enclosure design with:

- **Main Box**: Holds Arduino, breadboard, and components
- **LCD Mount**: Front-facing cutout for the 16x2 display
- **Sensor Vents**: Openings for DHT11 temperature accuracy
- **USB Access**: Side cutout for cable
- **Snap-Fit Lid**: No screws needed (or add M3 screw holes if you prefer)

### Print Settings
- **Material**: PLA or PETG
- **Layer Height**: 0.2mm
- **Infill**: 20%
- **Supports**: Not needed (designed for printability)
- **Print Time**: ~3-4 hours total

You can view the OpenSCAD source code and customize dimensions in the enclosure drawer above. The design is parametric, so you can easily adjust sizes!

### Assembly
1. Print base and lid
2. Insert breadboard (it should friction-fit)
3. Mount LCD in front cutout
4. Route DHT11 sensor wire through vent hole
5. Snap lid on top

Want me to adjust any dimensions or add mounting holes?',
  'enclosureDesigner',
  NULL,
  'FALLBACK',
  '{
    "toolCalls": [
      {
        "name": "write",
        "arguments": {
          "artifact_type": "enclosure",
          "content": {
            "files": [
              {
                "path": "enclosure_base.scad",
                "language": "openscad",
                "content": "// Temperature Monitor Enclosure - Base\n// Designed for Arduino Uno + 16x2 LCD + DHT11\n// Print settings: 0.2mm layer, 20% infill, no supports\n\n// ===== Parameters (adjust to fit your build) =====\nbox_width = 120;        // Internal width\nbox_depth = 80;         // Internal depth\nbox_height = 40;        // Internal height\nwall_thickness = 2.5;   // Wall thickness\n\n// LCD cutout (16x2 with I2C backpack)\nlcd_width = 80;\nlcd_height = 36;\nlcd_offset_x = 20;      // Center LCD on front face\nlcd_offset_z = 15;      // Height from bottom\n\n// USB cable cutout\nusb_width = 12;\nusb_height = 11;\nusb_offset_y = 30;      // Position on side\nusb_offset_z = 8;       // Height from bottom\n\n// Ventilation holes for DHT11\nvent_diameter = 8;\nvent_spacing = 15;\n\n// ===== Modules =====\n\nmodule rounded_cube(size, radius) {\n    hull() {\n        translate([radius, radius, 0])\n            cylinder(r=radius, h=size[2]);\n        translate([size[0]-radius, radius, 0])\n            cylinder(r=radius, h=size[2]);\n        translate([radius, size[1]-radius, 0])\n            cylinder(r=radius, h=size[2]);\n        translate([size[0]-radius, size[1]-radius, 0])\n            cylinder(r=radius, h=size[2]);\n    }\n}\n\nmodule base_box() {\n    difference() {\n        // Outer shell\n        rounded_cube([\n            box_width + 2*wall_thickness,\n            box_depth + 2*wall_thickness,\n            box_height + wall_thickness\n        ], 3);\n        \n        // Inner cavity\n        translate([wall_thickness, wall_thickness, wall_thickness])\n            cube([box_width, box_depth, box_height + 1]);\n        \n        // LCD cutout (front face)\n        translate([lcd_offset_x + wall_thickness, -1, lcd_offset_z + wall_thickness])\n            cube([lcd_width, wall_thickness + 2, lcd_height]);\n        \n        // USB cable cutout (left side)\n        translate([-1, usb_offset_y + wall_thickness, usb_offset_z + wall_thickness])\n            cube([wall_thickness + 2, usb_width, usb_height]);\n        \n        // Ventilation holes (back face) for DHT11\n        for (i = [0:2]) {\n            translate([\n                box_width/2 - vent_spacing + i*vent_spacing + wall_thickness,\n                box_depth + 2*wall_thickness - 1,\n                box_height/2 + wall_thickness\n            ])\n            rotate([90, 0, 0])\n                cylinder(d=vent_diameter, h=wall_thickness + 2);\n        }\n    }\n    \n    // Internal mounting posts for Arduino\n    post_height = 5;\n    post_diameter = 6;\n    \n    // Arduino Uno mounting hole positions (relative to corner)\n    arduino_holes = [\n        [14, 2.5],\n        [66, 7.5],\n        [66, 35.5],\n        [15.5, 50.5]\n    ];\n    \n    for (hole = arduino_holes) {\n        translate([hole[0] + wall_thickness + 10, hole[1] + wall_thickness + 10, wall_thickness])\n            cylinder(d=post_diameter, h=post_height);\n    }\n}\n\n// ===== Render =====\nbase_box();",
                "description": "Main enclosure base with LCD cutout, USB access, and ventilation"
              },
              {
                "path": "enclosure_lid.scad",
                "language": "openscad",
                "content": "// Temperature Monitor Enclosure - Lid\n// Snap-fit design (or add M3 screw holes)\n\n// ===== Parameters (must match base.scad) =====\nbox_width = 120;\nbox_depth = 80;\nwall_thickness = 2.5;\nlid_thickness = 2.5;\n\n// Snap-fit tabs\ntab_width = 15;\ntab_depth = 3;\ntab_height = 4;\n\n// ===== Modules =====\n\nmodule rounded_cube(size, radius) {\n    hull() {\n        translate([radius, radius, 0])\n            cylinder(r=radius, h=size[2]);\n        translate([size[0]-radius, radius, 0])\n            cylinder(r=radius, h=size[2]);\n        translate([radius, size[1]-radius, 0])\n            cylinder(r=radius, h=size[2]);\n        translate([size[0]-radius, size[1]-radius, 0])\n            cylinder(r=radius, h=size[2]);\n    }\n}\n\nmodule lid() {\n    difference() {\n        union() {\n            // Main lid plate\n            rounded_cube([\n                box_width + 2*wall_thickness,\n                box_depth + 2*wall_thickness,\n                lid_thickness\n            ], 3);\n            \n            // Inner lip (fits inside box)\n            translate([wall_thickness + 0.2, wall_thickness + 0.2, lid_thickness])\n                difference() {\n                    cube([box_width - 0.4, box_depth - 0.4, 8]);\n                    translate([wall_thickness - 0.2, wall_thickness - 0.2, 0])\n                        cube([box_width - 2*wall_thickness + 0.4, box_depth - 2*wall_thickness + 0.4, 8 + 1]);\n                }\n            \n            // Snap-fit tabs (4 corners)\n            for (x = [0, 1]) {\n                for (y = [0, 1]) {\n                    translate([\n                        x * (box_width + 2*wall_thickness - tab_width),\n                        y * (box_depth + 2*wall_thickness - tab_width),\n                        lid_thickness + 3\n                    ])\n                    cube([tab_width, tab_width, tab_height]);\n                }\n            }\n        }\n        \n        // Optional: Label text on top\n        translate([box_width/2 + wall_thickness, box_depth/2 + wall_thickness, lid_thickness - 0.5])\n            linear_extrude(1)\n                text(\"TEMP\", size=10, halign=\"center\", valign=\"center\", font=\"Arial:style=Bold\");\n    }\n}\n\n// ===== Render =====\nlid();",
                "description": "Snap-fit lid with internal lip"
              },
              {
                "path": "enclosure_combined.scad",
                "language": "openscad",
                "content": "// Combined view for visualization (not for printing)\n// Use enclosure_base.scad and enclosure_lid.scad separately for printing\n\nuse <enclosure_base.scad>\nuse <enclosure_lid.scad>\n\n// Show base\nbase_box();\n\n// Show lid (lifted up for visualization)\ntranslate([0, 0, 50])\n    lid();",
                "description": "Combined visualization (not for printing)"
              },
              {
                "path": "README.md",
                "language": "markdown",
                "content": "# Temperature Monitor Enclosure\n\n3D printable enclosure for Arduino-based temperature monitor with LCD display.\n\n## Files\n\n- `enclosure_base.scad` - Main box with LCD cutout, USB access, ventilation\n- `enclosure_lid.scad` - Snap-fit lid\n- `enclosure_combined.scad` - Visualization only (do not print)\n\n## Print Instructions\n\n### Settings\n- **Material**: PLA or PETG\n- **Layer Height**: 0.2mm\n- **Infill**: 20%\n- **Supports**: None needed\n- **Print Orientation**: Base prints upright, lid prints flat\n\n### Print Time\n- Base: ~2.5 hours\n- Lid: ~1 hour\n- Total: ~3.5 hours\n\n### Filament Usage\n- Base: ~30g\n- Lid: ~15g\n- Total: ~45g\n\n## Assembly\n\n1. **Print both parts** (base and lid separately)\n2. **Insert breadboard** into base cavity (should friction-fit)\n3. **Mount LCD** in front cutout (may need small amount of hot glue)\n4. **Route wiring** - DHT11 sensor wire through back ventilation\n5. **Close lid** - Snap-fit tabs hold it in place (or add M3 screws if preferred)\n\n## Customization\n\nAll dimensions are parametric at the top of each `.scad` file:\n\n```openscad\nbox_width = 120;        // Adjust for your build\nbox_depth = 80;\nbox_height = 40;\nwall_thickness = 2.5;\n```\n\nEdit these values in OpenSCAD to resize the enclosure.\n\n## Software\n\n- Download [OpenSCAD](https://openscad.org/) (free, open-source)\n- Open `.scad` files to view/edit\n- Export STL: Design → Render (F6) → Export → STL\n\n## Tips\n\n- **Tight fit?** Increase clearance by 0.2-0.3mm in parameters\n- **Want screws?** Add M3 mounting holes in corners (uncomment screw_holes module)\n- **Need handles?** Add finger cutouts on sides of lid\n- **Ventilation:** Back holes allow airflow for accurate temp readings\n",
                "description": "Assembly instructions and customization guide"
              }
            ]
          }
        }
      }
    ]
  }'::jsonb
);

-- ============================================
-- Verification Query
-- Run this to confirm messages were added:
-- SELECT sequence_number, role, agent_name, LEFT(content, 50) 
-- FROM messages 
-- WHERE chat_id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9' 
-- ORDER BY sequence_number;
-- ============================================
