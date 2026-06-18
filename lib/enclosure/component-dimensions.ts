// Component physical dimensions database
// Used by enclosureGenerator to create accurate 3D enclosures

export interface ComponentDimensions {
  width: number;      // mm
  length: number;     // mm
  height: number;     // mm
  mounting_holes?: { x: number; y: number; diameter: number }[];
  clearances?: {
    [key: string]: {
      side: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
      width: number;
      height: number;
      offset: number;  // offset from edge
    };
  };
}

// Database of common IoT components
// Sources: Official datasheets, verified measurements
export const COMPONENT_DIMENSIONS: Record<string, ComponentDimensions> = {
  // === Microcontrollers ===
  'ESP32-DEVKIT-V1': {
    width: 48.26,
    length: 27.94,
    height: 12,
    mounting_holes: [
      { x: 2.5, y: 2.5, diameter: 3 },
      { x: 45.76, y: 2.5, diameter: 3 },
      { x: 2.5, y: 25.44, diameter: 3 },
      { x: 45.76, y: 25.44, diameter: 3 }
    ],
    clearances: {
      usb: { side: 'top', width: 8, height: 5, offset: 14 }
    }
  },
  
  'ESP8266-NODEMCU': {
    width: 48.26,
    length: 25.4,
    height: 13,
    mounting_holes: [
      { x: 2.5, y: 2.5, diameter: 3 },
      { x: 45.76, y: 2.5, diameter: 3 }
    ],
    clearances: {
      usb: { side: 'top', width: 8, height: 5, offset: 14 }
    }
  },
  
  'ARDUINO-UNO-R3': {
    width: 68.6,
    length: 53.4,
    height: 15,
    mounting_holes: [
      { x: 14, y: 2.5, diameter: 3.2 },
      { x: 66, y: 2.5, diameter: 3.2 },
      { x: 14, y: 50.8, diameter: 3.2 },
      { x: 66, y: 50.8, diameter: 3.2 }
    ],
    clearances: {
      usb: { side: 'top', width: 12, height: 11, offset: 27 },
      power: { side: 'top', width: 9, height: 11, offset: 50 }
    }
  },
  
  'ARDUINO-NANO': {
    width: 45,
    length: 18,
    height: 10,
    mounting_holes: [
      { x: 2.5, y: 2.5, diameter: 2 },
      { x: 42.5, y: 2.5, diameter: 2 },
      { x: 2.5, y: 15.5, diameter: 2 },
      { x: 42.5, y: 15.5, diameter: 2 }
    ],
    clearances: {
      usb: { side: 'top', width: 8, height: 4, offset: 22.5 }
    }
  },
  
  'RASPBERRY-PI-PICO': {
    width: 51,
    length: 21,
    height: 5,
    mounting_holes: [
      { x: 2, y: 2, diameter: 2.1 },
      { x: 49, y: 2, diameter: 2.1 },
      { x: 2, y: 19, diameter: 2.1 },
      { x: 49, y: 19, diameter: 2.1 }
    ],
    clearances: {
      usb: { side: 'top', width: 8, height: 3, offset: 25.5 }
    }
  },
  
  // === Sensors ===
  'BME280': { width: 13, length: 10, height: 5 },
  'BMP280': { width: 13, length: 10, height: 5 },
  'DHT11': { width: 15.5, length: 12, height: 5.5 },
  'DHT22': { width: 15.1, length: 25, height: 7.7 },
  'DS18B20': { width: 6, length: 30, height: 6 },
  'HC-SR04': { width: 45, length: 20, height: 15 },
  'HC-SR501': { width: 32, length: 24, height: 25 },
  'MPU6050': { width: 20, length: 16, height: 3 },
  'BH1750': { width: 13, length: 10, height: 5 },
  'MQ-2': { width: 32, length: 22, height: 27 },
  'MQ-135': { width: 32, length: 22, height: 27 },
  
  // === Displays ===
  'OLED-0.96-128X64': { width: 27, length: 27, height: 4 },
  'LCD-16X2': { width: 80, length: 36, height: 14 },
  'LCD-20X4': { width: 98, length: 60, height: 14 },
  
  // === Actuators ===
  'RELAY-5V-1CH': { width: 38, length: 22, height: 19 },
  'RELAY-5V-2CH': { width: 51, length: 27, height: 19 },
  'RELAY-5V-4CH': { width: 75, length: 55, height: 19 },
  'RELAY-5V-8CH': { width: 138, length: 55, height: 19 },
  'SERVO-SG90': { width: 22.5, length: 12, height: 29 },
  'SERVO-MG996R': { width: 40.7, length: 19.7, height: 42.9 },
  'L298N': { width: 43, length: 43, height: 27 },
  
  // === Power ===
  'LM7805': { width: 10, length: 4.8, height: 15.5 },  // TO-220 package
  'AMS1117': { width: 10, length: 4.8, height: 15.5 }, // TO-220 package
  'MB102-BREADBOARD-POWER': { width: 52, length: 35, height: 15 },
  'BATTERY-18650': { width: 18, length: 65, height: 18 },
  'BATTERY-9V': { width: 26.5, length: 48.5, height: 17.5 },
  'USB-POWER-BANK': { width: 90, length: 60, height: 24 },
  
  // === Modules ===
  'BLUETOOTH-HC05': { width: 36, length: 15, height: 7 },
  'BLUETOOTH-HC06': { width: 36, length: 15, height: 7 },
  'WIFI-ESP01': { width: 24.75, length: 14.5, height: 9 },
  'NRF24L01': { width: 29, length: 15, height: 9 },
  'SD-CARD-MODULE': { width: 42, length: 24, height: 13 },
  'RTC-DS3231': { width: 38, length: 22, height: 14 },
  'LEVEL-SHIFTER': { width: 12.5, length: 12.5, height: 5 },
  
  // === LEDs & Buttons ===
  'LED-5MM': { width: 5, length: 5, height: 8.6 },
  'LED-STRIP-WS2812B': { width: 10, length: 10, height: 3 },  // per LED
  'BUTTON-12MM': { width: 12, length: 12, height: 7.3 },
  'BUTTON-6MM': { width: 6, length: 6, height: 5 },
  'POTENTIOMETER-10K': { width: 9, length: 9, height: 13 },
};

/**
 * Get component dimensions from database
 * @param partNumber - Exact part number from BOM
 * @param name - Component name from BOM (used for fuzzy matching)
 * @returns ComponentDimensions if found, null if unknown
 */
export function getComponentDimensions(
  partNumber: string,
  name: string
): ComponentDimensions | null {
  // Try exact match on part number
  const upperPartNumber = partNumber.toUpperCase();
  if (COMPONENT_DIMENSIONS[upperPartNumber]) {
    return COMPONENT_DIMENSIONS[upperPartNumber];
  }
  
  // Try fuzzy match on name
  const normalized = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const [key, dims] of Object.entries(COMPONENT_DIMENSIONS)) {
    const normalizedKey = key.replace(/[^A-Z0-9]/g, '');
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      return dims;
    }
  }
  
  // NOT FOUND - return null (no silent guess)
  // Agent will prompt user for measurements
  return null;
}

/**
 * Get list of unknown components from BOM
 * Used by enclosureGenerator to determine which dimensions to request
 */
export function getUnknownComponents(components: Array<{ partNumber: string; name: string }>): string[] {
  return components
    .filter(c => getComponentDimensions(c.partNumber, c.name) === null)
    .map(c => c.name);
}
