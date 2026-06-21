-- ============================================
-- MIGRATION 007: SEED COMPONENT TEMPLATES
-- ============================================
-- Description: Populate component_templates with common electronics
-- Risk: LOW - just inserting data
-- Note: This table is queried by wiring AI but currently has 0 rows
-- ⚠️ RUN THIS AFTER 004 (parts_connections_decision) is resolved
-- ============================================

-- Clear any existing data (for re-running)
-- ⚠️ CASCADE will affect parts.template_id if parts table still exists
-- Make sure you've resolved 004_parts_connections_decision.sql first!
TRUNCATE component_templates CASCADE;

-- ============================================
-- MICROCONTROLLERS
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('ESP32-WROOM-32', 'Microcontroller', 'Espressif', 
  '{"3V3": "Power (3.3V output)", "5V": "Power (5V input)", "GND": "Ground", "EN": "Enable (active high)", "VP": "GPIO36/ADC1_CH0", "VN": "GPIO39/ADC1_CH3", "D34": "GPIO34/ADC1_CH6", "D35": "GPIO35/ADC1_CH7", "D32": "GPIO32/ADC1_CH4/TOUCH9", "D33": "GPIO33/ADC1_CH5/TOUCH8", "D25": "GPIO25/ADC2_CH8/DAC1", "D26": "GPIO26/ADC2_CH9/DAC2", "D27": "GPIO27/ADC2_CH7/TOUCH7", "D14": "GPIO14/ADC2_CH6/TOUCH6", "D12": "GPIO12/ADC2_CH5/TOUCH5", "D13": "GPIO13/ADC2_CH4/TOUCH4", "D15": "GPIO15/ADC2_CH3/TOUCH3", "D2": "GPIO2/ADC2_CH2/TOUCH2", "D0": "GPIO0/ADC2_CH1/TOUCH1", "D4": "GPIO4/ADC2_CH0/TOUCH0", "D16": "GPIO16/UART2_RX", "D17": "GPIO17/UART2_TX", "D5": "GPIO5/VSPI_CS", "D18": "GPIO18/VSPI_CLK", "D19": "GPIO19/VSPI_MISO", "D21": "GPIO21/I2C_SDA", "D22": "GPIO22/I2C_SCL", "D23": "GPIO23/VSPI_MOSI", "RX": "GPIO3/UART0_RX", "TX": "GPIO1/UART0_TX"}'::jsonb,
  '3.3V',   
  ARRAY['WiFi', 'Bluetooth', 'I2C', 'SPI', 'UART', 'ADC', 'DAC', 'Touch', 'PWM'],
  '{"flash": "4MB", "ram": "520KB", "cpu_freq": "240MHz", "wifi": "802.11 b/g/n", "bluetooth": "4.2"}'::jsonb,
  'Popular WiFi + Bluetooth dual-mode microcontroller with rich peripheral set',
  ARRAY['IoT projects', 'WiFi sensors', 'BLE beacons', 'Smart home devices', 'Web servers']),

('Arduino Uno R3', 'Microcontroller', 'Arduino', 
  '{"5V": "Power output (5V)", "3.3V": "Power output (3.3V)", "GND": "Ground", "VIN": "Power input (7-12V)", "RESET": "Reset button", "IOREF": "I/O reference voltage", "D0": "Digital I/O / UART RX", "D1": "Digital I/O / UART TX", "D2": "Digital I/O / Interrupt", "D3": "Digital I/O / PWM / Interrupt", "D4": "Digital I/O", "D5": "Digital I/O / PWM", "D6": "Digital I/O / PWM", "D7": "Digital I/O", "D8": "Digital I/O", "D9": "Digital I/O / PWM", "D10": "Digital I/O / PWM / SPI SS", "D11": "Digital I/O / PWM / SPI MOSI", "D12": "Digital I/O / SPI MISO", "D13": "Digital I/O / SPI SCK / LED", "A0": "Analog input 0", "A1": "Analog input 1", "A2": "Analog input 2", "A3": "Analog input 3", "A4": "Analog input 4 / I2C SDA", "A5": "Analog input 5 / I2C SCL"}'::jsonb,
  '5V',
  ARRAY['I2C', 'SPI', 'UART', 'ADC', 'PWM'],
  '{"flash": "32KB", "ram": "2KB", "eeprom": "1KB", "cpu_freq": "16MHz", "io_voltage": "5V"}'::jsonb,
  'Classic Arduino development board with ATmega328P microcontroller',
  ARRAY['Learning electronics', 'Simple automation', 'Sensor projects', 'LED control', 'Motor control']);

-- ============================================
-- SENSORS - TEMPERATURE & HUMIDITY
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('DHT11', 'Sensor', 'Various', 
  '{"VCC": "Power (3.3V-5V)", "DATA": "Digital data pin (one-wire)", "NC": "Not connected", "GND": "Ground"}'::jsonb,
  '3.3V-5V',
  ARRAY['Digital One-Wire'],
  '{"temp_range": "0-50°C", "temp_accuracy": "±2°C", "humidity_range": "20-90%", "humidity_accuracy": "±5%", "sample_rate": "1Hz"}'::jsonb,
  'Basic temperature and humidity sensor with digital output',
  ARRAY['Weather stations', 'Room monitoring', 'Greenhouse automation', 'HVAC control']),

('DHT22', 'Sensor', 'Various', 
  '{"VCC": "Power (3.3V-5V)", "DATA": "Digital data pin (one-wire)", "NC": "Not connected", "GND": "Ground"}'::jsonb,
  '3.3V-5V',
  ARRAY['Digital One-Wire'],
  '{"temp_range": "-40-80°C", "temp_accuracy": "±0.5°C", "humidity_range": "0-100%", "humidity_accuracy": "±2%", "sample_rate": "0.5Hz"}'::jsonb,
  'High-accuracy temperature and humidity sensor',
  ARRAY['Weather stations', 'Precision climate control', 'Data logging', 'Environmental monitoring']),

('DS18B20', 'Sensor', 'Maxim Integrated', 
  '{"VCC": "Power (3.3V-5V)", "DATA": "Digital data pin (one-wire)", "GND": "Ground"}'::jsonb,
  '3.3V-5V',
  ARRAY['Digital One-Wire'],
  '{"temp_range": "-55-125°C", "accuracy": "±0.5°C", "resolution": "9-12 bit configurable"}'::jsonb,
  'Digital temperature sensor with one-wire interface',
  ARRAY['Temperature logging', 'Thermostat', 'Aquarium monitoring', 'Industrial sensing']);

-- ============================================
-- DISPLAYS
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('16x2 LCD with I2C Backpack', 'Display', 'Various', 
  '{"VCC": "Power (5V)", "GND": "Ground", "SDA": "I2C data line", "SCL": "I2C clock line"}'::jsonb,
  '5V',
  ARRAY['I2C'],
  '{"characters": "16x2", "i2c_address": "0x27 or 0x3F", "backlight": "Blue or Green", "contrast_adjustable": true}'::jsonb,
  '16 character x 2 line LCD display with I2C interface module',
  ARRAY['Status displays', 'Menus', 'Data readouts', 'User interfaces']),

('OLED 0.96" 128x64 I2C', 'Display', 'Various', 
  '{"VCC": "Power (3.3V-5V)", "GND": "Ground", "SDA": "I2C data line", "SCL": "I2C clock line"}'::jsonb,
  '3.3V-5V',
  ARRAY['I2C'],
  '{"resolution": "128x64", "i2c_address": "0x3C or 0x3D", "color": "Monochrome (white/blue/yellow)", "driver": "SSD1306"}'::jsonb,
  'Small OLED display with high contrast and low power consumption',
  ARRAY['Wearables', 'Compact displays', 'Gauge clusters', 'Mini dashboards']);

-- ============================================
-- MODULES - RTC
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('DS3231 RTC Module', 'Timekeeping', 'Maxim Integrated', 
  '{"VCC": "Power (3.3V-5V)", "GND": "Ground", "SDA": "I2C data line", "SCL": "I2C clock line", "SQW": "Square wave output (optional)", "32K": "32KHz output (optional)"}'::jsonb,
  '3.3V-5V',
  ARRAY['I2C'],
  '{"i2c_address": "0x68", "accuracy": "±2ppm (±1 minute/year)", "battery": "CR2032", "temperature_compensated": true}'::jsonb,
  'High-precision real-time clock with battery backup',
  ARRAY['Data loggers', 'Alarm clocks', 'Scheduling', 'Timestamping']);

-- ============================================
-- SENSORS - MOTION & DISTANCE
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('HC-SR04 Ultrasonic', 'Sensor', 'Various',
 
  '{"VCC": "Power (5V)", "TRIG": "Trigger input", "ECHO": "Echo output", "GND": "Ground"}'::jsonb,
  '5V',
  ARRAY['Digital'],
  '{"range": "2cm-400cm", "angle": "15 degrees", "frequency": "40kHz"}'::jsonb,
  'Ultrasonic distance sensor with digital trigger/echo interface',
  ARRAY['Obstacle detection', 'Distance measurement', 'Robotics', 'Parking sensors']),

('PIR Motion Sensor HC-SR501', 'Sensor', 'Various', 
  '{"VCC": "Power (5V-20V)", "OUT": "Digital output (high on motion)", "GND": "Ground"}'::jsonb,
  '5V-20V',
  ARRAY['Digital'],
  '{"range": "3-7 meters", "angle": "120 degrees", "adjustable_sensitivity": true, "adjustable_delay": "5s-300s"}'::jsonb,
  'Passive infrared motion detector',
  ARRAY['Security systems', 'Automatic lighting', 'Presence detection', 'Energy saving']);

-- ============================================
-- ACTUATORS - MOTORS & SERVOS
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('SG90 Micro Servo', 'Actuator', 'TowerPro', 
  '{"VCC": "Power (4.8V-6V, typically 5V)", "GND": "Ground", "SIGNAL": "PWM control signal (3.3V-5V)"}'::jsonb,
  '4.8V-6V',
  ARRAY['PWM'],
  '{"rotation": "180 degrees (±90°)", "torque": "1.8kg·cm @ 4.8V", "speed": "0.1s/60° @ 4.8V", "pwm_frequency": "50Hz", "pulse_width": "1-2ms"}'::jsonb,
  'Small hobby servo motor for precise angular control',
  ARRAY['Robotics', 'RC models', 'Pan-tilt mechanisms', 'Actuated arms']),

('28BYJ-48 Stepper + ULN2003 Driver', 'Actuator', 'Various', 
  '{"IN1": "Coil control 1", "IN2": "Coil control 2", "IN3": "Coil control 3", "IN4": "Coil control 4", "VCC": "Power (5V)", "GND": "Ground"}'::jsonb,
  '5V',
  ARRAY['Digital'],
  '{"steps_per_revolution": "2048 (with gearbox)", "voltage": "5V DC", "current": "~250mA", "reduction_ratio": "64:1"}'::jsonb,
  '5V stepper motor with ULN2003 driver board',
  ARRAY['Precise positioning', '3D printers', 'CNC', 'Camera sliders']);

-- ============================================
-- POWER MODULES
-- ============================================

INSERT INTO component_templates (name, category, manufacturer, pins, voltage_range, interface_types, default_specs, description, common_uses) VALUES
('MB102 Breadboard Power Supply', 'Power', 'Various', 
  '{"VIN": "DC input (6.5V-12V)", "3.3V": "3.3V output rail", "5V": "5V output rail", "GND": "Ground"}'::jsonb,
  '6.5V-12V input',
  ARRAY['Power Supply'],
  '{"output_3v3": "3.3V @ 700mA max", "output_5v": "5V @ 700mA max", "input": "DC jack or USB", "switch": "On/Off per rail"}'::jsonb,
  'Dual voltage breadboard power supply module',
  ARRAY['Breadboard prototyping', 'Mixed voltage projects', 'Multiple device power']),

('AMS1117-3.3V Regulator', 'Power', 'Advanced Monolithic Systems', 
  '{"VIN": "Input voltage (4.5V-15V)", "GND": "Ground", "VOUT": "3.3V output"}'::jsonb,
  '4.5V-15V input',
  ARRAY['Power Supply'],
  '{"output": "3.3V", "current": "1A max", "dropout": "1.1V", "protection": "Thermal shutdown, current limit"}'::jsonb,
  'Low dropout 3.3V linear voltage regulator',
  ARRAY['3.3V power supply', 'Level conversion', 'ESP32 power', 'Battery projects']);

-- ============================================
-- VERIFICATION
-- ============================================

-- Count inserted templates
SELECT category, COUNT(*) as count 
FROM component_templates 
GROUP BY category 
ORDER BY category;

-- Verify searchTemplates would work
SELECT name, category, description 
FROM component_templates 
WHERE name ILIKE '%ESP32%' 
   OR description ILIKE '%ESP32%';

-- Verify getPinout would work  
SELECT name, pins, voltage_range, interface_types 
FROM component_templates 
WHERE name = 'DHT22';

-- List all templates
SELECT name, category, manufacturer, voltage_range, interface_types 
FROM component_templates 
ORDER BY category, name;
