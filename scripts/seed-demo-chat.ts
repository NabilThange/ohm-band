/**
 * Seed Demo Chat for Video Recording
 * 
 * Creates a fake chat conversation with:
 * - Project + Chat
 * - User and AI messages
 * - Artifacts (MVP, BOM, Wiring, Code)
 * - Artifact versions
 * 
 * Run once: node --env-file=.env.local -r tsx/esm scripts/seed-demo-chat.ts
 * Or: set environment variables and run: npx tsx scripts/seed-demo-chat.ts
 * NO IMPACT on existing code or logic
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoChat() {
    console.log('🎬 Creating demo chat for video recording...\n');

    // 1. Create Project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            name: 'Smart Home Temperature Monitor',
            description: 'IoT device that monitors temperature and sends alerts',
            category: 'IoT',
            goal: 'Build a WiFi-enabled temperature sensor with LCD display',
            target_budget: 45.00,
            current_estimated_cost: 42.50,
            status: 'active'
        })
        .select()
        .single();

    if (projectError) {
        console.error('❌ Project creation failed:', projectError);
        return;
    }

    console.log('✅ Project created:', project.id);

    // 2. Create Chat
    const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
            project_id: project.id,
            title: 'Smart Home Temperature Monitor',
            is_archived: false,
            is_public: false
        })
        .select()
        .single();

    if (chatError) {
        console.error('❌ Chat creation failed:', chatError);
        return;
    }

    console.log('✅ Chat created:', chat.id);

    // 3. Create Chat Session
    const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
            chat_id: chat.id,
            current_agent: 'The Wiring Specialist',
            project_stage: 'build',
            selected_provider: 'groq',
            selected_model: 'llama-3.3-70b-versatile'
        });

    if (sessionError) {
        console.error('❌ Session creation failed:', sessionError);
        return;
    }

    console.log('✅ Chat session created\n');

    // 4. Create Messages (conversation flow)
    const messages = [
        {
            chat_id: chat.id,
            sequence_number: 1,
            role: 'user',
            content: 'I want to build a temperature monitor with WiFi connectivity and an LCD display',
            agent_name: null,
            agent_model: null
        },
        {
            chat_id: chat.id,
            sequence_number: 2,
            role: 'assistant',
            content: 'Great idea! I\'ll help you build a WiFi-enabled temperature sensor. Let me create an MVP specification for your project.',
            agent_name: 'The Product Owner',
            agent_model: 'llama-3.3-70b-versatile'
        },
        {
            chat_id: chat.id,
            sequence_number: 3,
            role: 'assistant',
            content: 'I\'ve created the MVP specification. Now let me generate a bill of materials with component recommendations.',
            agent_name: 'The BOM Specialist',
            agent_model: 'llama-3.3-70b-versatile'
        },
        {
            chat_id: chat.id,
            sequence_number: 4,
            role: 'user',
            content: 'Can you show me the wiring diagram?',
            agent_name: null,
            agent_model: null
        },
        {
            chat_id: chat.id,
            sequence_number: 5,
            role: 'assistant',
            content: 'Absolutely! I\'ve created a complete wiring diagram showing how to connect the ESP32, DHT22 sensor, and LCD display.',
            agent_name: 'The Wiring Specialist',
            agent_model: 'llama-3.3-70b-versatile'
        },
        {
            chat_id: chat.id,
            sequence_number: 6,
            role: 'user',
            content: 'Perfect! Can you generate the Arduino code?',
            agent_name: null,
            agent_model: null
        },
        {
            chat_id: chat.id,
            sequence_number: 7,
            role: 'assistant',
            content: 'Code generated! The firmware includes WiFi connectivity, temperature reading, LCD display output, and threshold-based alerts.',
            agent_name: 'The Code Generator',
            agent_model: 'llama-3.3-70b-versatile'
        }
    ];

    for (const msg of messages) {
        const { error } = await supabase.from('messages').insert(msg);
        if (error) {
            console.error('❌ Message creation failed:', error);
            return;
        }
    }

    console.log('✅ Messages created (7 messages)\n');

    // 5. Create Artifacts
    const artifacts = [
        { type: 'mvp', title: 'MVP Specification', current_version: 1 },
        { type: 'bom', title: 'Bill of Materials', current_version: 1 },
        { type: 'wiring', title: 'Wiring Diagram', current_version: 1 },
        { type: 'code', title: 'Arduino Firmware', current_version: 1 }
    ];

    const createdArtifacts: any[] = [];

    for (const art of artifacts) {
        const { data, error } = await supabase
            .from('artifacts')
            .insert({
                chat_id: chat.id,
                project_id: project.id,
                ...art
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Artifact creation failed:', error);
            return;
        }

        createdArtifacts.push(data);
        console.log(`✅ Artifact created: ${art.title}`);
    }

    console.log('');

    // 6. Create Artifact Versions with content

    // MVP Version
    const mvpContent = `# Smart Home Temperature Monitor

## Vision
A WiFi-enabled temperature monitoring device that displays real-time temperature on an LCD screen and sends alerts when thresholds are exceeded.

## Core Features
1. **Temperature Monitoring**: DHT22 sensor for accurate readings
2. **Local Display**: 16x2 LCD for real-time display
3. **WiFi Connectivity**: ESP32 for internet connectivity
4. **Alert System**: Threshold-based notifications

## Hardware Requirements
- ESP32 DevKit
- DHT22 Temperature/Humidity Sensor
- 16x2 I2C LCD Display
- Power supply (5V/1A)

## Success Criteria
- Temperature accuracy: ±0.5°C
- Display refresh: Every 2 seconds
- WiFi connection stability: 99% uptime
- Budget: Under $50`;

    await supabase.from('artifact_versions').insert({
        artifact_id: createdArtifacts[0].id,
        version_number: 1,
        content: mvpContent,
        change_summary: 'Initial MVP specification'
    });

    // BOM Version
    const bomData = {
        components: [
            {
                id: '1',
                name: 'ESP32 DevKit',
                category: 'Microcontroller',
                quantity: 1,
                estimatedCost: 12.99,
                supplier: 'Amazon',
                supplier_url: 'https://amazon.com/esp32',
                specs: { voltage: '3.3V', wifi: 'Yes', bluetooth: 'Yes' }
            },
            {
                id: '2',
                name: 'DHT22',
                category: 'Sensor',
                quantity: 1,
                estimatedCost: 9.99,
                supplier: 'Adafruit',
                supplier_url: 'https://adafruit.com/dht22',
                specs: { accuracy: '±0.5°C', range: '-40 to 80°C' }
            },
            {
                id: '3',
                name: '16x2 I2C LCD',
                category: 'Display',
                quantity: 1,
                estimatedCost: 8.99,
                supplier: 'SparkFun',
                supplier_url: 'https://sparkfun.com/lcd',
                specs: { interface: 'I2C', backlight: 'Blue' }
            },
            {
                id: '4',
                name: 'Breadboard',
                category: 'Hardware',
                quantity: 1,
                estimatedCost: 5.99,
                supplier: 'Amazon',
                supplier_url: 'https://amazon.com/breadboard'
            },
            {
                id: '5',
                name: 'Jumper Wires',
                category: 'Hardware',
                quantity: 20,
                estimatedCost: 4.99,
                supplier: 'Amazon',
                supplier_url: 'https://amazon.com/jumpers'
            }
        ],
        total_cost: 42.95,
        updated_at: new Date().toISOString()
    };

    await supabase.from('artifact_versions').insert({
        artifact_id: createdArtifacts[1].id,
        version_number: 1,
        content_json: bomData,
        change_summary: 'Initial BOM with all components'
    });

    // Wiring Version
    const wiringData = {
        components: [
            { id: 'esp32', name: 'ESP32 DevKit', type: 'microcontroller' },
            { id: 'dht22', name: 'DHT22', type: 'sensor' },
            { id: 'lcd', name: '16x2 LCD', type: 'display' }
        ],
        connections: [
            { from: 'esp32', from_pin: 'GPIO4', to: 'dht22', to_pin: 'DATA', wire_color: 'yellow' },
            { from: 'esp32', from_pin: '3.3V', to: 'dht22', to_pin: 'VCC', wire_color: 'red' },
            { from: 'esp32', from_pin: 'GND', to: 'dht22', to_pin: 'GND', wire_color: 'black' },
            { from: 'esp32', from_pin: 'GPIO21', to: 'lcd', to_pin: 'SDA', wire_color: 'green' },
            { from: 'esp32', from_pin: 'GPIO22', to: 'lcd', to_pin: 'SCL', wire_color: 'blue' },
            { from: 'esp32', from_pin: '5V', to: 'lcd', to_pin: 'VCC', wire_color: 'red' },
            { from: 'esp32', from_pin: 'GND', to: 'lcd', to_pin: 'GND', wire_color: 'black' }
        ],
        instructions: '## Wiring Instructions\n\n1. Connect DHT22 to ESP32 GPIO4\n2. Connect LCD via I2C (SDA to GPIO21, SCL to GPIO22)\n3. Provide 5V power to LCD and 3.3V to DHT22'
    };

    await supabase.from('artifact_versions').insert({
        artifact_id: createdArtifacts[2].id,
        version_number: 1,
        content_json: wiringData,
        content: wiringData.instructions,
        change_summary: 'Complete wiring diagram'
    });

    // Code Version
    const codeContent = `#include <WiFi.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 4
#define DHTTYPE DHT22

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

float tempThreshold = 25.0;

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT
  dht.begin();
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Temp Monitor");
  delay(2000);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  lcd.clear();
  lcd.print("Connecting WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  lcd.clear();
  lcd.print("WiFi Connected!");
  delay(1000);
}

void loop() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (isnan(temp) || isnan(humidity)) {
    lcd.clear();
    lcd.print("Sensor Error!");
    return;
  }
  
  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temp, 1);
  lcd.print(" C");
  
  lcd.setCursor(0, 1);
  lcd.print("Humid: ");
  lcd.print(humidity, 1);
  lcd.print("%");
  
  // Check threshold
  if (temp > tempThreshold) {
    Serial.println("ALERT: Temperature threshold exceeded!");
  }
  
  delay(2000);
}`;

    await supabase.from('artifact_versions').insert({
        artifact_id: createdArtifacts[3].id,
        version_number: 1,
        content: codeContent,
        filename: 'temperature_monitor.ino',
        language: 'cpp',
        change_summary: 'Complete Arduino firmware'
    });

    console.log('✅ Artifact versions created with content\n');

    console.log('🎉 Demo chat seed complete!\n');
    console.log('📋 Summary:');
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Chat ID: ${chat.id}`);
    console.log(`   Messages: 7`);
    console.log(`   Artifacts: 4 (MVP, BOM, Wiring, Code)`);
    console.log(`\n🎬 Navigate to: /build/${chat.id}`);
}

seedDemoChat().catch(console.error);
