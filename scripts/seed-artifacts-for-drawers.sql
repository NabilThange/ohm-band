-- ============================================
-- Create Artifacts for Drawers
-- This adds the actual artifact data so drawers display content
-- Chat ID: f05fabd8-947f-4a3c-94ee-0720ab9d48a9
-- ============================================

-- Step 1: Get or create project for this chat
DO $$
DECLARE
    v_project_id UUID;
    v_chat_id UUID := 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9';
BEGIN
    -- Check if chat already has a project
    SELECT project_id INTO v_project_id FROM chats WHERE id = v_chat_id;
    
    -- If no project, create one
    IF v_project_id IS NULL THEN
        INSERT INTO projects (name, description, category, status, target_budget, current_estimated_cost)
        VALUES (
            'Room Temperature Desk Gadget',
            'Arduino-based temperature monitor with LCD display and RTC',
            'IoT',
            'active',
            35.00,
            37.00
        )
        RETURNING id INTO v_project_id;
        
        -- Link project to chat
        UPDATE chats SET project_id = v_project_id WHERE id = v_chat_id;
        
        RAISE NOTICE 'Created project: %', v_project_id;
    ELSE
        RAISE NOTICE 'Using existing project: %', v_project_id;
    END IF;
END $$;

-- Step 2: Create Wiring Artifact
INSERT INTO artifacts (chat_id, project_id, type, title, current_version)
SELECT 
    'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
    project_id,
    'wiring',
    'Wiring Diagram',
    1
FROM chats WHERE id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9'
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 3: Create Wiring Artifact Version
INSERT INTO artifact_versions (artifact_id, version_number, content, content_json, change_summary)
SELECT 
    a.id,
    1,
    '## Wiring Instructions

### I2C Bus Connections (LCD + RTC)
1. Connect Arduino **5V** → LCD VCC and RTC VCC (red wires)
2. Connect Arduino **GND** → LCD GND and RTC GND (black wires)
3. Connect Arduino **A4 (SDA)** → LCD SDA and RTC SDA (green wires)
4. Connect Arduino **A5 (SCL)** → LCD SCL and RTC SCL (blue wires)

### DHT11 Sensor
5. Connect Arduino **5V** → DHT11 VCC (red wire)
6. Connect Arduino **GND** → DHT11 GND (black wire)
7. Connect Arduino **D2** → DHT11 DATA (yellow wire)

### Important Notes
- **I2C addresses**: LCD = 0x27 or 0x3F, RTC = 0x68
- **Total wires**: Only 11 connections needed
- **CR2032 battery**: Install in DS3231 before first use
- **DHT11 reading**: Wait 2 seconds between reads',
    jsonb_build_object(
        'components', jsonb_build_array(
            jsonb_build_object('id', 'arduino', 'name', 'Arduino Uno', 'type', 'microcontroller'),
            jsonb_build_object('id', 'lcd', 'name', '16x2 LCD + I2C Backpack', 'type', 'display'),
            jsonb_build_object('id', 'dht11', 'name', 'DHT11 Sensor', 'type', 'sensor'),
            jsonb_build_object('id', 'rtc', 'name', 'DS3231 RTC', 'type', 'timekeeping')
        ),
        'connections', jsonb_build_array(
            jsonb_build_object('from', 'arduino', 'from_pin', '5V', 'to', 'lcd', 'to_pin', 'VCC', 'wire_color', 'red', 'notes', 'Power for LCD'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'GND', 'to', 'lcd', 'to_pin', 'GND', 'wire_color', 'black', 'notes', 'Ground for LCD'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'A4', 'to', 'lcd', 'to_pin', 'SDA', 'wire_color', 'green', 'notes', 'I2C data line (shared with RTC)'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'A5', 'to', 'lcd', 'to_pin', 'SCL', 'wire_color', 'blue', 'notes', 'I2C clock line (shared with RTC)'),
            jsonb_build_object('from', 'arduino', 'from_pin', '5V', 'to', 'rtc', 'to_pin', 'VCC', 'wire_color', 'red', 'notes', 'Power for RTC'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'GND', 'to', 'rtc', 'to_pin', 'GND', 'wire_color', 'black', 'notes', 'Ground for RTC'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'A4', 'to', 'rtc', 'to_pin', 'SDA', 'wire_color', 'green', 'notes', 'I2C data line (shared with LCD)'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'A5', 'to', 'rtc', 'to_pin', 'SCL', 'wire_color', 'blue', 'notes', 'I2C clock line (shared with LCD)'),
            jsonb_build_object('from', 'arduino', 'from_pin', '5V', 'to', 'dht11', 'to_pin', 'VCC', 'wire_color', 'red', 'notes', 'Power for DHT11'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'GND', 'to', 'dht11', 'to_pin', 'GND', 'wire_color', 'black', 'notes', 'Ground for DHT11'),
            jsonb_build_object('from', 'arduino', 'from_pin', 'D2', 'to', 'dht11', 'to_pin', 'DATA', 'wire_color', 'yellow', 'notes', 'DHT11 data signal')
        ),
        'warnings', jsonb_build_array(
            'Unplug USB before making any wiring changes',
            'Double-check I2C addresses - LCD might be 0x27 or 0x3F',
            'Install CR2032 battery in RTC module before powering on',
            'DHT11 requires 2+ seconds between reads or returns garbage data'
        )
    ),
    'Initial wiring diagram with 11 connections'
FROM artifacts a
WHERE a.chat_id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9' AND a.type = 'wiring'
ON CONFLICT DO NOTHING;

-- Step 4: Create Code Artifact
INSERT INTO artifacts (chat_id, project_id, type, title, current_version)
SELECT 
    'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
    project_id,
    'code',
    'Arduino Firmware',
    1
FROM chats WHERE id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9'
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 5: Create Code Artifact Version
INSERT INTO artifact_versions (artifact_id, version_number, content, filename, language, change_summary)
SELECT 
    a.id,
    1,
    '// Room Temperature Desk Gadget
// Displays temperature and time on 16x2 LCD
// Hardware: Arduino Uno, DHT11, DS3231 RTC, I2C LCD

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <RTClib.h>

// ===== Pin Definitions =====
#define DHTPIN 2        // DHT11 data pin connected to D2
#define DHTTYPE DHT11   // DHT11 sensor type

// ===== Component Initialization =====
// LCD: I2C address 0x27 (16 chars x 2 lines)
// If LCD doesn''t work, try 0x3F instead
LiquidCrystal_I2C lcd(0x27, 16, 2);

// DHT Sensor
DHT dht(DHTPIN, DHTTYPE);

// Real-Time Clock
RTC_DS3231 rtc;

// ===== Setup Function =====
void setup() {
  Serial.begin(9600);
  Serial.println("Temperature Desk Gadget Starting...");
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp Monitor");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");
  delay(2000);
  
  // Initialize DHT11 sensor
  dht.begin();
  Serial.println("DHT11 initialized");
  
  // Initialize RTC
  if (!rtc.begin()) {
    Serial.println("ERROR: RTC not found!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RTC Error!");
    lcd.setCursor(0, 1);
    lcd.print("Check wiring");
    while (1);  // Halt if RTC not found
  }
  
  Serial.println("RTC initialized");
  
  // ===== IMPORTANT: Set RTC Time (Run Once) =====
  // Uncomment the next line ONCE to set the time, then re-comment and re-upload
  // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  
  lcd.clear();
  Serial.println("Setup complete!");
}

// ===== Main Loop =====
void loop() {
  // Read temperature from DHT11
  float temp = dht.readTemperature();  // Celsius
  
  // Read current time from RTC
  DateTime now = rtc.now();
  
  // Check if sensor read failed
  if (isnan(temp)) {
    Serial.println("ERROR: Failed to read from DHT sensor!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sensor Error!");
    lcd.setCursor(0, 1);
    lcd.print("Check DHT11");
    delay(2000);
    return;  // Skip this iteration
  }
  
  // Print to Serial Monitor for debugging
  Serial.print("Temp: ");
  Serial.print(temp, 1);
  Serial.print("C | Time: ");
  Serial.print(now.hour());
  Serial.print(":");
  Serial.println(now.minute());
  
  // ===== Display on LCD =====
  
  // Line 1: Temperature
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temp, 1);            // 1 decimal place
  lcd.print((char)223);          // Degree symbol (°)
  lcd.print("C  ");              // Extra spaces to clear previous text
  
  // Line 2: Time and Date
  lcd.setCursor(0, 1);
  
  // Hour (with leading zero)
  if (now.hour() < 10) lcd.print("0");
  lcd.print(now.hour());
  lcd.print(":");
  
  // Minute (with leading zero)
  if (now.minute() < 10) lcd.print("0");
  lcd.print(now.minute());
  lcd.print(" ");
  
  // Date (DD/MM format)
  if (now.day() < 10) lcd.print("0");
  lcd.print(now.day());
  lcd.print("/");
  if (now.month() < 10) lcd.print("0");
  lcd.print(now.month());
  
  // Wait 2 seconds before next reading
  // DHT11 requires minimum 2 seconds between reads
  delay(2000);
}',
    'temperature_monitor.ino',
    'cpp',
    'Complete Arduino firmware with LCD, DHT11, and RTC'
FROM artifacts a
WHERE a.chat_id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9' AND a.type = 'code'
ON CONFLICT DO NOTHING;

-- Step 6: Create Enclosure Artifact
INSERT INTO artifacts (chat_id, project_id, type, title, current_version)
SELECT 
    'f05fabd8-947f-4a3c-94ee-0720ab9d48a9',
    project_id,
    'enclosure',
    '3D Printable Enclosure',
    1
FROM chats WHERE id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9'
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 7: Create Enclosure Artifact Version
INSERT INTO artifact_versions (artifact_id, version_number, content_json, change_summary)
SELECT 
    a.id,
    1,
    jsonb_build_object(
        'files', jsonb_build_array(
            jsonb_build_object(
                'path', 'enclosure_base.scad',
                'language', 'openscad',
                'content', '// Temperature Monitor Enclosure - Base
// Designed for Arduino Uno + 16x2 LCD + DHT11
// Print settings: 0.2mm layer, 20% infill, no supports

// ===== Parameters (adjust to fit your build) =====
box_width = 120;        // Internal width
box_depth = 80;         // Internal depth
box_height = 40;        // Internal height
wall_thickness = 2.5;   // Wall thickness

// LCD cutout (16x2 with I2C backpack)
lcd_width = 80;
lcd_height = 36;
lcd_offset_x = 20;      // Center LCD on front face
lcd_offset_z = 15;      // Height from bottom

// USB cable cutout
usb_width = 12;
usb_height = 11;
usb_offset_y = 30;      // Position on side
usb_offset_z = 8;       // Height from bottom

// Ventilation holes for DHT11
vent_diameter = 8;
vent_spacing = 15;

// ===== Modules =====

module rounded_cube(size, radius) {
    hull() {
        translate([radius, radius, 0])
            cylinder(r=radius, h=size[2]);
        translate([size[0]-radius, radius, 0])
            cylinder(r=radius, h=size[2]);
        translate([radius, size[1]-radius, 0])
            cylinder(r=radius, h=size[2]);
        translate([size[0]-radius, size[1]-radius, 0])
            cylinder(r=radius, h=size[2]);
    }
}

module base_box() {
    difference() {
        // Outer shell
        rounded_cube([
            box_width + 2*wall_thickness,
            box_depth + 2*wall_thickness,
            box_height + wall_thickness
        ], 3);
        
        // Inner cavity
        translate([wall_thickness, wall_thickness, wall_thickness])
            cube([box_width, box_depth, box_height + 1]);
        
        // LCD cutout (front face)
        translate([lcd_offset_x + wall_thickness, -1, lcd_offset_z + wall_thickness])
            cube([lcd_width, wall_thickness + 2, lcd_height]);
        
        // USB cable cutout (left side)
        translate([-1, usb_offset_y + wall_thickness, usb_offset_z + wall_thickness])
            cube([wall_thickness + 2, usb_width, usb_height]);
        
        // Ventilation holes (back face) for DHT11
        for (i = [0:2]) {
            translate([
                box_width/2 - vent_spacing + i*vent_spacing + wall_thickness,
                box_depth + 2*wall_thickness - 1,
                box_height/2 + wall_thickness
            ])
            rotate([90, 0, 0])
                cylinder(d=vent_diameter, h=wall_thickness + 2);
        }
    }
}

// ===== Render =====
base_box();',
                'description', 'Main enclosure base with LCD cutout, USB access, and ventilation'
            ),
            jsonb_build_object(
                'path', 'enclosure_lid.scad',
                'language', 'openscad',
                'content', '// Temperature Monitor Enclosure - Lid
// Snap-fit design (or add M3 screw holes)

// ===== Parameters (must match base.scad) =====
box_width = 120;
box_depth = 80;
wall_thickness = 2.5;
lid_thickness = 2.5;

// Snap-fit tabs
tab_width = 15;
tab_depth = 3;
tab_height = 4;

// ===== Modules =====

module rounded_cube(size, radius) {
    hull() {
        translate([radius, radius, 0])
            cylinder(r=radius, h=size[2]);
        translate([size[0]-radius, radius, 0])
            cylinder(r=radius, h=size[2]);
        translate([radius, size[1]-radius, 0])
            cylinder(r=radius, h=size[2]);
        translate([size[0]-radius, size[1]-radius, 0])
            cylinder(r=radius, h=size[2]);
    }
}

module lid() {
    difference() {
        union() {
            // Main lid plate
            rounded_cube([
                box_width + 2*wall_thickness,
                box_depth + 2*wall_thickness,
                lid_thickness
            ], 3);
            
            // Inner lip (fits inside box)
            translate([wall_thickness + 0.2, wall_thickness + 0.2, lid_thickness])
                difference() {
                    cube([box_width - 0.4, box_depth - 0.4, 8]);
                    translate([wall_thickness - 0.2, wall_thickness - 0.2, 0])
                        cube([box_width - 2*wall_thickness + 0.4, box_depth - 2*wall_thickness + 0.4, 8 + 1]);
                }
        }
        
        // Optional: Label text on top
        translate([box_width/2 + wall_thickness, box_depth/2 + wall_thickness, lid_thickness - 0.5])
            linear_extrude(1)
                text("TEMP", size=10, halign="center", valign="center", font="Arial:style=Bold");
    }
}

// ===== Render =====
lid();',
                'description', 'Snap-fit lid with internal lip'
            ),
            jsonb_build_object(
                'path', 'README.md',
                'language', 'markdown',
                'content', '# Temperature Monitor Enclosure

3D printable enclosure for Arduino-based temperature monitor with LCD display.

## Files

- `enclosure_base.scad` - Main box with LCD cutout, USB access, ventilation
- `enclosure_lid.scad` - Snap-fit lid

## Print Instructions

### Settings
- **Material**: PLA or PETG
- **Layer Height**: 0.2mm
- **Infill**: 20%
- **Supports**: None needed
- **Print Orientation**: Base prints upright, lid prints flat

### Print Time
- Base: ~2.5 hours
- Lid: ~1 hour
- Total: ~3.5 hours

## Assembly

1. Print both parts (base and lid separately)
2. Insert breadboard into base cavity
3. Mount LCD in front cutout
4. Route DHT11 sensor wire through back ventilation
5. Close lid - snap-fit tabs hold it in place',
                'description', 'Assembly instructions and print settings'
            )
        )
    ),
    'Initial 3D enclosure design with base, lid, and assembly guide'
FROM artifacts a
WHERE a.chat_id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9' AND a.type = 'enclosure'
ON CONFLICT DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Check artifacts created
SELECT 
    a.type,
    a.title,
    a.current_version,
    COUNT(av.id) as version_count
FROM artifacts a
LEFT JOIN artifact_versions av ON av.artifact_id = a.id
WHERE a.chat_id = 'f05fabd8-947f-4a3c-94ee-0720ab9d48a9'
GROUP BY a.id, a.type, a.title, a.current_version
ORDER BY a.type;
