/**
 * Demo Mode Response Generator
 * Pre-scripted responses for demo videos without calling AI APIs
 */

export interface DemoResponse {
    agentType: string;
    agentName: string;
    agentIcon: string;
    intent: string;
    textChunks: string[];
    toolCalls: Array<{
        name: string;
        arguments: Record<string, any>;
    }>;
    title?: string; // Optional project title update
    phase?: 'ideation' | 'parts' | 'wiring' | 'code' | 'test' | 'deploy'; // Current phase
    completedPhases?: Array<'ideation' | 'parts' | 'wiring' | 'code' | 'test' | 'deploy'>; // Completed phases
}

// ============================================================
// STRUCTURAL CONSTANTS: BOM, BUDGET, WIRING, CODE, ENCLOSURES
// ============================================================

const FARM_DRONE_BOM_DATA = {
  project_name: "Farm Patrol Autonomous Drone — Complete BOM v1.2",
  revision: "1.2",
  revision_date: "2026-06-21",
  currency: "USD",
  summary: {
    total_components: 21,
    total_line_items: 21,
    subtotal: 286.00,
    shipping_estimate: 22.00,
    grand_total: 308.00,
    target_budget: 350.00,
    budget_headroom: 42.00
  },
  components: [
    {
      id: "FC-001",
      name: "Pixhawk 6C Flight Controller (Standard Set)",
      partNumber: "PIX6C-STD",
      category: "Flight Controller",
      quantity: 1,
      unitCost: 95.00,
      lineCost: 95.00,
      supplier: "Holybro",
      link: "https://holybro.com/products/pixhawk-6c",
      leadTimeDays: 5,
      specs: {
        MCU: "STM32H753",
        IMU: "ICM-42688-P (×2)",
        barometer: "BMP388",
        interfaces: "8× PWM, TELEM1/2, GPS1/2, I2C, CAN, SPI, USB-C",
        voltage: "4.75–5.25 V",
        dimensions: "84 × 44 × 12 mm",
        weight: "59 g with dampener"
      },
      notes: "Includes power module, GPS mast, and JST-GH cable set. Do NOT substitute — clone units lack dual-IMU redundancy."
    },
    {
      id: "SN-001",
      name: "u-blox M9N GPS + IST8310 Compass",
      partNumber: "M9N-GPS-COMBO",
      category: "Sensors",
      quantity: 1,
      unitCost: 35.00,
      lineCost: 35.00,
      supplier: "Holybro",
      link: "https://holybro.com/products/m9n-gps",
      leadTimeDays: 5,
      specs: {
        chip: "u-blox M9N",
        accuracyCEP: "1.5 m",
        acquisitionColdStart: "24 s",
        updateRate: "18 Hz",
        interface: "UART + I2C",
        compass: "IST8310 3-axis"
      },
      notes: "Mount on top mast, minimum 5 cm above PDB to reduce magnetic interference."
    },
    {
      id: "CC-001",
      name: "ESP32-S3-DevKitC-1 (N16R8)",
      partNumber: "ESP32-S3-DC-N16R8",
      category: "Companion Computer",
      quantity: 1,
      unitCost: 8.00,
      lineCost: 8.00,
      supplier: "Espressif / Amazon",
      link: "https://www.amazon.in/dp/B0C5JTHWMZ",
      leadTimeDays: 3,
      specs: {
        CPU: "Xtensa LX7 dual-core 240 MHz",
        RAM: "512 KB SRAM + 8 MB PSRAM",
        flash: "16 MB",
        wifi: "802.11 b/g/n 2.4 GHz",
        bluetooth: "BLE 5.0",
        camera: "MIPI-CSI 2-lane interface",
        uart: "3× hardware UART"
      },
      notes: "N16R8 variant is required — the extra PSRAM is essential for MJPEG frame buffering."
    },
    {
      id: "CM-001",
      name: "Raspberry Pi Camera Module 3",
      partNumber: "SC0872",
      category: "Camera",
      quantity: 1,
      unitCost: 35.00,
      lineCost: 35.00,
      supplier: "RPi Foundation / Amazon",
      link: "https://www.raspberrypi.com/products/camera-module-3/",
      leadTimeDays: 4,
      specs: {
        sensor: "Sony IMX708",
        resolution: "12 MP",
        videoMax: "1080p30 / 720p60",
        interface: "MIPI-CSI 2-lane",
        FOV: "66° diagonal",
        autofocus: "Phase-detect AF",
        dimensions: "25 × 24 × 11.5 mm"
      },
      notes: "Use 15 cm flat-flex FPC cable to bridge ESP32-S3 MIPI connector. Protect with 3D-printed camera nacelle."
    },
    {
      id: "MT-001",
      name: "RacerStar 920 KV Brushless Motor (4-pack)",
      partNumber: "BR2212-920KV-4PK",
      category: "Propulsion",
      quantity: 4,
      unitCost: 12.00,
      lineCost: 48.00,
      supplier: "RacerStar / HobbyKing",
      link: "https://hobbyking.com/en_us/racerstar-br2212.html",
      leadTimeDays: 7,
      specs: {
        KV: "920 KV",
        maxPower: "188 W",
        maxThrust: "850 g with 10×4.5 prop",
        statorSize: "2212",
        shaft: "3.17 mm",
        weight: "52 g",
        connectors: "3.5 mm banana plugs"
      },
      notes: "Buy as a 4-pack. CW and CCW shaft threads are in the pack — label each motor before mounting."
    },
    {
      id: "ES-001",
      name: "30 A BLHeli_32 ESC",
      partNumber: "HK-30A-BL32",
      category: "Propulsion",
      quantity: 4,
      unitCost: 9.00,
      lineCost: 36.00,
      supplier: "HobbyKing",
      link: "https://hobbyking.com/en_us/blheli32-30a.html",
      leadTimeDays: 7,
      specs: {
        continuousCurrent: "30 A",
        burstCurrent: "40 A (10 s)",
        inputVoltage: "2–6S LiPo",
        firmware: "BLHeli_32",
        protocol: "DSHOT600 / OneShot125 / PWM",
        BEC: "5 V / 3 A",
        weight: "15 g"
      },
      notes: "Flash BLHeli_32 latest firmware before installation. Enable motor direction in BLHeli Suite — CW motors need reverse rotation."
    },
    {
      id: "PR-001",
      name: "HQProp 10×4.5 Carbon Fibre Props (2× CW + 2× CCW)",
      partNumber: "HQ-1045-CF-SET",
      category: "Propulsion",
      quantity: 4,
      unitCost: 4.00,
      lineCost: 16.00,
      supplier: "HQProp / HobbyKing",
      link: "https://hobbyking.com",
      leadTimeDays: 5,
      specs: {
        diameter: "10 inch",
        pitch: "4.5 inch",
        material: "Carbon fibre reinforced nylon",
        hubBore: "10 mm with adapters for 8, 6, 5 mm",
        balancing: "Factory balanced",
        tipClearance: "22 mm from frame arm (450 mm frame)"
      },
      notes: "Order 2 spare sets. CF props are brittle on hard landings. Always balance before first flight."
    },
    {
      id: "BT-001",
      name: "Tattu 4S 5000 mAh LiPo 45C (XT60)",
      partNumber: "TA-5000-4S-45C-XT60",
      category: "Power",
      quantity: 1,
      unitCost: 45.00,
      lineCost: 45.00,
      supplier: "Tattu / GensAce",
      link: "https://www.gensace.de/tattu-5000mah-4s-45c.html",
      leadTimeDays: 5,
      specs: {
        cells: "4S (4× 3.7 V nominal)",
        nominalVoltage: "14.8 V",
        fullVoltage: "16.8 V",
        cutoffVoltage: "13.2 V (3.3 V/cell)",
        capacity: "5000 mAh",
        dischargeRating: "45C continuous / 90C burst",
        maxCurrent: "225 A continuous",
        weight: "345 g",
        connector: "XT60 female"
      },
      notes: "Do NOT use unknown-brand cells — low-quality batteries are the #1 cause of agricultural drone fires. Tattu or GensAce only."
    },
    {
      id: "PW-001",
      name: "Matek FCHUB-6S Power Distribution Board",
      partNumber: "FCHUB-6S",
      category: "Power",
      quantity: 1,
      unitCost: 6.00,
      lineCost: 6.00,
      supplier: "Matek Systems",
      link: "https://www.mateksys.com/?portfolio=fchub-6s",
      leadTimeDays: 3,
      specs: {
        inputVoltage: "3–6S LiPo",
        maxCurrent: "120 A continuous",
        ESCpads: "4× ESC pads (solder)",
        "5VBEC": "5 V / 2 A regulated BEC",
        currentSensor: "Built-in 184 A sensor",
        dimensions: "40 × 40 mm",
        mountingPattern: "30.5 × 30.5 mm"
      },
      notes: "Route 14 AWG power wires. Keep solder joints < 3 mm above pad surface to avoid shorts."
    },
    {
      id: "PW-002",
      name: "SkyRC iMAX B6AC V2 Charger",
      partNumber: "SK-100006-02",
      category: "Power",
      quantity: 1,
      unitCost: 28.00,
      lineCost: 28.00,
      supplier: "SkyRC / Amazon",
      link: "https://www.skyrc.com/imax-b6ac-v2",
      leadTimeDays: 3,
      specs: {
        maxChargeRate: "6 A",
        maxPower: "80 W",
        inputAC: "100–240 V",
        inputDC: "11–18 V",
        balanceCells: "2–6S",
        storageMode: "Yes",
        display: "Colour LCD"
      },
      notes: "Always charge at 1C rate (5 A for 5000 mAh pack). Never charge unattended. Storage charge at 3.85 V/cell between flights."
    },
    {
      id: "FR-001",
      name: "F450 450 mm Carbon Fibre Frame Kit",
      partNumber: "F450-CF-KIT",
      category: "Frame",
      quantity: 1,
      unitCost: 28.00,
      lineCost: 28.00,
      supplier: "Amazon / Banggood",
      link: "https://www.amazon.in/dp/B07X2BH6BV",
      leadTimeDays: 3,
      specs: {
        wheelbase: "450 mm motor-to-motor",
        material: "Carbon fibre arms + PCB centre plates",
        maxAUW: "1800 g recommended",
        armDiameter: "16 mm",
        motorMountHoles: "16 × 19 mm pattern",
        includesHardware: "M3 screws, standoffs, nuts"
      },
      notes: "The PCB top/bottom plates act as the power bus — solder XT60 input to bottom plate pads."
    },
    {
      id: "SN-002",
      name: "HC-SR04 Ultrasonic Distance Sensor",
      partNumber: "SEN-HC-SR04",
      category: "Sensors",
      quantity: 1,
      unitCost: 3.00,
      lineCost: 3.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B07THHQMHM",
      leadTimeDays: 2,
      specs: {
        range: "2 cm – 400 cm",
        accuracy: "± 3 mm",
        frequency: "40 kHz",
        triggerPulse: "10 µs TTL",
        supplyVoltage: "5 V",
        current: "15 mA",
        fieldOfView: "15° cone"
      },
      notes: "Mount facing forward on the nose of the frame. Use a 5 V → 3.3 V voltage divider on the ECHO pin before connecting to ESP32."
    },
    {
      id: "SN-003",
      name: "BMP280 Barometric Pressure + Temperature Sensor",
      partNumber: "BMP280-MODULE",
      category: "Sensors",
      quantity: 1,
      unitCost: 4.00,
      lineCost: 4.00,
      supplier: "Adafruit / Amazon",
      link: "https://www.adafruit.com/product/2651",
      leadTimeDays: 2,
      specs: {
        interface: "I2C (0x76) or SPI",
        pressureRange: "300–1100 hPa",
        altitudeResolution: "0.12 m RMS",
        supplyVoltage: "1.8–3.6 V",
        current: "2.7 µA at 1 Hz"
      },
      notes: "Mount inside a small foam-padded enclosure to shield from rotor downwash pressure spikes."
    },
    {
      id: "ST-001",
      name: "Holybro Telemetry Radio 433 MHz (Air + Ground set)",
      partNumber: "TR-433-V3-SET",
      category: "Telemetry",
      quantity: 1,
      unitCost: 25.00,
      lineCost: 25.00,
      supplier: "Holybro",
      link: "https://holybro.com/products/sik-telemetry-radio-v3",
      leadTimeDays: 5,
      specs: {
        frequency: "433 MHz",
        range: "300 m LOS",
        txPower: "100 mW (20 dBm)",
        protocol: "SiK 2.0 + MAVLink",
        dataRate: "250 kbps air",
        interface: "UART 57600 baud",
        encryption: "AES-128"
      },
      notes: "Connect air module to Pixhawk TELEM1. Plug ground module into laptop for QGroundControl. Must legally stay at 433 MHz in India."
    },
    {
      id: "ST-002",
      name: "MicroSD Card 32 GB (Class 10 / A1)",
      partNumber: "SDSQUA4-032G",
      category: "Storage",
      quantity: 1,
      unitCost: 7.00,
      lineCost: 7.00,
      supplier: "SanDisk / Amazon",
      link: "https://www.amazon.in/dp/B073K14CVB",
      leadTimeDays: 2,
      specs: {
        capacity: "32 GB",
        speedClass: "A1 / Class 10",
        readSpeed: "100 MB/s",
        writeSpeed: "40 MB/s",
        formFactor: "MicroSDHC"
      },
      notes: "Format as FAT32. Pixhawk logs DataFlash to it; ESP32 writes MJPEG recordings. Replace every 50 flight hours."
    },
    {
      id: "HW-001",
      name: "Anti-vibration Silicone Grommets M3 (16-pack)",
      partNumber: "VIB-DAMP-M3-16",
      category: "Hardware",
      quantity: 16,
      unitCost: 0.06,
      lineCost: 1.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B08CY7JQRM",
      leadTimeDays: 2,
      specs: {
        material: "Silicone 40 Shore A",
        thread: "M3",
        isolationFreq: "80–200 Hz (motor harmonics)"
      },
      notes: "Use under all 4 Pixhawk mounting screws to isolate IMU from motor vibration. Critical for stable attitude estimation."
    },
    {
      id: "HW-002",
      name: "Silicone Wire 14 AWG Red + Black (3 m each)",
      partNumber: "SIL-14AWG-RB",
      category: "Hardware",
      quantity: 1,
      unitCost: 5.00,
      lineCost: 5.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B07G2GLKMP",
      leadTimeDays: 2,
      specs: {
        gauge: "14 AWG",
        maxCurrent: "32 A",
        insulation: "Silicone — flexible at -50 °C to +200 °C",
        strandCount: "400 × 0.08 mm ultra-fine stranded"
      },
      notes: "Use exclusively for high-current runs (battery → PDB → ESC). Silicone flex wire survives vibration far better than PVC."
    },
    {
      id: "HW-003",
      name: "XT60 Male + Female Connector Pairs (5-pack)",
      partNumber: "XT60-5PK",
      category: "Hardware",
      quantity: 5,
      unitCost: 0.80,
      lineCost: 4.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B07BJRL2CS",
      leadTimeDays: 2,
      specs: {
        rating: "60 A continuous",
        burstRating: "90 A",
        material: "Nylon PA66 + gold-plated copper",
        keyedPolarity: "Yes — cannot reverse-connect"
      },
      notes: "Tin the wires and connector cups before joining. Do NOT solder with the connector mated — heat warps the nylon."
    },
    {
      id: "HW-004",
      name: "Dupont Jumper Wire Set 40-pin (M-F, F-F, M-M)",
      partNumber: "DUPONT-40-SET",
      category: "Hardware",
      quantity: 1,
      unitCost: 3.00,
      lineCost: 3.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B07GD2BWPY",
      leadTimeDays: 2,
      specs: {
        gauge: "24 AWG",
        lengths: "20 cm",
        types: "M-M, M-F, F-F (120 wires total)"
      },
      notes: "Use for low-current signal connections only (sensors, UART, I2C). Secure bundles with zip ties every 5 cm."
    },
    {
      id: "HW-005",
      name: "Heat Shrink Tubing Assortment (3–20 mm, 350 pcs)",
      partNumber: "HEAT-SHRINK-350",
      category: "Hardware",
      quantity: 1,
      unitCost: 6.00,
      lineCost: 6.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B07JCKZC3H",
      leadTimeDays: 2,
      specs: {
        ratio: "2:1 shrink ratio",
        material: "Polyolefin",
        temperatureRating: "125 °C",
        sizes: "3 / 4 / 6 / 8 / 10 / 13 / 16 / 20 mm"
      },
      notes: "Cover all solder joints on power wires and motor connectors. Use larger sizes over ESC solder pads."
    },
    {
      id: "HW-006",
      name: "M3 Nylon Screw + Nut Assortment (200 pcs)",
      partNumber: "M3-NYLON-200",
      category: "Hardware",
      quantity: 1,
      unitCost: 6.00,
      lineCost: 6.00,
      supplier: "Amazon",
      link: "https://www.amazon.in/dp/B07VKQHBPC",
      leadTimeDays: 2,
      specs: {
        material: "PA66 nylon — non-conductive, non-magnetic",
        sizes: "M3 × 5 / 8 / 10 / 12 / 16 mm with hex nuts",
        use: "Electronics mounting where metal fasteners risk shorts"
      },
      notes: "Use nylon for all Pixhawk and ESP32 board mounts. Use metal M3 for frame assembly and motor attachment."
    }
  ],
  warnings: [
    "⚠️  Never exceed 45C discharge rating on the battery — it degrades cells and is a fire risk.",
    "⚠️  XT60 connectors are keyed but not foolproof; verify polarity with a multimeter before first battery connection.",
    "⚠️  BLHeli_32 ESCs require calibration after firmware flash — skip this and motors spin unevenly.",
    "⚠️  Ensure Pixhawk GPS mast provides clear sky view and is at least 5 cm from carbon fibre arms (RF interference).",
    "⚠️  PETG or ABS only for enclosure prints — PLA softens above 60 °C in direct Indian summer sun."
  ],
  powerBudget: {
    hoverCurrentPerMotor_A: 8.5,
    totalHoverCurrent_A: 34,
    batteryCapacity_mAh: 5000,
    estimatedHoverTime_min: 22,
    peakCurrentAt100pct_A: 120,
    batteryRating_A: 225,
    safetyMargin: "88 % headroom at peak"
  }
};

const FARM_DRONE_BUDGET_DATA = {
  summary: {
    originalQuoteTotal: 390.00,
    optimisedTotal: 308.00,
    totalSavings: 82.00,
    savingsPercent: 21,
    targetBudget: 350.00,
    remainingHeadroom: 42.00,
    currency: "USD"
  },
  costBreakdownByCategory: [
    { category: "Flight Controller", cost: 95.00, percentOfTotal: 31 },
    { category: "Propulsion (motors + ESCs + props)", cost: 100.00, percentOfTotal: 32 },
    { category: "Camera + Companion", cost: 43.00, percentOfTotal: 14 },
    { category: "Power System", cost: 79.00, percentOfTotal: 26 },
    { category: "Frame + Hardware", cost: 49.00, percentOfTotal: 16 },
    { category: "Sensors + Telemetry", cost: 67.00, percentOfTotal: 22 }
  ],
  optimisations: [
    {
      id: "OPT-001",
      component: "Brushless Motors",
      original: { item: "T-Motor MN2212 (individual units)", cost: 80.00 },
      alternative: { item: "RacerStar 920 KV 4-pack bundle", cost: 48.00 },
      savings: 32.00,
      riskLevel: "Low-Medium",
      reasoning: "RacerStar motors have comparable thrust-to-weight for agricultural monitoring payloads. T-Motor's premium is justified for racing, not 20-minute patrol missions.",
      tradeoff: "Bearing lifespan ~600 h vs T-Motor ~1,500 h. Plan motor replacement at 150 h."
    },
    {
      id: "OPT-002",
      component: "GPS Module",
      original: { item: "Here3 CAN GPS (RTK-ready)", cost: 120.00 },
      alternative: { item: "Holybro M9N GPS + IST8310 combo", cost: 35.00 },
      savings: 85.00,
      riskLevel: "Low",
      reasoning: "RTK is overkill for farm patrol. The M9N gives 1.5 m CEP — more than adequate for waypoint missions with 5 m safety corridors.",
      tradeoff: "No RTK precision (< 2 cm). Acceptable for Phase 1."
    },
    {
      id: "OPT-003",
      component: "Telemetry Radio",
      original: { item: "RFD900x long-range radio set", cost: 180.00 },
      alternative: { item: "Holybro SiK 433 MHz V3 set", cost: 25.00 },
      savings: 155.00,
      riskLevel: "Medium",
      reasoning: "RFD900x has 40 km range — far beyond farm size or DGCA visual-line-of-sight requirements. SiK V3 at 300 m range is legally and practically sufficient.",
      tradeoff: "Max range 300 m vs 40 km. Adequate for 25-acre operations."
    },
    {
      id: "OPT-004",
      component: "Companion Computer",
      original: { item: "Raspberry Pi 4 (4 GB)", cost: 55.00 },
      alternative: { item: "ESP32-S3 DevKitC N16R8", cost: 8.00 },
      savings: 47.00,
      riskLevel: "Medium",
      reasoning: "RPi 4 adds Linux flexibility but draws 3 W continuously — reducing flight time by ~2 min. ESP32-S3 handles MJPEG streaming and MAVLink bridging within its PSRAM, draws 0.3 W.",
      tradeoff: "No Linux, no OpenCV on-board. Phase 2 AI vision module will need RPi 5 add-on."
    }
  ],
  phaseInvestments: [
    {
      phase: 1,
      label: "MVP Build (This Phase)",
      cost: 308.00,
      included: ["Autonomous waypoint flight", "1080p live streaming", "RTH + obstacle detection", "Manual charging"]
    },
    {
      phase: 2,
      label: "Auto-Charging Dock",
      estimatedAdditional: 80.00,
      included: ["3D-printed landing dock", "Contact-pad charger", "IR landing beacon", "Extended route planning"]
    },
    {
      phase: 3,
      label: "Precision Agriculture",
      estimatedAdditional: 250.00,
      included: ["Multispectral NDVI camera", "Onboard AI crop stress detection", "Farm management software API"]
    }
  ],
  riskFlags: [
    "🔴 HIGH: Do not cut cost on the battery — cheap cells in agricultural climates (50 °C ambient) are a fire hazard.",
    "🟡 MEDIUM: GPS accuracy depends on unobstructed sky view; additional 20 cm mast may be needed in dense orchards.",
    "🟢 LOW: Motor brand can be substituted if RacerStar 4-pack goes out of stock — see OPT-001 alternatives."
  ],
  shippingNotes: {
    estimatedShipping: 22.00,
    recommendations: [
      "Consolidate HobbyKing orders to one shipment — free shipping above $50.",
      "Holybro ships Pixhawk + GPS together as a bundle — saves ₹400 in customs clearance.",
      "Battery must ship via ground freight — air freight of LiPo restricted in India."
    ]
  }
};

const FARM_DRONE_WIRING_DATA = {
  schemaVersion: "2.0",
  droneModel: "Farm Patrol Autonomous Drone",
  powerRail: "4S LiPo (14.8 V nominal)",
  connections: [
    {
      id: "PWR-001",
      label: "Main Battery → Power Module",
      from_component: "Tattu 4S 5000 mAh Battery",
      from_pin: "XT60 Male (positive)",
      to_component: "Holybro Power Module",
      to_pin: "XT60 Female Battery IN",
      wire_color: "Red",
      wire_gauge: "14 AWG",
      voltage: "14.8 V nominal",
      current: "120 A peak",
      notes: "Main supply connection. Keep wire run < 15 cm to minimise inductance. Secure with cable tie every 5 cm.",
      safety: "Verify polarity before first connection. XT60 is keyed but double-check with multimeter."
    },
    {
      id: "PWR-002",
      label: "Power Module → PDB",
      from_component: "Holybro Power Module",
      from_pin: "XT60 Male Output",
      to_component: "Matek FCHUB-6S PDB",
      to_pin: "XT60 Female IN",
      wire_color: "Red/Black",
      wire_gauge: "14 AWG",
      voltage: "14.8 V nominal",
      current: "120 A peak",
      notes: "Run VBAT from power module to PDB. The power module senses current on this rail and reports to Pixhawk ADC."
    },
    {
      id: "PWR-003",
      label: "PDB → ESC 1 (Front Right — CW)",
      from_component: "Matek FCHUB-6S PDB",
      from_pin: "ESC Solder Pad A+",
      to_component: "ESC 1 (Front Right)",
      to_pin: "Power Lead +",
      wire_color: "Red",
      wire_gauge: "14 AWG",
      voltage: "14.8 V",
      current: "30 A",
      notes: "Front-right motor is CW rotation. Label ESC before mounting."
    },
    {
      id: "PWR-004",
      label: "PDB → ESC 2 (Rear Left — CW)",
      from_component: "Matek FCHUB-6S PDB",
      from_pin: "ESC Solder Pad B+",
      to_component: "ESC 2 (Rear Left)",
      to_pin: "Power Lead +",
      wire_color: "Red",
      wire_gauge: "14 AWG",
      voltage: "14.8 V",
      current: "30 A",
      notes: "Rear-left motor is CW rotation. Diagonal pair with ESC 1."
    },
    {
      id: "PWR-005",
      label: "PDB → ESC 3 (Front Left — CCW)",
      from_component: "Matek FCHUB-6S PDB",
      from_pin: "ESC Solder Pad C+",
      to_component: "ESC 3 (Front Left)",
      to_pin: "Power Lead +",
      wire_color: "Red",
      wire_gauge: "14 AWG",
      voltage: "14.8 V",
      current: "30 A",
      notes: "Front-left motor is CCW rotation."
    },
    {
      id: "PWR-006",
      label: "PDB → ESC 4 (Rear Right — CCW)",
      from_component: "Matek FCHUB-6S PDB",
      from_pin: "ESC Solder Pad D+",
      to_component: "ESC 4 (Rear Right)",
      to_pin: "Power Lead +",
      wire_color: "Red",
      wire_gauge: "14 AWG",
      voltage: "14.8 V",
      current: "30 A",
      notes: "Rear-right motor is CCW rotation."
    },
    {
      id: "PWR-007",
      label: "PDB 5 V BEC → Pixhawk POWER1",
      from_component: "Matek FCHUB-6S PDB",
      from_pin: "5 V BEC Output",
      to_component: "Pixhawk 6C",
      to_pin: "POWER1 6-pin JST-GH",
      wire_color: "Red (5 V) / Black (GND)",
      wire_gauge: "22 AWG",
      voltage: "5.1 V regulated",
      current: "2 A max",
      notes: "Uses the power module's regulated 5 V rail, not raw battery. Provides voltage + current ADC data to Pixhawk."
    },
    {
      id: "SIG-001",
      label: "ESC 1 PWM → Pixhawk MAIN OUT 1",
      from_component: "ESC 1 (Front Right)",
      from_pin: "Signal wire (White)",
      to_component: "Pixhawk 6C",
      to_pin: "MAIN OUT 1 (Signal pin)",
      wire_color: "White",
      wire_gauge: "26 AWG",
      voltage: "3.3 V signal",
      current: "< 5 mA",
      notes: "Connect signal wire only. ESC provides its own 5 V via BEC — do NOT connect ESC red BEC wire to Pixhawk rail (backfeed risk)."
    },
    {
      id: "SIG-002",
      label: "ESC 2 PWM → Pixhawk MAIN OUT 2",
      from_component: "ESC 2 (Rear Left)",
      from_pin: "Signal wire (White)",
      to_component: "Pixhawk 6C",
      to_pin: "MAIN OUT 2 (Signal pin)",
      wire_color: "White",
      wire_gauge: "26 AWG",
      voltage: "3.3 V signal",
      current: "< 5 mA",
      notes: "Same as SIG-001 — signal wire only."
    },
    {
      id: "SIG-003",
      label: "ESC 3 PWM → Pixhawk MAIN OUT 3",
      from_component: "ESC 3 (Front Left)",
      from_pin: "Signal wire (White)",
      to_component: "Pixhawk 6C",
      to_pin: "MAIN OUT 3 (Signal pin)",
      wire_color: "White",
      wire_gauge: "26 AWG",
      voltage: "3.3 V signal",
      current: "< 5 mA",
      notes: "Same as SIG-001 — signal wire only."
    },
    {
      id: "SIG-004",
      label: "ESC 4 PWM → Pixhawk MAIN OUT 4",
      from_component: "ESC 4 (Rear Right)",
      from_pin: "Signal wire (White)",
      to_component: "Pixhawk 6C",
      to_pin: "MAIN OUT 4 (Signal pin)",
      wire_color: "White",
      wire_gauge: "26 AWG",
      voltage: "3.3 V signal",
      current: "< 5 mA",
      notes: "Same as SIG-001 — signal wire only."
    },
    {
      id: "SIG-005",
      label: "Pixhawk TELEM2 → ESP32 UART",
      from_component: "Pixhawk 6C",
      from_pin: "TELEM2 TX (JST-GH pin 3)",
      to_component: "ESP32-S3 DevKitC",
      to_pin: "GPIO17 (U1RXD)",
      wire_color: "Yellow",
      wire_gauge: "24 AWG",
      voltage: "3.3 V",
      current: "< 20 mA",
      notes: "MAVLink 2.0 UART at 57,600 baud. TX on Pixhawk → RX on ESP32. Note: Pixhawk TELEM2 runs at 3.3 V — compatible with ESP32 directly."
    },
    {
      id: "SIG-006",
      label: "ESP32 UART → Pixhawk TELEM2",
      from_component: "ESP32-S3 DevKitC",
      from_pin: "GPIO16 (U1TXD)",
      to_component: "Pixhawk 6C",
      to_pin: "TELEM2 RX (JST-GH pin 2)",
      wire_color: "Green",
      wire_gauge: "24 AWG",
      voltage: "3.3 V",
      current: "< 20 mA",
      notes: "Return channel ESP32 → Pixhawk. Used for companion computer commands (e.g. mode switches, mission uploads)."
    },
    {
      id: "SIG-007",
      label: "Pixhawk GPS1 → u-blox M9N",
      from_component: "Pixhawk 6C",
      from_pin: "GPS1 Port (JST-GH 10-pin)",
      to_component: "u-blox M9N GPS + Compass",
      to_pin: "JST-GH 10-pin connector",
      wire_color: "Multi-colour ribbon",
      wire_gauge: "26 AWG",
      voltage: "5 V (supply) + 3.3 V (signal)",
      current: "50 mA",
      notes: "Plug-and-play cable included with M9N. Mount GPS module on top mast with clear sky view — minimum 5 cm above carbon arms."
    },
    {
      id: "SIG-008",
      label: "Pixhawk I2C → BMP280",
      from_component: "Pixhawk 6C",
      from_pin: "I2C2 Bus (SDA + SCL)",
      to_component: "BMP280 Barometer Module",
      to_pin: "SDA / SCL pins",
      wire_color: "Blue (SDA) / Orange (SCL)",
      wire_gauge: "26 AWG",
      voltage: "3.3 V",
      current: "2.7 µA",
      notes: "External barometer provides redundant altitude. Mount inside foam-padded cavity in enclosure to shield from rotor downwash."
    },
    {
      id: "SIG-009",
      label: "HC-SR04 → ESP32 (obstacle sensor)",
      from_component: "HC-SR04 Ultrasonic Sensor",
      from_pin: "TRIG / ECHO",
      to_component: "ESP32-S3 DevKitC",
      to_pin: "GPIO5 (TRIG) / GPIO18 (ECHO via divider)",
      wire_color: "Yellow (TRIG) / Green (ECHO)",
      wire_gauge: "24 AWG",
      voltage: "5 V supply; ECHO output needs 5 V→3.3 V divider (1k + 2k resistors)",
      current: "15 mA",
      notes: "⚠️ ECHO pin is 5 V logic — must use voltage divider before ESP32 GPIO (3.3 V max). Burn-in risk if skipped."
    },
    {
      id: "SIG-010",
      label: "RPi Camera → ESP32 MIPI-CSI",
      from_component: "Raspberry Pi Camera Module 3",
      from_pin: "15-pin MIPI-CSI FPC",
      to_component: "ESP32-S3 DevKitC",
      to_pin: "MIPI-CSI2 interface (J3 on DevKit)",
      wire_color: "FPC ribbon (15-pin, 15 cm)",
      wire_gauge: "FPC",
      voltage: "3.3 V (supply via DevKit)",
      current: "200 mA",
      notes: "Use 15 cm FPC for clean routing. Lock FPC latch firmly — a loose connection causes intermittent video drop. Mount camera on forward-facing nacelle."
    }
  ],
  assemblyOrder: [
    "1. Solder motor leads to ESCs — tin wires first, short joints.",
    "2. Solder ESC power leads to PDB pads — red to +, black to −.",
    "3. Connect XT60 from Power Module to PDB input.",
    "4. Run 5 V BEC cable from PDB to Pixhawk POWER1.",
    "5. Plug GPS cable into Pixhawk GPS1 port.",
    "6. Wire ESC signal lines to Pixhawk MAIN OUT 1–4.",
    "7. Connect TELEM2 UART cables between Pixhawk and ESP32.",
    "8. Connect HC-SR04 to ESP32 (with voltage divider on ECHO).",
    "9. Attach RPi Camera FPC to ESP32 MIPI connector.",
    "10. Final: connect battery last — always the final step before power-on."
  ],
  instructions: "Solder all power connections with lead-free solder. Use vibration dampeners under Pixhawk. Verify motor rotation direction before mounting propellers. Always connect battery last.",
  safetyWarnings: [
    "⚠️  ALWAYS connect battery LAST — after all wiring is complete and inspected.",
    "⚠️  NEVER power on with propellers installed during bench testing.",
    "⚠️  The HC-SR04 ECHO pin is 5 V — do not connect directly to ESP32 3.3 V GPIO.",
    "⚠️  Verify ESC motor rotation BEFORE fitting propellers using BLHeli Suite.",
    "⚠️  Use heat shrink on every solder joint — exposed copper near the battery is a short-circuit risk."
  ],
  ai_images: {
    status: "completed",
    breadboard: {
      url: "https://placehold.co/800x600/1e1e1e/0071e3?text=Pixhawk+6C+%E2%86%94+ESP32+Wiring",
      prompt: "Fritzing-style breadboard wiring diagram: Pixhawk 6C connected to ESP32-S3 via UART, HC-SR04 with voltage divider, RPi Camera Module 3",
      generated_at: "2026-06-21T14:16:33Z"
    },
    schematic: {
      url: "https://placehold.co/800x600/1e1e1e/00cc44?text=Power+Distribution+Schematic",
      prompt: "Clean electrical schematic: 4S LiPo to Power Module to PDB, 4x ESCs, 5V BEC to Pixhawk",
      generated_at: "2026-06-21T14:16:45Z"
    }
  }
};

// ============================================================
// CODE FILE CONTENTS
// ============================================================

const platformioIniContent = `[env:farm_drone_esp32s3]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
board_build.arduino.memory_type = qio_opi

lib_deps =
    mavlink/MAVLink@^2.0.0
    esp32-camera@^2.0.0
    ArduinoJson@^7.0.0
    ArduinoOTA

build_flags =
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue
    -DCONFIG_SPIRAM_SUPPORT=1
    -DCORE_DEBUG_LEVEL=3

monitor_speed = 115200
monitor_filters = esp32_exception_decoder
upload_speed = 921600

[env]
check_tool = clangtidy
check_flags = clangtidy: --checks=-*,clang-analyzer-*`;

const configHContent = `#pragma once

// ─── Wi-Fi Access Point ───────────────────────────────────────────
#define WIFI_SSID       "FarmPatrol-Drone"
#define WIFI_PASS       "FarmSecure2026"
#define WIFI_CHANNEL    6
#define WIFI_MAX_CLIENTS 4

// ─── Camera ───────────────────────────────────────────────────────
#define CAMERA_FRAME_SIZE FRAMESIZE_FHD   // 1920×1080
#define CAMERA_QUALITY    12              // 0–63 (lower = better quality)
#define CAMERA_FPS        30

// ─── MAVLink UART (Pixhawk TELEM2) ───────────────────────────────
#define PIX_UART_PORT   Serial2
#define PIX_BAUD        57600
#define PIX_TX_PIN      17
#define PIX_RX_PIN      16

// ─── Obstacle Sensor (HC-SR04) ────────────────────────────────────
#define US_TRIG_PIN     5
#define US_ECHO_PIN     18
#define OBSTACLE_HALT_CM 200   // Halt if object within 2 m
#define OBSTACLE_WARN_CM 300   // Warn at 3 m

// ─── LED Status Indicator ─────────────────────────────────────────
#define STATUS_LED_PIN  2

// ─── Battery Thresholds ───────────────────────────────────────────
#define BATT_WARN_PCT   30
#define BATT_RTH_PCT    20

// ─── System ───────────────────────────────────────────────────────
#define HEARTBEAT_INTERVAL_MS  1000
#define TELEMETRY_INTERVAL_MS  100
#define SENSOR_INTERVAL_MS     50`;

const mainCppContent = `// ╔══════════════════════════════════════════════════════════════════╗
// ║  Farm Patrol Drone — ESP32-S3 Companion Computer               ║
// ║  Responsibilities:                                              ║
// ║    • MJPEG live video streaming over Wi-Fi AP                  ║
// ║    • MAVLink 2.0 bridge to/from Pixhawk 6C                     ║
// ║    • HC-SR04 obstacle detection with Pixhawk halt command       ║
// ║    • WebSocket telemetry to mobile app (10 Hz)                  ║
// ║    • OTA firmware updates                                       ║
// ╚══════════════════════════════════════════════════════════════════╝

#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoOTA.h>
#include "config.h"
#include "camera_stream.h"
#include "mavlink_handler.h"
#include "obstacle_sensor.h"
#include "telemetry_server.h"
#include "status_led.h"

// ─── Global Singletons ─────────────────────────────────────────────
CameraStream      camStream;
MAVLinkHandler    mavlink;
ObstacleSensor    obstacle(US_TRIG_PIN, US_ECHO_PIN);
TelemetryServer   telemetry;
StatusLED         led(STATUS_LED_PIN);

// ─── Timing ────────────────────────────────────────────────────────
uint32_t lastHeartbeat  = 0;
uint32_t lastSensorRead = 0;
uint32_t lastTelemetry  = 0;

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\\n╔══════════════════════════════╗");
    Serial.println(  "║  Farm Patrol Drone v1.0      ║");
    Serial.println(  "║  ESP32-S3 Companion Boot     ║");
    Serial.println(  "╚══════════════════════════════╝\\n");

    // ── 1. MAVLink UART ──────────────────────────────────────────
    PIX_UART_PORT.begin(PIX_BAUD, SERIAL_8N1, PIX_RX_PIN, PIX_TX_PIN);
    mavlink.init(&PIX_UART_PORT);
    Serial.println("[OK] MAVLink UART initialised at " + String(PIX_BAUD) + " baud");

    // ── 2. Wi-Fi Access Point ────────────────────────────────────
    WiFi.softAP(WIFI_SSID, WIFI_PASS, WIFI_CHANNEL, 0, WIFI_MAX_CLIENTS);
    Serial.println("[OK] Wi-Fi AP: " + String(WIFI_SSID));
    Serial.println("     IP: " + WiFi.softAPIP().toString());

    // ── 3. Camera ────────────────────────────────────────────────
    if (!camStream.init()) {
        Serial.println("[ERR] Camera init failed! Check FPC cable.");
        led.blink(500); // Fast blink = camera error
    } else {
        Serial.println("[OK] Camera ready — " + camStream.getResolutionStr());
    }

    // ── 4. Telemetry WebSocket Server ────────────────────────────
    telemetry.begin(81);
    Serial.println("[OK] Telemetry WS on ws://" + WiFi.softAPIP().toString() + ":81");

    // ── 5. Camera HTTP Stream ────────────────────────────────────
    camStream.startServer(80);
    Serial.println("[OK] Video stream at http://" + WiFi.softAPIP().toString() + "/stream");

    // ── 6. OTA Updates ───────────────────────────────────────────
    ArduinoOTA.setHostname("farm-drone-esp32");
    ArduinoOTA.begin();
    Serial.println("[OK] OTA enabled — hostname: farm-drone-esp32");

    // ── 7. Status LED ────────────────────────────────────────────
    led.setMode(StatusLED::IDLE);
    Serial.println("\\n[READY] All systems nominal. Waiting for Pixhawk...");
}

void loop() {
    uint32_t now = millis();

    // ── Process MAVLink messages from Pixhawk ─────────────────────
    mavlink.update();

    // ── Send heartbeat to Pixhawk ────────────────────────────────
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        mavlink.sendHeartbeat();
        lastHeartbeat = now;
    }

    // ── Read obstacle sensor and halt if triggered ────────────────
    if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
        float dist_cm = obstacle.readCm();
        if (dist_cm > 0 && dist_cm < OBSTACLE_HALT_CM) {
            mavlink.sendHaltCommand();
            telemetry.sendObstacleAlert(dist_cm);
            led.setMode(StatusLED::OBSTACLE);
        } else {
            led.setMode(mavlink.isArmed() ? StatusLED::FLYING : StatusLED::IDLE);
        }
        lastSensorRead = now;
    }

    // ── Broadcast telemetry to mobile app ─────────────────────────
    if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
        telemetry.broadcast(mavlink.getState());
        lastTelemetry = now;
    }

    // ── Handle camera client requests ─────────────────────────────
    camStream.handleClients();

    // ── Handle OTA ───────────────────────────────────────────────
    ArduinoOTA.handle();
}`;

const mavlinkHandlerCppContent = `#include "mavlink_handler.h"
#include <mavlink.h>
#include "config.h"

void MAVLinkHandler::init(HardwareSerial* serial) {
    _serial = serial;
    _sysId = 255;         // GCS system ID
    _compId = MAV_COMP_ID_ONBOARD_COMPUTER;
    _targetSysId  = 1;    // Pixhawk system ID
    _targetCompId = 1;    // Pixhawk autopilot component
    Serial.println("[MAVLink] Handler initialised");
}

void MAVLinkHandler::update() {
    mavlink_message_t msg;
    mavlink_status_t  status;

    while (_serial->available()) {
        uint8_t c = _serial->read();
        if (mavlink_parse_char(MAVLINK_COMM_0, c, &msg, &status)) {
            _handleMessage(&msg);
        }
    }
}

void MAVLinkHandler::_handleMessage(mavlink_message_t* msg) {
    switch (msg->msgid) {

        case MAVLINK_MSG_ID_HEARTBEAT: {
            mavlink_heartbeat_t hb;
            mavlink_msg_heartbeat_decode(msg, &hb);
            _lastHeartbeatMs = millis();
            _armed   = hb.base_mode & MAV_MODE_FLAG_SAFETY_ARMED;
            _mode    = hb.custom_mode;
            _status  = hb.system_status;
            break;
        }

        case MAVLINK_MSG_ID_SYS_STATUS: {
            mavlink_sys_status_t sys;
            mavlink_msg_sys_status_decode(msg, &sys);
            _battVoltage = sys.voltage_battery / 1000.0f;
            _battPercent = sys.battery_remaining;
            if (_battPercent <= BATT_RTH_PCT) {
                Serial.printf("[BATT] CRITICAL %d%% — RTH should trigger\\n", _battPercent);
            } else if (_battPercent <= BATT_WARN_PCT) {
                Serial.printf("[BATT] WARNING %d%%\\n", _battPercent);
            }
            break;
        }

        case MAVLINK_MSG_ID_GPS_RAW_INT: {
            mavlink_gps_raw_int_t gps;
            mavlink_msg_gps_raw_int_decode(msg, &gps);
            _latitude   = gps.lat / 1e7;
            _longitude  = gps.lon / 1e7;
            _altitude_m = gps.alt / 1000.0f;
            _satellites = gps.satellites_visible;
            _gpsFix     = gps.fix_type;
            break;
        }

        case MAVLINK_MSG_ID_ATTITUDE: {
            mavlink_attitude_t att;
            mavlink_msg_attitude_decode(msg, &att);
            _roll_deg  = att.roll  * RAD_TO_DEG;
            _pitch_deg = att.pitch * RAD_TO_DEG;
            _yaw_deg   = att.yaw   * RAD_TO_DEG;
            break;
        }

        case MAVLINK_MSG_ID_VFR_HUD: {
            mavlink_vfr_hud_t hud;
            mavlink_msg_vfr_hud_decode(msg, &hud);
            _airspeed_ms  = hud.airspeed;
            _groundspeed_ms = hud.groundspeed;
            _heading_deg  = hud.heading;
            _throttlePct  = hud.throttle;
            _climbRate_ms = hud.climb;
            break;
        }
    }
}

void MAVLinkHandler::sendHeartbeat() {
    mavlink_message_t msg;
    uint8_t buf[MAVLINK_MAX_PACKET_LEN];
    mavlink_msg_heartbeat_pack(
        _sysId, _compId, &msg,
        MAV_TYPE_ONBOARD_CONTROLLER,
        MAV_AUTOPILOT_INVALID,
        0, 0,
        MAV_STATE_ACTIVE
    );
    uint16_t len = mavlink_msg_to_send_buffer(buf, &msg);
    _serial->write(buf, len);
}

void MAVLinkHandler::sendHaltCommand() {
    // Send SET_MODE to BRAKE (ArduCopter mode 17)
    mavlink_message_t msg;
    uint8_t buf[MAVLINK_MAX_PACKET_LEN];
    mavlink_msg_set_mode_pack(
        _sysId, _compId, &msg,
        _targetSysId,
        MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
        17 // BRAKE mode in ArduCopter
    );
    uint16_t len = mavlink_msg_to_send_buffer(buf, &msg);
    _serial->write(buf, len);
    Serial.println("[MAVLink] BRAKE mode sent — obstacle halt");
}`;

const obstacleSensorCppContent = `#include "obstacle_sensor.h"
#include <Arduino.h>

ObstacleSensor::ObstacleSensor(uint8_t trigPin, uint8_t echoPin)
    : _trig(trigPin), _echo(echoPin) {
    pinMode(_trig, OUTPUT);
    pinMode(_echo, INPUT);
    digitalWrite(_trig, LOW);
}

float ObstacleSensor::readCm() {
    // Send 10 µs trigger pulse
    digitalWrite(_trig, LOW);
    delayMicroseconds(2);
    digitalWrite(_trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trig, LOW);

    // Measure echo pulse width (timeout = 25 ms → 430 cm max)
    long duration = pulseIn(_echo, HIGH, 25000UL);
    if (duration == 0) return -1.0f; // No echo / out of range

    float distance_cm = (duration * 0.0343f) / 2.0f;

    // Reject obviously bad readings
    if (distance_cm < 2.0f || distance_cm > 400.0f) return -1.0f;

    // Exponential moving average for stability
    _filtered = (_filtered * 0.8f) + (distance_cm * 0.2f);
    return _filtered;
}

bool ObstacleSensor::isBlocked() {
    float d = readCm();
    return (d > 0 && d < _haltThresholdCm);
}`;

const telemetryServerCppContent = `#include "telemetry_server.h"
#include <ArduinoJson.h>

void TelemetryServer::begin(uint16_t port) {
    _ws = new AsyncWebServer(port);
    _wsHandler = new AsyncWebSocket("/");
    _ws->addHandler(_wsHandler);
    _ws->begin();
    Serial.println("[WS] Telemetry server on port " + String(port));
}

void TelemetryServer::broadcast(const DroneState& state) {
    if (_wsHandler->count() == 0) return;

    JsonDocument doc;
    doc["t"]          = millis();
    doc["armed"]      = state.armed;
    doc["mode"]       = state.modeName;
    doc["batt_v"]     = serialized(String(state.battVoltage, 2));
    doc["batt_pct"]   = state.battPercent;
    doc["lat"]        = serialized(String(state.latitude, 7));
    doc["lon"]        = serialized(String(state.longitude, 7));
    doc["alt_m"]      = serialized(String(state.altitude_m, 1));
    doc["sats"]       = state.satellites;
    doc["gps_fix"]    = state.gpsFix;
    doc["roll"]       = serialized(String(state.roll_deg, 1));
    doc["pitch"]      = serialized(String(state.pitch_deg, 1));
    doc["yaw"]        = serialized(String(state.yaw_deg, 1));
    doc["spd_ms"]     = serialized(String(state.groundspeed_ms, 1));
    doc["hdg"]        = state.heading_deg;
    doc["throttle"]   = state.throttlePct;
    doc["climb_ms"]   = serialized(String(state.climbRate_ms, 2));

    String output;
    serializeJson(doc, output);
    _wsHandler->textAll(output);
}

void TelemetryServer::sendObstacleAlert(float distanceCm) {
    if (_wsHandler->count() == 0) return;

    JsonDocument doc;
    doc["alert"]    = "OBSTACLE_DETECTED";
    doc["dist_cm"]  = serialized(String(distanceCm, 1));
    doc["action"]   = "BRAKE";
    doc["t"]        = millis();

    String output;
    serializeJson(doc, output);
    _wsHandler->textAll(output);
}`;

const FARM_DRONE_CODE_CONTAINER_DATA = {
  projectName: "Farm Patrol Drone — ESP32-S3 Companion Firmware",
  framework: "Arduino / PlatformIO",
  targetBoard: "esp32-s3-devkitc-1",
  sdkVersion: "ESP-IDF 5.2",
  mavlinkVersion: "2.0",
  files: [
    { path: "platformio.ini", content: platformioIniContent },
    { path: "include/config.h", content: configHContent },
    { path: "src/main.cpp", content: mainCppContent },
    { path: "src/mavlink_handler.cpp", content: mavlinkHandlerCppContent },
    { path: "src/obstacle_sensor.cpp", content: obstacleSensorCppContent },
    { path: "src/telemetry_server.cpp", content: telemetryServerCppContent }
  ]
};

// ============================================================
// ENCLOSURE CAD CONTENTS
// ============================================================

export const pixhawkCaseScadContent = `// ══════════════════════════════════════════════════════════
// Pixhawk 6C Protective Enclosure with Snap-Fit Lid
// Print in PETG, 0.2 mm layers, 35 % Gyroid infill
// ══════════════════════════════════════════════════════════

// PCB dimensions (Pixhawk 6C)
pcb_l = 84;     // mm
pcb_w = 44;     // mm
pcb_h = 20;     // mm (including connectors on top)

// Clearance and walls
clearance   = 1.5;
wall        = 2.5;
boss_h      = 3;    // standoff height below PCB
mount_hole  = 3.5;  // M3 clearance hole
lid_lip     = 1.5;  // snap-fit lip depth

// Derived outer dimensions
outer_l = pcb_l + 2*wall + 2*clearance;
outer_w = pcb_w + 2*wall + 2*clearance;
outer_h = pcb_h + boss_h + wall + clearance;

$fn = 36;

module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

module m3_boss() {
    // Threaded insert boss — 5.5 mm OD, 3.5 mm bore
    difference() {
        cylinder(r=4, h=boss_h);
        cylinder(r=1.75, h=boss_h+1);
    }
}

module pixhawk_base() {
    difference() {
        // Outer shell
        rounded_box(outer_l, outer_w, outer_h - lid_lip, 4);

        // Interior cavity
        translate([wall, wall, wall + boss_h])
            rounded_box(pcb_l + 2*clearance, pcb_w + 2*clearance,
                        pcb_h + clearance + 1, 3);

        // USB-C access port (right side)
        translate([outer_l - wall - 0.5, outer_w/2 - 5, wall + boss_h + 2])
            cube([wall + 1, 10, 6]);

        // TELEM1/2 port cutout (left side)
        translate([-0.5, outer_w/2 - 14, wall + boss_h + 2])
            cube([wall + 1, 28, 8]);

        // GPS/I2C port cutout (rear)
        translate([outer_l/2 - 8, -0.5, wall + boss_h + 2])
            cube([16, wall + 1, 8]);

        // Power module port cutout (front)
        translate([outer_l/2 - 6, outer_w - wall - 0.5, wall + boss_h + 2])
            cube([12, wall + 1, 6]);

        // Ventilation slots (bottom)
        for (i = [0:4])
            translate([10 + i*14, outer_w/2 - 8, -0.5])
                cube([6, 16, wall + 1]);

        // M3 mounting holes in flanges
        for (x = [8, outer_l - 8]) for (y = [8, outer_w - 8])
            translate([x, y, -0.5]) cylinder(r=mount_hole/2, h=wall+1);
    }

    // PCB standoff bosses
    for (x = [wall + clearance + 3.5, wall + clearance + pcb_l - 3.5])
        for (y = [wall + clearance + pcb_w - 3.5])
            translate([x, y, wall]) m3_boss();

    // Snap-fit rails on interior lip
    translate([wall - 0.5, wall - 0.5, outer_h - lid_lip*2])
        cube([0.5, outer_w - wall, lid_lip]);
    translate([outer_l - wall, wall - 0.5, outer_h - lid_lip*2])
        cube([0.5, outer_w - wall, lid_lip]);
}

module pixhawk_lid() {
    difference() {
        rounded_box(outer_l, outer_w, wall + lid_lip, 4);
        // Label recess
        translate([outer_l/2 - 20, outer_w/2 - 6, -0.5])
            cube([40, 12, 1]);
    }
    // Snap-fit tongues
    translate([wall, wall, wall])
        cube([1, outer_w - 2*wall, lid_lip]);
    translate([outer_l - wall - 1, wall, wall])
        cube([1, outer_w - 2*wall, lid_lip]);
}

// Render both parts
pixhawk_base();
translate([0, outer_w + 10, 0]) pixhawk_lid();`;

export const esp32CameraNacelleScadContent = `// ══════════════════════════════════════════════════════════
// ESP32-S3 + RPi Camera Module 3 Nacelle
// Forward-facing camera with 10° downward tilt
// Integrated FPC cable routing channel
// ══════════════════════════════════════════════════════════

esp_l = 27;   esp_w = 25;   esp_h = 10;
cam_l = 25;   cam_w = 24;   cam_h = 11.5;
wall  = 2.0;
cam_tilt_deg = 10;  // degrees downward
fpc_w = 5.5;        // FPC ribbon width

$fn = 36;

module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

module fpc_channel() {
    // Slot for 15 cm FPC ribbon between camera and ESP32
    translate([0, 0, 0])
        cube([fpc_w + 1, 20, 2.5]);
}

module camera_cell() {
    // Camera module pocket with front glass aperture
    difference() {
        rounded_box(cam_l + 2*wall, cam_w + 2*wall, cam_h + wall, 3);
        // Camera cavity
        translate([wall, wall, wall])
            cube([cam_l, cam_w, cam_h + 1]);
        // Lens aperture hole (8 mm diameter)
        translate([cam_l/2 + wall, cam_w/2 + wall, -0.5])
            cylinder(r=4, h=wall + 1);
        // FPC exit slot at rear
        translate([(cam_l + 2*wall)/2 - fpc_w/2, cam_w + wall - 1, wall/2])
            cube([fpc_w, wall + 1, 3]);
    }
}

module esp32_cell() {
    // ESP32-S3 board pocket
    difference() {
        rounded_box(esp_l + 2*wall, esp_w + 2*wall, esp_h + wall, 3);
        // PCB cavity
        translate([wall, wall, wall])
            cube([esp_l, esp_w, esp_h + 1]);
        // USB-C access slot on end
        translate([(esp_l + 2*wall)/2 - 5, esp_w + wall - 0.5, wall + 1])
            cube([10, wall + 1, 5]);
        // FPC entry slot at front
        translate([(esp_l + 2*wall)/2 - fpc_w/2, -0.5, wall/2])
            cube([fpc_w, wall + 1, 3]);
        // M2 mounting holes
        for (x = [3, esp_l + 2*wall - 3]) for (y = [3, esp_w + 2*wall - 3])
            translate([x, y, -0.5]) cylinder(r=1.2, h=wall + 1);
    }
}

module nacelle_assembly() {
    // Camera section (tilted forward 10°)
    rotate([cam_tilt_deg, 0, 0])
        camera_cell();

    // FPC channel bridge
    translate([(cam_l + 2*wall)/2 - fpc_w/2, cam_w + 2*wall, 0])
        fpc_channel();

    // ESP32 section (behind camera)
    translate([0, cam_w + 2*wall + 20, 0])
        esp32_cell();

    // Drone-mount tab (for frame arm attachment)
    difference() {
        translate([-2, (cam_w + esp_w)/2 + wall, -wall])
            cube([esp_l + 2*wall + 4, 4, wall + 5]);
        // M3 mount slot
        translate([esp_l/2 + wall, (cam_w + esp_w)/2 + wall + 1, -wall - 0.5])
            cylinder(r=1.75, h=wall + 7);
    }
}

nacelle_assembly();`;

export const gpsMastMountScadContent = `// ══════════════════════════════════════════════════════════
// GPS Mast Mount — u-blox M9N
// Positions GPS 60 mm above frame top plate
// Twist-lock base fits F450 centre plate M3 standoffs
// ══════════════════════════════════════════════════════════

mast_h        = 60;  // elevation above frame
mast_od       = 12;
mast_id       = 8;
gps_od        = 36;  // M9N module diameter
gps_h         = 8;
base_d        = 40;
base_h        = 8;
base_slot_w   = 33;  // F450 standoff spacing

$fn = 48;

module mast() {
    difference() {
        cylinder(r=mast_od/2, h=mast_h);
        // Hollow core for cable routing
        cylinder(r=mast_id/2, h=mast_h + 1);
        // JST-GH cable exit slot at base
        translate([-3, -mast_od/2 - 0.5, 5])
            cube([6, mast_od + 1, 8]);
    }
}

module gps_head() {
    // Circular top plate for M9N module
    difference() {
        union() {
            cylinder(r=gps_od/2 + 2, h=gps_h);
            // Raised rim to retain module
            cylinder(r=gps_od/2, h=gps_h + 2);
        }
        // Module cavity
        translate([0, 0, 3])
            cylinder(r=gps_od/2 - 0.5, h=gps_h);
        // Cable pass-through to mast
        cylinder(r=mast_id/2, h=gps_h + 3);
        // Two M2 retention screws
        for (a = [45, 225])
            rotate([0, 0, a])
                translate([gps_od/2 - 2, 0, -0.5])
                    cylinder(r=1.2, h=gps_h + 4);
    }
}

module base_plate() {
    // Square base with 30.5 mm F450 bolt pattern
    difference() {
        union() {
            cylinder(r=base_d/2, h=base_h);
            // Stiffening ribs
            for (a = [0, 90])
                rotate([0, 0, a])
                    cube([base_d, 3, base_h], center=true);
        }
        // M3 clearance holes on 30.5 mm pattern
        for (x = [-15.25, 15.25]) for (y = [-15.25, 15.25])
            translate([x, y, -0.5]) cylinder(r=1.75, h=base_h + 1);
        // M3 countersink
        for (x = [-15.25, 15.25]) for (y = [-15.25, 15.25])
            translate([x, y, base_h - 2]) cylinder(r1=1.75, r2=3.5, h=2.5);
        // Cable pass-through to mast core
        cylinder(r=mast_id/2, h=base_h + 1);
    }
}

// Full assembly
base_plate();
translate([0, 0, base_h]) mast();
translate([0, 0, base_h + mast_h]) gps_head();`;

export const landingLegSetScadContent = `// ══════════════════════════════════════════════════════════
// Shock-Absorbing Landing Legs (×4 set)
// Flex node at ankle dissipates landing energy
// Print 4 copies. Material: PETG for flex node stiffness.
// ══════════════════════════════════════════════════════════

leg_h         = 80;  // total leg height
leg_od        = 10;
leg_id        = 6;   // hollow for weight reduction
flex_w        = 4;   // flex node width (thinner = more flex)
flex_h        = 12;  // flex node height
foot_r        = 18;  // foot pad radius
foot_h        = 5;
arm_w         = 16;  // frame arm clamp width
arm_clamp_h   = 20;
bolt_d        = 3.5; // M3 clamp bolt

$fn = 32;

module flex_node() {
    // Slim cross-section ankle joint — acts as leaf spring
    hull() {
        translate([-flex_w/2, -leg_od/2, 0])  cube([flex_w, leg_od, 1]);
        translate([-leg_od/2, -leg_od/2, flex_h]) cube([leg_od, leg_od, 1]);
    }
}

module foot_pad() {
    // Rubberised-profile foot for grip on soft soil
    difference() {
        union() {
            cylinder(r=foot_r, h=foot_h);
            // Central boss for leg attachment
            cylinder(r=leg_od/2 + 1, h=foot_h + 4);
        }
        // Tread grooves for grip
        for (a = [0:30:150])
            rotate([0, 0, a])
                translate([-foot_r, -1, -0.5])
                    cube([foot_r*2, 2, 3]);
        // Hollow leg socket
        cylinder(r=leg_od/2, h=foot_h + 5);
    }
}

module upper_leg() {
    // Hollow tube from ankle to arm clamp
    difference() {
        cylinder(r=leg_od/2, h=leg_h - flex_h - foot_h);
        cylinder(r=leg_id/2, h=leg_h);
    }
}

module arm_clamp() {
    // Saddle clamp — wraps around F450 arm tube (16 mm OD)
    clamp_r = arm_w/2 + 1;
    difference() {
        union() {
            // Clamp body
            translate([-clamp_r, -clamp_r, 0])
                cube([clamp_r*2, clamp_r + 8, arm_clamp_h]);
            // Flange for leg tube
            cylinder(r=leg_od/2 + 2, h=arm_clamp_h);
        }
        // Arm groove
        translate([0, 0, arm_clamp_h/2])
            rotate([90, 0, 0])
                cylinder(r=arm_w/2, h=clamp_r*2 + 10, center=true);
        // M3 bolt holes (×2) for clamp tightening
        for (y = [2, arm_clamp_h - 6])
            translate([-clamp_r - 0.5, 2, y])
                rotate([0, 90, 0]) cylinder(r=bolt_d/2, h=clamp_r*2 + 1);
        // Leg socket through centre
        cylinder(r=leg_od/2 - 0.5, h=arm_clamp_h + 1);
    }
}

// Single leg assembly
module landing_leg() {
    // Bottom to top: foot → flex node → upper leg → arm clamp
    foot_pad();
    translate([0, 0, foot_h + 2]) flex_node();
    translate([0, 0, foot_h + flex_h + 2]) upper_leg();
    translate([0, 0, leg_h - arm_clamp_h + 2]) arm_clamp();
}

// Print all 4 legs spaced on build plate
for (i = [0:3])
    translate([i * 45, 0, 0]) landing_leg();`;

export const batteryTrayScadContent = `// ══════════════════════════════════════════════════════════
// Battery Tray — Tattu 4S 5000 mAh (158 × 46 × 42 mm)
// Features:
//   - Exact-fit recess keeps battery from sliding
//   - 25 mm Velcro strap slots (×2)
//   - XT60 cable guide to keep plug accessible
//   - Mounts to F450 bottom plate via 30.5 mm bolt pattern
// ══════════════════════════════════════════════════════════

// Tattu 4S 5000 mAh dimensions + clearance
batt_l  = 158 + 2;  // 160
batt_w  =  46 + 2;  //  48
batt_h  =  42 + 2;  //  44

wall        = 2.5;
strap_w     = 27;   // Velcro strap slot width
strap_h     = 6;    // Velcro strap slot height
xt60_w      = 16;   // XT60 plug clearance
xt60_h      = 14;
mount_pitch = 30.5; // F450 bottom plate bolt pitch

$fn = 32;

module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

module battery_tray() {
    outer_l = batt_l + 2*wall;
    outer_w = batt_w + 2*wall;
    outer_h = batt_h/2 + wall;  // Open top — battery slides in from above

    difference() {
        rounded_box(outer_l, outer_w, outer_h, 5);

        // Battery recess cavity (open top)
        translate([wall, wall, wall])
            cube([batt_l, batt_w, batt_h + 1]);

        // Velcro strap slots — front
        translate([outer_l/2 - strap_w/2, -0.5, outer_h/2 - strap_h/2])
            cube([strap_w, outer_w + 1, strap_h]);

        // Velcro strap slots — rear
        translate([outer_l/2 - strap_w/2, -0.5, outer_h - strap_h - 4])
            cube([strap_w, outer_w + 1, strap_h]);

        // XT60 cable guide on right end
        translate([outer_l - wall - 0.5, outer_w/2 - xt60_w/2, wall])
            cube([wall + 1, xt60_w, xt60_h]);

        // Weight relief cutouts in base
        for (i = [-1, 1])
            translate([outer_l/2 + i*30, outer_w/2, -0.5])
                cylinder(r=12, h=wall + 1);

        // F450 mounting holes (30.5 mm pattern)
        for (x = [outer_l/2 - mount_pitch/2, outer_l/2 + mount_pitch/2])
            for (y = [outer_w/2 - mount_pitch/2, outer_w/2 + mount_pitch/2])
                translate([x, y, -0.5]) cylinder(r=1.75, h=wall + 1);
    }

    // Low-profile side walls to retain battery laterally
    translate([wall, wall, outer_h])
        difference() {
            cube([batt_l, batt_w, 8]);
            translate([2, 2, -0.5]) cube([batt_l-4, batt_w-4, 9]);
        }
}

battery_tray();`;

// ============================================================
// IMPROVED "AERO SERIES" ENCLOSURE CONSTANTS
// ============================================================

const improvedPixhawkCaseScadContent = `// ══════════════════════════════════════════════════════════
//  PIXHAWK 6C FLIGHT CONTROLLER ENCLOSURE — "Aero" Series
//  Modern smooth-shell design with integrated cooling fins,
//  soft-touch dome lid, and engineered snap-fit closure.
//
//  Print:  PETG, 0.2 mm layers, 3 perimeters, 35% gyroid infill
//  Parts:  pixhawk_base() + pixhawk_lid()  (print both, separately)
// ══════════════════════════════════════════════════════════

/* [PCB Dimensions — Pixhawk 6C] */
pcb_l = 84;      // board length (mm)
pcb_w = 44;      // board width (mm)
pcb_h = 20;      // board height incl. tallest connector (mm)

/* [Shell Styling] */
clearance     = 1.5;   // air gap around PCB
wall          = 2.2;   // shell wall thickness
boss_h        = 3;     // standoff height under PCB
corner_r      = 7;     // outer corner roundness (the "modern" look)
top_chamfer   = 3.5;   // how much the lid domes/tapers inward at top
fin_count     = 9;     // cooling fins on the base underside
fin_depth     = 0.8;   // fin relief depth

/* [Snap-Fit] */
snap_h        = 1.6;   // vertical engagement depth of the snap bead
snap_protrude = 0.9;   // how far the bead sticks out
lid_wall      = 2.0;   // lid shell thickness

$fn = 64;

// ── derived dimensions ─────────────────────────────────────
outer_l   = pcb_l + 2*wall + 2*clearance;
outer_w   = pcb_w + 2*wall + 2*clearance;
body_h    = pcb_h + boss_h + wall + clearance;   // base body height (no lid)

// ── helpers ─────────────────────────────────────────────────

// Rounded rectangle footprint, swept to height h, with full corner roundness r
module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

// Same as rounded_box but the TOP edge also gets a small chamfer/dome,
// giving the part a soft, modern "pebble" silhouette instead of a slab.
module domed_box(l, w, h, r, dome) {
    hull() {
        // base ring
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=0.01);
        // shrunk top ring, lifted up — creates the inward taper
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, h]) cylinder(r=max(r-dome,0.5), h=0.01);
    }
}

module m3_boss() {
    difference() {
        cylinder(r=4, h=boss_h);
        cylinder(r=1.75, h=boss_h+1);
    }
}

// A single angled cooling fin groove (modern speaker-grille style)
module fin_groove() {
    rotate([0, 0, 25])
        cube([outer_w*1.4, 1.4, fin_depth*2], center=true);
}

// ══════════════════════════════════════════════════════════
//  BASE SHELL
// ══════════════════════════════════════════════════════════
module pixhawk_base() {
    difference() {
        union() {
            // Main body — straight rounded walls
            rounded_box(outer_l, outer_w, body_h, corner_r);
        }

        // Interior cavity for PCB
        translate([wall, wall, wall + boss_h])
            rounded_box(pcb_l + 2*clearance, pcb_w + 2*clearance,
                        pcb_h + clearance + 2, corner_r - wall);

        // USB-C access port (right side)
        translate([outer_l - wall - 0.5, outer_w/2 - 5, wall + boss_h + 2])
            cube([wall + 1, 10, 6]);

        // TELEM1/2 port cutout (left side)
        translate([-0.5, outer_w/2 - 14, wall + boss_h + 2])
            cube([wall + 1, 28, 8]);

        // GPS/I2C port cutout (rear)
        translate([outer_l/2 - 8, -0.5, wall + boss_h + 2])
            cube([16, wall + 1, 8]);

        // Power module port cutout (front)
        translate([outer_l/2 - 6, outer_w - wall - 0.5, wall + boss_h + 2])
            cube([12, wall + 1, 6]);

        // Modern angled cooling-fin slots on the underside (replaces plain holes)
        for (i = [0:fin_count-1])
            translate([10 + i*((outer_l-20)/fin_count), outer_w/2, 0.3])
                fin_groove();

        // M3 mounting holes in corner flanges, countersunk
        for (x = [9, outer_l - 9]) for (y = [9, outer_w - 9]) {
            translate([x, y, -0.5]) cylinder(r=1.75, h=wall+1);
            translate([x, y, -0.5]) cylinder(r1=3.4, r2=1.75, h=2.2);
        }

        // Snap-fit receiving groove around the inner top rim
        translate([0, 0, body_h - snap_h])
            difference() {
                rounded_box(outer_l + 1, outer_w + 1, snap_h + 0.5, corner_r);
                rounded_box(outer_l - 2*lid_wall + 0.4, outer_w - 2*lid_wall + 0.4,
                            snap_h + 1, max(corner_r - lid_wall, 1));
            }
    }

    // PCB standoff bosses (all 4 corners of the board for stability)
    for (x = [wall + clearance + 4, wall + clearance + pcb_l - 4])
        for (y = [wall + clearance + 4, wall + clearance + pcb_w - 4])
            translate([x, y, wall]) m3_boss();

    // Subtle brand rib detail on the front face (purely aesthetic)
    translate([outer_l/2, -0.3, body_h - 8])
        rotate([90,0,0])
        linear_extrude(0.6)
            for (i=[-1:1])
                translate([i*6,0]) square([2.5, 5], center=true);
}

// ══════════════════════════════════════════════════════════
//  DOMED LID  — soft pebble top with engineered snap bead
// ══════════════════════════════════════════════════════════
module pixhawk_lid() {
    lid_h = 6;
    difference() {
        domed_box(outer_l - 0.4, outer_w - 0.4, lid_h, corner_r, top_chamfer);

        // Recessed label plate (modern minimal nameplate area)
        translate([outer_l/2 - 22, outer_w/2 - 7, lid_h - 0.6])
            linear_extrude(1)
                offset(r=1) square([44, 14], center=false);

        // Hollow underside to save material / weight
        translate([wall, wall, -0.5])
            rounded_box(outer_l - 2*wall - 0.4, outer_w - 2*wall - 0.4, lid_h - 1.4,
                        max(corner_r - wall, 1));
    }

    // Snap-fit bead running around the lid skirt — engages the base groove
    translate([0, 0, -snap_h + 0.2])
        difference() {
            rounded_box(outer_l - 2*lid_wall + 0.2 + snap_protrude*2,
                        outer_w - 2*lid_wall + 0.2 + snap_protrude*2,
                        snap_h, max(corner_r - lid_wall, 1));
            rounded_box(outer_l - 2*lid_wall - 0.2,
                        outer_w - 2*lid_wall - 0.2,
                        snap_h + 1, max(corner_r - lid_wall - 1, 0.5));
        }

    // Lid skirt wall that drops down inside the base opening
    translate([lid_wall, lid_wall, -snap_h])
        difference() {
            rounded_box(outer_l - 2*lid_wall, outer_w - 2*lid_wall, snap_h + 0.2,
                        max(corner_r - lid_wall, 1));
            translate([1, 1, -0.5])
                rounded_box(outer_l - 2*lid_wall - 2, outer_w - 2*lid_wall - 2, snap_h + 1.2,
                            max(corner_r - lid_wall - 1, 0.5));
        }
}

// ── Render layout: base + lid side by side for printing ────
pixhawk_base();
translate([0, outer_w + 12, 0]) pixhawk_lid();`;

const improvedEsp32CameraNacelleScadContent = `// ══════════════════════════════════════════════════════════
//  ESP32-S3 + RPi CAMERA MODULE 3 NACELLE — "Aero" Series
//  Streamlined sensor pod: rounded nose cowling with lens
//  barrel + sun-visor, smooth shoulder loft into the
//  electronics bay, integrated FPC channel.
//
//  Print:  PETG, 0.2 mm layers, 3 perimeters, 30% infill
//  Mount:  M3 to frame arm via base keel
// ══════════════════════════════════════════════════════════

/* [Component Dimensions] */
esp_l = 27;   esp_w = 25;   esp_h = 10;
cam_l = 25;   cam_w = 24;   cam_h = 11.5;

/* [Styling] */
wall          = 1.8;
cam_tilt_deg  = 10;     // forward-down camera rake angle
fpc_w         = 5.5;    // ribbon cable width
corner_r      = 5;      // body corner roundness
visor_depth   = 5;      // lens sun-visor overhang
visor_thick   = 2.2;

$fn = 64;

// ── derived cell sizes ──────────────────────────────────────
cam_cell_l = cam_l + 2*wall;
cam_cell_w = cam_w + 2*wall;
cam_cell_h = cam_h + wall;

esp_cell_l = esp_l + 2*wall;
esp_cell_w = esp_w + 2*wall;
esp_cell_h = esp_h + wall;

// ── helpers ──────────────────────────────────────────────────
module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

module fpc_channel() {
    cube([fpc_w + 1, 22, 2.5]);
}

// ══════════════════════════════════════════════════════════
//  CAMERA NOSE — rounded cowling with lens barrel + sun-visor
//  NOTE: the nose/lens faces -Y (outward, away from the ESP
//  bay which sits at +Y). FPC exits toward +Y into the shoulder.
// ══════════════════════════════════════════════════════════
module camera_cell() {
    difference() {
        union() {
            rounded_box(cam_cell_l, cam_cell_w, cam_cell_h, corner_r);

            // Lens barrel boss protruding from the OUTER front face (-Y, modern sensor look)
            translate([cam_cell_l/2, -0.1, cam_cell_h/2 - 1])
                rotate([-90,0,0])
                    cylinder(r=6, h=2.2);

            // Sun-visor lip — sits above the lens boss, cantilevered out over -Y face
            translate([cam_cell_l/2 - 8, -visor_depth + 1.8, cam_cell_h - 4.5])
                cube([16, visor_depth, visor_thick]);
        }

        // Camera cavity
        translate([wall, wall, wall])
            cube([cam_l, cam_w, cam_h + 1]);

        // Lens aperture — drilled straight through the boss and front (-Y) wall
        translate([cam_cell_l/2, -3, cam_cell_h/2 - 1])
            rotate([-90,0,0])
                cylinder(r=4.2, h=10, center=true);

        // FPC exit slot at rear (+Y, toward shoulder/ESP bay), centred
        translate([cam_cell_l/2 - fpc_w/2, cam_cell_w - 2, wall + 1])
            cube([fpc_w, wall + 2, 3]);
    }
}

// ══════════════════════════════════════════════════════════
//  ESP32 BAY — rear electronics housing
// ══════════════════════════════════════════════════════════
module esp32_cell() {
    difference() {
        rounded_box(esp_cell_l, esp_cell_w, esp_cell_h, corner_r);

        // PCB cavity
        translate([wall, wall, wall])
            cube([esp_l, esp_w, esp_h + 1]);

        // USB-C access slot, rear face
        translate([esp_cell_l/2 - 5, esp_cell_w - wall + 0.5, wall + 1])
            cube([10, wall + 1, 5]);

        // FPC entry slot, front face
        translate([esp_cell_l/2 - fpc_w/2, -0.5, wall + 1])
            cube([fpc_w, wall + 1, 3]);

        // M2 mounting holes, countersunk
        for (x = [3.5, esp_cell_l - 3.5]) for (y = [3.5, esp_cell_w - 3.5]) {
            translate([x, y, -0.5]) cylinder(r=1.1, h=wall + 1);
            translate([x, y, esp_cell_h - 1.4]) cylinder(r1=1.1, r2=2.2, h=1.5);
        }

        // Cooling slats on top — angled, modern grille look
        for (i = [0:3])
            translate([7 + i*5, esp_cell_w/2, esp_cell_h - 0.6])
                rotate([0,0,30])
                    cube([2, esp_cell_w*1.3, 1.2], center=true);
    }
}

// ══════════════════════════════════════════════════════════
//  SMOOTH SHOULDER — single clean loft connecting the two
//  bays so the whole pod reads as one continuous form
// ══════════════════════════════════════════════════════════
module shoulder(gap) {
    hull() {
        translate([(cam_cell_l-esp_cell_l)/2, 0, 0])
            rounded_box(esp_cell_l, 0.1, cam_cell_h, corner_r);
        translate([0, gap, 0])
            rounded_box(esp_cell_l, 0.1, esp_cell_h, corner_r);
    }
}

// ══════════════════════════════════════════════════════════
//  FULL NACELLE ASSEMBLY
// ══════════════════════════════════════════════════════════
module nacelle_assembly() {
    shoulder_gap = 16;

    // Camera section, tilted forward-down about its own base centre
    translate([0, 0, 0])
        rotate([cam_tilt_deg, 0, 0])
            camera_cell();

    // Single smooth shoulder loft between the two bays
    translate([(cam_cell_l-esp_cell_l)/2, cam_cell_w, 0])
        shoulder(shoulder_gap);

    // FPC channel bridge, buried inside the shoulder
    translate([cam_cell_l/2 - fpc_w/2, cam_cell_w - 1, 0])
        fpc_channel();

    // ESP32 electronics bay
    translate([(cam_cell_l-esp_cell_l)/2, cam_cell_w + shoulder_gap, 0])
        esp32_cell();

    // Streamlined drone-mount keel — tapered fin under the ESP bay
    keel_x = cam_cell_l/2;
    keel_y = cam_cell_w + shoulder_gap + esp_cell_w/2;
    difference() {
        hull() {
            translate([keel_x, keel_y, 0]) cylinder(r=4, h=0.1);
            translate([keel_x, keel_y, -7]) cylinder(r=2, h=0.1);
        }
        translate([keel_x, keel_y, -7])
            cylinder(r=1.75, h=10, center=true);
    }
}

nacelle_assembly();`;

const improvedGpsMastMountScadContent = `// ══════════════════════════════════════════════════════════
//  GPS MAST MOUNT — u-blox M9N — "Aero" Series
//  Tapered antenna stalk (thick base, slim neck), finned
//  stabiliser base, and a streamlined low-profile GPS puck
//  head instead of a flat disc.
//
//  Print:  PETG/PLA, 0.2 mm layers, 20% infill, 4 perimeters
//  Mounts: F450-pattern base, 30.5 mm bolt spacing
// ══════════════════════════════════════════════════════════

/* [Mast] */
mast_h        = 60;   // elevation above frame
mast_od_base  = 13;   // mast outer diameter at the base (thick)
mast_od_top   = 9;    // mast outer diameter at the top (slim neck)
mast_id       = 7;    // hollow core for cable routing

/* [GPS Head] */
gps_od        = 36;   // u-blox M9N module diameter
gps_h         = 8;
puck_taper    = 3;    // how much the puck dome tapers inward at the rim

/* [Base] */
base_d        = 42;
base_h        = 7;
fin_count     = 6;    // stabiliser fins around the base
fin_h         = 9;
mount_pitch   = 30.5; // F450 bottom-plate bolt pitch

$fn = 72;

// ══════════════════════════════════════════════════════════
//  TAPERED MAST — smooth conic stalk, hollow for wiring
// ══════════════════════════════════════════════════════════
module mast() {
    difference() {
        cylinder(r1=mast_od_base/2, r2=mast_od_top/2, h=mast_h);
        // Hollow core for cable routing
        cylinder(r=mast_id/2, h=mast_h + 1);
        // JST-GH cable exit slot at base
        translate([-3, -mast_od_base/2 - 0.5, 5])
            cube([6, mast_od_base + 1, 8]);
    }
}

// ══════════════════════════════════════════════════════════
//  GPS HEAD — low-profile domed puck with retaining rim
// ══════════════════════════════════════════════════════════
module gps_head() {
    difference() {
        union() {
            // Domed puck body — smooth taper from base ring to flat top
            hull() {
                cylinder(r=gps_od/2 + 2, h=0.1);
                translate([0,0,gps_h])
                    cylinder(r=gps_od/2 + 2 - puck_taper, h=0.1);
            }
            // Retaining rim lip
            cylinder(r=gps_od/2, h=gps_h + 1.5);
        }
        // Module cavity
        translate([0, 0, 3])
            cylinder(r=gps_od/2 - 0.5, h=gps_h + 1);
        // Cable pass-through to mast
        cylinder(r=mast_id/2, h=gps_h + 4);
        // Two M2 retention screws
        for (a = [45, 225])
            rotate([0, 0, a])
                translate([gps_od/2 - 2, 0, -0.5])
                    cylinder(r=1.2, h=gps_h + 4);
    }
}

// ══════════════════════════════════════════════════════════
//  STABILISER BASE — finned conic foot, modern turbine look
// ══════════════════════════════════════════════════════════
module base_plate() {
    difference() {
        union() {
            // Smooth domed base — tapers from wide foot to mast root
            hull() {
                cylinder(r=base_d/2, h=0.1);
                translate([0,0,base_h])
                    cylinder(r=mast_od_base/2 + 1, h=0.1);
            }
            // Radial rib details embossed on the cone surface (turbine-blade look)
            for (i = [0:fin_count-1])
                rotate([0,0, i*(360/fin_count)])
                    hull() {
                        translate([mast_od_base/2 + 1, 0, base_h - 0.5])
                            cylinder(r=0.9, h=0.6);
                        translate([base_d/2 - 4, 0, 0.5])
                            cylinder(r=0.9, h=0.6);
                    }
        }
        // M3 clearance holes on 30.5 mm pattern
        for (x = [-mount_pitch/2, mount_pitch/2]) for (y = [-mount_pitch/2, mount_pitch/2])
            translate([x, y, -0.5]) cylinder(r=1.75, h=base_h + 1);
        // M3 countersink
        for (x = [-mount_pitch/2, mount_pitch/2]) for (y = [-mount_pitch/2, mount_pitch/2])
            translate([x, y, base_h - 2]) cylinder(r1=1.75, r2=3.5, h=2.5);
        // Cable pass-through to mast core
        cylinder(r=mast_id/2, h=base_h + 1);
    }
}

// ══════════════════════════════════════════════════════════
//  FULL ASSEMBLY
// ══════════════════════════════════════════════════════════
base_plate();
translate([0, 0, base_h]) mast();
translate([0, 0, base_h + mast_h]) gps_head();`;

const improvedLandingLegSetScadContent = `// ══════════════════════════════════════════════════════════
//  SHOCK-ABSORBING LANDING LEGS (×4 set) — "Aero" Series
//  Smoothly tapered strut with a wide leaf-spring flex zone
//  (safer than a thin neck — distributes landing stress over
//  a longer curved section instead of concentrating it at a
//  single thin joint), sculpted grip-tread foot pad, and a
//  curved saddle clamp for the frame arm.
//
//  Print 4×. Material: PETG (flex node needs ductility — do
//  NOT print this in PLA, it will snap under landing loads).
//  0.25 mm layers, 4 perimeters, 15% infill on the leg shaft.
// ══════════════════════════════════════════════════════════

/* [Leg Geometry] */
leg_h         = 80;   // total leg height
leg_od_top    = 11;   // strut OD where it meets the arm clamp
leg_od_bot    = 8;    // strut OD where it meets the flex zone (tapered, modern look)
leg_id        = 5.5;  // hollow core for weight reduction
flex_len      = 22;   // length of the curved leaf-spring flex zone
flex_w        = 9;    // flex-zone wall width (wide & thin beats thin & narrow)
flex_t        = 2.6;  // flex-zone wall thickness (the actual spring)

/* [Foot] */
foot_r        = 16;
foot_h        = 6;
tread_count   = 8;

/* [Arm Clamp] */
arm_od        = 16;   // F450 arm tube OD
clamp_len     = 22;
clamp_wall    = 3;
bolt_d        = 3.4;  // M3 clamp bolt

$fn = 48;

// ══════════════════════════════════════════════════════════
//  FOOT PAD — sculpted dome with grip treads, smooth fillet
//  into the leg shaft (no hard step)
// ══════════════════════════════════════════════════════════
module foot_pad() {
    difference() {
        union() {
            // Domed pad — wide contact patch, smooth top fillet
            hull() {
                cylinder(r=foot_r, h=1);
                translate([0,0,foot_h]) cylinder(r=foot_r - 3, h=1);
            }
            // Raised boss blending up into the leg shaft
            cylinder(r=leg_od_bot/2 + 2, h=foot_h + 6);
        }
        // Tread grooves for grip on soft soil
        for (i = [0:tread_count-1])
            rotate([0, 0, i*(360/tread_count)])
                translate([-foot_r, -0.9, -0.5])
                    cube([foot_r*2, 1.8, 2.5]);
        // Hollow leg socket running through the boss
        cylinder(r=leg_id/2 + 1, h=foot_h + 7);
    }
}

// ══════════════════════════════════════════════════════════
//  FLEX ZONE — wide leaf-spring ankle. Instead of a single
//  thin neck (which concentrates stress and snaps), this is
//  a hollow waisted "hourglass" tube: full diameter at top
//  and bottom, pinched to a thinner wall only at the middle
//  band. The wide unbroken wall spreads landing flex over a
//  long zone instead of a single hinge point — far more
//  durable. Built as one continuous hull stack (robust, no
//  thin/disconnected slices).
// ══════════════════════════════════════════════════════════
module flex_node() {
    r_end   = leg_od_bot/2;       // full radius at top & bottom
    r_waist = flex_t;             // pinched radius at the middle
    difference() {
        union() {
            hull() {
                cylinder(r=r_end, h=0.1);
                translate([0,0,flex_len*0.5]) cylinder(r=r_waist, h=0.1);
            }
            hull() {
                translate([0,0,flex_len*0.5]) cylinder(r=r_waist, h=0.1);
                translate([0,0,flex_len])     cylinder(r=r_end, h=0.1);
            }
        }
        // Hollow core throughout
        cylinder(r=leg_id/2, h=flex_len + 1);
    }
}

// ══════════════════════════════════════════════════════════
//  STRUT — smooth conic tube from flex zone to arm clamp
// ══════════════════════════════════════════════════════════
module upper_leg() {
    strut_h = leg_h - flex_len - foot_h;
    difference() {
        cylinder(r1=leg_od_bot/2, r2=leg_od_top/2, h=strut_h);
        cylinder(r1=leg_id/2, r2=leg_id/2 + 1, h=strut_h + 1);
    }
}

// ══════════════════════════════════════════════════════════
//  ARM CLAMP — curved saddle that wraps the F450 arm tube,
//  smoothly blended into the strut (no hard shoulder)
// ══════════════════════════════════════════════════════════
module arm_clamp() {
    outer_r = arm_od/2 + clamp_wall;
    difference() {
        union() {
            // Saddle shell — open-C cross-section wrapping the arm
            translate([0,0,clamp_len/2])
                rotate([90,0,0])
                    rotate_extrude(angle=200, $fn=64)
                        translate([0, 0, 0])
                            rotate([0,0,-10])
                                translate([outer_r - clamp_wall, 0])
                                    square([clamp_wall, clamp_len]);
            // Flange blending into the strut below
            hull() {
                cylinder(r=leg_od_top/2, h=0.1);
                translate([0,0,4]) cylinder(r=outer_r*0.6, h=0.1);
            }
        }
        // Arm bore (through the saddle, centred on its own axis)
        translate([0, 0, clamp_len/2])
            rotate([-90,0,0])
                cylinder(r=arm_od/2, h=clamp_len*1.4, center=true);
        // M3 cinch-bolt holes through the open ends of the C
        for (a = [80, -80])
            rotate([0,0,a])
                translate([outer_r + 1, 0, clamp_len/2])
                    rotate([90,0,0])
                        cylinder(r=bolt_d/2, h=clamp_wall*3, center=true);
        // Leg socket through the flange
        cylinder(r=leg_id/2 + 1, h=8);
    }
}

// ══════════════════════════════════════════════════════════
//  SINGLE LEG ASSEMBLY — foot → flex spring → strut → clamp
// ══════════════════════════════════════════════════════════
module landing_leg() {
    foot_pad();

    translate([0, 0, foot_h + 3])
        flex_node();

    translate([0, 0, foot_h + flex_len + 3])
        upper_leg();

    translate([0, 0, leg_h - 14])
        arm_clamp();
}

// Print all 4 legs spaced on the build plate
for (i = [0:3])
    translate([i * 48, 0, 0]) landing_leg();`;

const improvedBatteryTrayScadContent = `// ══════════════════════════════════════════════════════════
//  BATTERY TRAY — Tattu 4S 5000 mAh — "Aero" Series
//  Smooth rounded-edge cradle with scalloped finger-access
//  cutouts for easy battery removal, angled Velcro strap
//  channels, a sculpted XT60 cable guide, and a lightweight
//  ribbed underside (saves weight without losing stiffness).
//
//  Print:  PETG, 0.2 mm layers, 3 perimeters, 20% infill
//  Mounts: F450 bottom plate, 30.5 mm bolt pattern
// ══════════════════════════════════════════════════════════

/* [Battery — Tattu 4S 5000 mAh] */
batt_l  = 158 + 2;
batt_w  =  46 + 2;
batt_h  =  42 + 2;

/* [Styling] */
wall        = 2.2;
corner_r    = 6;     // smooth outer corner roundness
strap_w     = 27;
strap_h     = 6;
xt60_w      = 16;
xt60_h      = 14;
mount_pitch = 30.5;
scallop_r   = 14;    // finger-access scallop radius (for lifting battery out)
rib_count   = 5;      // underside stiffening ribs

$fn = 48;

// ── helpers ──────────────────────────────────────────────────
module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

// ══════════════════════════════════════════════════════════
//  MAIN TRAY
// ══════════════════════════════════════════════════════════
module battery_tray() {
    outer_l = batt_l + 2*wall;
    outer_w = batt_w + 2*wall;
    outer_h = batt_h/2 + wall;   // open top — battery slides in from above
    wall_h  = 9;                  // retaining side-wall height above the floor
    pocket_depth = wall * 0.55;   // weight-relief pocket depth (partial, NOT through — keeps floor solid)

    difference() {
        union() {
            // Single continuous shell: base block + taller retaining rim,
            // built as ONE hull stack (avoids coincident-face z-fighting
            // that a separate stacked wall piece would cause).
            hull() {
                rounded_box(outer_l, outer_w, 0.1, corner_r);
                translate([0, 0, outer_h - 0.1])
                    rounded_box(outer_l, outer_w, 0.1, corner_r);
            }
            translate([0, 0, outer_h])
                rounded_box(outer_l, outer_w, wall_h, corner_r);
        }

        // Battery recess cavity (open top) — carves the cradle interior
        translate([wall, wall, wall])
            cube([batt_l, batt_w, batt_h + wall_h + 2]);

        // Finger-access scallops on the long sides — smooth half-domes
        // cut into the top rim so fingers can grip under the battery
        for (x = [outer_l*0.28, outer_l*0.72]) {
            translate([x, -1, outer_h + wall_h - 4])
                rotate([0,90,0])
                    cylinder(r=4, h=wall+2, $fn=24);
            translate([x, outer_w - wall - 1, outer_h + wall_h - 4])
                rotate([0,90,0])
                    cylinder(r=4, h=wall+2, $fn=24);
        }

        // Velcro strap slots — front
        translate([outer_l/2 - strap_w/2, -0.5, outer_h/2 - strap_h/2])
            cube([strap_w, outer_w + 1, strap_h]);

        // Velcro strap slots — rear
        translate([outer_l/2 - strap_w/2, -0.5, outer_h - strap_h - 4])
            cube([strap_w, outer_w + 1, strap_h]);

        // XT60 cable guide on right end
        translate([outer_l - wall - 0.5, outer_w/2 - xt60_w/2, wall])
            cube([wall + 1, xt60_w, xt60_h]);

        // Weight-relief pockets in the underside — PARTIAL depth only,
        // leaves a solid floor skin under the battery for strength
        for (i = [-1, 0, 1])
            translate([outer_l/2 + i*32, outer_w/2, -0.5])
                cylinder(r=10, h=pocket_depth + 0.5);

        // F450 mounting holes (30.5 mm pattern), countersunk
        for (x = [outer_l/2 - mount_pitch/2, outer_l/2 + mount_pitch/2])
            for (y = [outer_w/2 - mount_pitch/2, outer_w/2 + mount_pitch/2]) {
                translate([x, y, -0.5]) cylinder(r=1.75, h=wall + 1);
                translate([x, y, -0.5]) cylinder(r1=3.4, r2=1.75, h=2.2);
            }
    }
}

battery_tray();`;

const FARM_DRONE_ENCLOSURE_CONTAINER_DATA = {
  projectName: "Farm Patrol Drone — 3D-Printed Enclosures & Mounts",
  printRecommendations: {
    material: "PETG (preferred) or ABS. Do NOT use PLA — softens at 60 °C in direct Indian summer sun.",
    layerHeight: "0.2 mm for functional parts; 0.15 mm for snap-fit features",
    infill: "30–40 % Gyroid for impact resistance",
    walls: "4 perimeter lines (≥ 1.6 mm) for weather resistance",
    supports: "Tree supports only — touching build plate",
    bed: "75 °C for PETG; 90 °C for ABS",
    colourRecommendation: "Orange or yellow for field visibility"
  },
  files: [
    { path: "models/pixhawk_case.scad", content: pixhawkCaseScadContent },
    { path: "models/esp32_camera_nacelle.scad", content: esp32CameraNacelleScadContent },
    { path: "models/gps_mast_mount.scad", content: gpsMastMountScadContent },
    { path: "models/landing_leg_set.scad", content: landingLegSetScadContent },
    { path: "models/battery_tray.scad", content: batteryTrayScadContent }
  ]
};

// ============================================================
// DEMO RESPONSES DEFINITION
// ============================================================

const DRONE_PATROL_RESPONSE_1: DemoResponse = {
    agentType: 'conversational',
    agentName: 'The Conversational Agent',
    agentIcon: '🤖',
    intent: 'GATHER_REQUIREMENTS',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        `Great idea! 🚁 An autonomous farm patrol drone can revolutionize agricultural monitoring.

Before we dive into the build, I need to understand your specific requirements to tailor the design perfectly for your needs.

<QUESTIONS>
{
  "questions": [
    {
      "id": "environment",
      "text": "Where will the drone primarily operate?",
      "type": "single_select",
      "options": ["Small farm (< 10 acres)", "Medium farm (10-50 acres)", "Large farm (50+ acres)", "Mixed terrain / orchards"],
      "required": true
    },
    {
      "id": "use_case",
      "text": "What's your primary use case?",
      "type": "single_select",
      "options": ["Crop health monitoring", "Irrigation leak detection", "Livestock tracking", "General surveillance"],
      "required": true
    },
    {
      "id": "budget",
      "text": "What's your target budget?",
      "type": "single_select",
      "options": ["Under $300", "$300-$500", "$500-$800", "Over $800"],
      "required": true
    }
  ]
}
</QUESTIONS>`
    ],
    toolCalls: []
};

const DRONE_PATROL_RESPONSE_2: DemoResponse = {
    agentType: 'conversational',
    agentName: 'The Conversational Agent',
    agentIcon: '🤖',
    intent: 'GATHER_TECHNICAL_PREFS',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        `Perfect! Now let's nail down the technical specifications to match your operational requirements.

<QUESTIONS>
{
  "questions": [
    {
      "id": "flight_time",
      "text": "What flight time do you need per mission?",
      "type": "single_select",
      "options": ["15-20 minutes", "20-30 minutes", "30-45 minutes", "45+ minutes"],
      "required": true
    },
    {
      "id": "video_quality",
      "text": "What video quality is acceptable?",
      "type": "single_select",
      "options": ["720p (good enough)", "1080p (preferred)", "4K (best quality)", "No video needed"],
      "required": true
    },
    {
      "id": "experience",
      "text": "What's your experience level with drones/electronics?",
      "type": "single_select",
      "options": ["Complete beginner", "Some hobby experience", "Intermediate builder", "Advanced/Professional"],
      "required": false
    }
  ]
}
</QUESTIONS>`
    ],
    toolCalls: []
};

const DRONE_PATROL_RESPONSE_3: DemoResponse = {
    agentType: 'projectInitializer',
    agentName: 'The Project Initializer',
    agentIcon: '🚀',
    intent: 'PROJECT_INIT',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        `# 🚁 MVP: Farm Patrol Autonomous Drone

## What We're Building

A **fully autonomous agricultural surveillance drone** that eliminates the need for manual farm inspections. The system flies pre-programmed GPS patrol routes, streams real-time 1080p video to your smartphone, avoids obstacles intelligently, and returns home to recharge — all without you touching a controller.

---

## Core Capabilities

### 🛰️ Autonomous Navigation
Pre-load GPS waypoint missions via QGroundControl or the companion mobile app. The drone follows the route precisely using the u-blox M9N GPS (1.5 m CEP accuracy), adjusts altitude based on BMP280 barometer readings, and handles wind disturbances through the Pixhawk 6C's tuned PID loop.

### 📸 Live Video Streaming
The onboard Raspberry Pi Camera Module 3 delivers 1080p30 video over a dedicated 2.4 GHz Wi-Fi hotspot hosted by the ESP32-S3. Range is ~150 m in open fields. Footage is also written to a 32 GB MicroSD for later review.

### 🔋 Smart Battery Management
Continuous voltage monitoring via the Holybro Power Module. At 30 % charge the drone emits a low-battery warning. At 20 % it autonomously triggers Return-to-Home (RTH), lands, and waits for reconnection. No more dead-on-the-spot landings.

### 🛑 Obstacle Avoidance
Forward-facing HC-SR04 ultrasonic sensor feeds real-time distance data to the Pixhawk companion computer. Objects detected within 2 m trigger a halt-and-hover, followed by an automatic route re-plan or pilot alert.

### 🏠 Autonomous Recharging (Phase 2)
A 3D-printed landing dock with spring-contact charging pads enables unattended battery replenishment. The drone aligns using IR landing beacons and descends onto the contact plate for hands-free charging.

---

## Why This Matters

| Problem | Manual Inspection | Farm Patrol Drone |
|---|---|---|
| Time per 10-acre scan | ~2 hours on foot | ~12 minutes |
| Crop stress detection | Ground-level only | Aerial + thermal (Phase 2) |
| Irrigation leak visibility | Near-zero | High — overhead view |
| Livestock head count | Slow and error-prone | Automated via CV (Phase 2) |
| Cost per inspection | Labour @ ₹500/hr | ~₹3 amortised electricity |

---

## Phased Rollout

**Phase 1 — MVP (This Build):** Autonomous waypoint flight, live video, RTH, obstacle avoidance, manual charging. Budget: **₹25,800 (~$308)**.

**Phase 2 — Auto-Charge:** Docking station, contact-pad charging, extended route planning. Estimated additional cost: ~$80.

**Phase 3 — Precision Ag:** Multispectral NDVI camera, AI-driven crop stress heatmaps, integration with farm management software.

---

## Success Criteria for MVP Sign-Off

- ✅ Completes a 10-waypoint GPS loop with < 2 m deviation at each point
- ✅ Streams video at ≥ 720p30 with < 300 ms latency
- ✅ RTH triggers reliably at 20 % battery in all test flights
- ✅ Obstacle halt activates within 500 ms of detection
- ✅ Total build cost does not exceed $350

Would you like me to proceed with the PRD?`
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'mvp'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'context',
                content: `# Project Context: Farm Patrol Autonomous Drone

## Overview
The **Farm Patrol Autonomous Drone** is designed to provide low-cost aerial monitoring for agricultural land. This system will enable farmers to conduct regular aerial inspections without manual flying, reducing labor costs and improving crop management efficiency.

**Target Market**: Small to medium farms (10-100 acres)
**Price Point**: <$350 complete system
**Key Differentiator**: Fully autonomous with auto-charging

## Key Specifications & Use Cases
- **Flight Time**: Up to 22 minutes on a single charge (4S 5000 mAh LiPo battery)
- **Monitoring Range**: Covers 10-acre fields in under 12 minutes
- **Primary Applications**: Irrigation leak detection, crop health mapping, and livestock counting via a live 1080p aerial video stream
- **Safety Features**: Integrated Pixhawk 6C flight controller with autonomous Return-to-Home (RTH) on low battery (20%) or signal loss, and forward-facing ultrasonic sensors for obstacle avoidance`,
                merge_strategy: 'replace'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'mvp',
                content: `# 🚁 MVP: Farm Patrol Autonomous Drone

## What We're Building

A **fully autonomous agricultural surveillance drone** that eliminates the need for manual farm inspections. The system flies pre-programmed GPS patrol routes, streams real-time 1080p video to your smartphone, avoids obstacles intelligently, and returns home to recharge — all without you touching a controller.

---

## Core Capabilities

### 🛰️ Autonomous Navigation
Pre-load GPS waypoint missions via QGroundControl or the companion mobile app. The drone follows the route precisely using the u-blox M9N GPS (1.5 m CEP accuracy), adjusts altitude based on BMP280 barometer readings, and handles wind disturbances through the Pixhawk 6C's tuned PID loop.

### 📸 Live Video Streaming
The onboard Raspberry Pi Camera Module 3 delivers 1080p30 video over a dedicated 2.4 GHz Wi-Fi hotspot hosted by the ESP32-S3. Range is ~150 m in open fields. Footage is also written to a 32 GB MicroSD for later review.

### 🔋 Smart Battery Management
Continuous voltage monitoring via the Holybro Power Module. At 30 % charge the drone emits a low-battery warning. At 20 % it autonomously triggers Return-to-Home (RTH), lands, and waits for reconnection. No more dead-on-the-spot landings.

### 🛑 Obstacle Avoidance
Forward-facing HC-SR04 ultrasonic sensor feeds real-time distance data to the Pixhawk companion computer. Objects detected within 2 m trigger a halt-and-hover, followed by an automatic route re-plan or pilot alert.

### 🏠 Autonomous Recharging (Phase 2)
A 3D-printed landing dock with spring-contact charging pads enables unattended battery replenishment. The drone aligns using IR landing beacons and descends onto the contact plate for hands-free charging.

---

## Why This Matters

| Problem | Manual Inspection | Farm Patrol Drone |
|---|---|---|
| Time per 10-acre scan | ~2 hours on foot | ~12 minutes |
| Crop stress detection | Ground-level only | Aerial + thermal (Phase 2) |
| Irrigation leak visibility | Near-zero | High — overhead view |
| Livestock head count | Slow and error-prone | Automated via CV (Phase 2) |
| Cost per inspection | Labour @ ₹500/hr | ~₹3 amortised electricity |

---

## Phased Rollout

**Phase 1 — MVP (This Build):** Autonomous waypoint flight, live video, RTH, obstacle avoidance, manual charging. Budget: **₹25,800 (~$308)**.

**Phase 2 — Auto-Charge:** Docking station, contact-pad charging, extended route planning. Estimated additional cost: ~$80.

**Phase 3 — Precision Ag:** Multispectral NDVI camera, AI-driven crop stress heatmaps, integration with farm management software.

---

## Success Criteria for MVP Sign-Off

- ✅ Completes a 10-waypoint GPS loop with < 2 m deviation at each point
- ✅ Streams video at ≥ 720p30 with < 300 ms latency
- ✅ RTH triggers reliably at 20 % battery in all test flights
- ✅ Obstacle halt activates within 500 ms of detection
- ✅ Total build cost does not exceed $350`,
                merge_strategy: 'replace'
            }
        }
    ]
};

const DRONE_PATROL_RESPONSE_4: DemoResponse = {
    agentType: 'productDesigner',
    agentName: 'The Product Designer',
    agentIcon: '🎨',
    intent: 'PRD_GEN',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        `# Technical Architecture: Farm Patrol Autonomous Drone

## System Overview

The drone is built around a **dual-brain architecture**: the Pixhawk 6C handles all safety-critical flight control (attitude, altitude, GPS hold, RTH), while the ESP32-S3 companion computer manages higher-level tasks (video streaming, Wi-Fi connectivity, telemetry relay, sensor fusion).

Communication between the two brains is via **MAVLink 2.0 over UART at 57,600 baud** — the industry-standard protocol for drone telemetry.

\`\`\`
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
\`\`\`

---

## Hardware Layer

### Flight Controller — Pixhawk 6C
- **Firmware:** ArduCopter 4.5.x (stable)
- **IMU:** Dual ICM-42688-P (6-axis) with vibration isolation
- **Barometer:** Internal + external BMP280 for redundancy
- **Interfaces:** 8× PWM MAIN OUT, TELEM1/2, GPS1/2, I2C, CAN, SPI
- **Safety:** Hardware kill switch, buzzer, RGB LED status indicator

### Companion Computer — ESP32-S3
- **Role:** Camera capture, Wi-Fi AP, MAVLink bridge, OSD overlay
- **Camera:** RPi Camera Module 3 via MIPI-CSI → internal JPEG encoder
- **Streaming:** MJPEG over HTTP on port 80 and WebSocket on port 81
- **MAVLink:** Parses HEARTBEAT, SYS_STATUS, GPS_RAW_INT, ATTITUDE

### Power Architecture
\`\`\`
Battery (14.8 V nominal) 
  → Power Module (current + voltage sensing → Pixhawk ADC)
  → PDB (distributes raw VBAT to 4× ESCs)
  → ESC integrated 5 V / 3 A BEC → Pixhawk POWER1
  → Separate 3.3 V LDO on ESP32 DevKit
\`\`\`

### Propulsion
- **Frame:** 450 mm carbon fibre X-quad
- **Motors:** 920 KV brushless, 188 W max each → 752 W total
- **ESCs:** BLHeli_32 30 A, DSHOT600 capable
- **Props:** 10 × 4.5 carbon fibre, CW/CCW matched pairs
- **Max thrust:** ~1,800 g per motor → 7,200 g total vs ~1,100 g AUW
- **Theoretical hover:** ~36 % throttle → ~22 min flight time

---

## Software Stack

| Layer | Component | Version |
|---|---|---|
| Flight Firmware | ArduCopter | 4.5.x |
| Ground Station | QGroundControl | Latest stable |
| ESP32 Framework | Arduino / PlatformIO | ESP-IDF 5.2 |
| MAVLink Library | mavlink/c_library_v2 | 2.0 |
| Camera Driver | esp32-camera | 2.0.x |
| OTA Updates | ArduinoOTA | Built-in |

---

## Network Architecture

\`\`\`
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
\`\`\`

---

## Calibration & Pre-flight Checklist

1. **Accelerometer calibration** — flat + 5-orientation in QGC
2. **Compass calibration** — outdoor, away from metal structures
3. **ESC calibration** — BLHeli_32 Suite via USB
4. **Radio calibration** — if using manual RC override
5. **Mission upload** — via QGC Plan view, verify fence boundaries
6. **Motor test** — low-throttle spin-up, check rotation directions
7. **Prop clearance check** — minimum 20 mm tip-to-frame
8. **Battery voltage verify** — ≥ 15.8 V before takeoff (4S full = 16.8 V)

# Product Requirements Document
## Farm Patrol Autonomous Drone — v1.0

**Status:** Approved for Build  
**Owner:** Hardware Engineering  
**Last Updated:** June 2026

---

## 1. Executive Summary

This PRD defines the complete functional, non-functional, and safety requirements for the Farm Patrol Autonomous Drone MVP. The system must be buildable under $350, operable by a non-pilot farmer after a 30-minute onboarding session, and robust enough for daily agricultural use in dusty, humid, and GPS-challenged field environments.

---

## 2. User Personas

**Primary — Rajan (Farmer, 45):** Owns 25 acres of mixed crops in Maharashtra. Inspects fields twice daily on foot, spending 3+ hours. Not technically skilled; needs a "press start and walk away" experience.

**Secondary — Priya (Farm Manager, 30):** Manages 3 farms for an agri-cooperative. Needs fleet visibility, log exports, and integration with existing farm management software.

---

## 3. Functional Requirements

### 3.1 Flight & Navigation

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | Autonomous waypoint flight | P0 | Completes 10-point GPS mission with < 2 m deviation per waypoint |
| FR-002 | Return-to-Home (RTH) | P0 | Triggers at ≤ 20 % battery; lands within 1 m of launch point |
| FR-003 | Altitude hold | P0 | Maintains set altitude ± 0.5 m in winds up to 7 m/s |
| FR-004 | Geofence enforcement | P1 | Does not exit operator-defined polygon; triggers RTH if fence breached |
| FR-005 | Manual override | P1 | Pilot can take RC control at any time; Pixhawk returns to AUTO on switch |
| FR-006 | Auto-land on comms loss | P1 | If telemetry lost for > 15 s, drone descends at 0.5 m/s and lands |

### 3.2 Video & Telemetry

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-010 | Live video stream | P0 | 1080p30 MJPEG stream visible in mobile browser within 5 s of power-on |
| FR-011 | Video recording | P1 | Continuous SD recording; 32 GB stores ≥ 4 hours at 10 Mbps |
| FR-012 | Telemetry overlay | P1 | Battery %, GPS coords, altitude, speed rendered as OSD on stream |
| FR-013 | Low-latency streaming | P1 | End-to-end latency < 300 ms at 20 m range |

### 3.3 Obstacle Avoidance

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-020 | Forward obstacle detection | P1 | Detects objects ≥ 30 cm width within 0–200 cm range |
| FR-021 | Halt-and-hover response | P1 | Drone halts within 500 ms of detection; holds position |
| FR-022 | Pilot obstacle alert | P1 | Mobile app displays red "OBSTACLE DETECTED" banner with distance |

### 3.4 Battery & Power

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-030 | Battery voltage telemetry | P0 | Voltage reported to ± 0.1 V accuracy at 2 Hz |
| FR-031 | Low-battery warning | P0 | Audible + visual alert at ≤ 30 % charge |
| FR-032 | Critical RTH trigger | P0 | Autonomous RTH at ≤ 20 % charge, no pilot input required |
| FR-033 | Over-discharge protection | P0 | ESC cuts power before cell voltage drops below 3.3 V/cell |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Flight Endurance | ≥ 20 minutes at 50 % payload (camera + ESP32) |
| NFR-002 | Weather Resistance | IP54 — dust-tight, splash-resistant (light rain) |
| NFR-003 | Operating Temperature | 0 °C to 50 °C (Indian agricultural environment) |
| NFR-004 | MTBF | > 50 flight hours before first component failure |
| NFR-005 | Build Cost | Total BOM ≤ $350 USD |
| NFR-006 | Setup Time | < 30 minutes from box to first autonomous flight |
| NFR-007 | Weight | All-up weight (AUW) < 1,200 g (below DGCA micro-UAS threshold) |
| NFR-008 | Noise | < 72 dB at 3 m (not to disturb livestock) |

---

## 5. Safety & Compliance

- **DGCA India:** Compliant with Drone Rules 2021 — Nano/Micro category (< 250 g or Green Zone micro registration)
- **Pre-arm Checks:** Pixhawk enforces GPS lock (≥ 6 satellites), battery voltage, compass health, and barometer calibration before arming
- **Kill Switch:** Hardware safety button on Pixhawk disables all motor output instantly
- **Propeller Guards:** Recommended for Phase 1 testing over crops

---

## 6. Out of Scope (Phase 1)

- Thermal / multispectral imaging
- AI-powered crop stress detection
- Automatic recharging dock
- Fleet management (multiple drones)
- 4G/LTE telemetry link

Ready to generate the Bill of Materials?`
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'prd'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'context',
                content: `# Technical Architecture: Farm Patrol Autonomous Drone

## System Overview

The drone is built around a **dual-brain architecture**: the Pixhawk 6C handles all safety-critical flight control (attitude, altitude, GPS hold, RTH), while the ESP32-S3 companion computer manages higher-level tasks (video streaming, Wi-Fi connectivity, telemetry relay, sensor fusion).

Communication between the two brains is via **MAVLink 2.0 over UART at 57,600 baud** — the industry-standard protocol for drone telemetry.

\`\`\`
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
\`\`\`

---

## Hardware Layer

### Flight Controller — Pixhawk 6C
- **Firmware:** ArduCopter 4.5.x (stable)
- **IMU:** Dual ICM-42688-P (6-axis) with vibration isolation
- **Barometer:** Internal + external BMP280 for redundancy
- **Interfaces:** 8× PWM MAIN OUT, TELEM1/2, GPS1/2, I2C, CAN, SPI
- **Safety:** Hardware kill switch, buzzer, RGB LED status indicator

### Companion Computer — ESP32-S3
- **Role:** Camera capture, Wi-Fi AP, MAVLink bridge, OSD overlay
- **Camera:** RPi Camera Module 3 via MIPI-CSI → internal JPEG encoder
- **Streaming:** MJPEG over HTTP on port 80 and WebSocket on port 81
- **MAVLink:** Parses HEARTBEAT, SYS_STATUS, GPS_RAW_INT, ATTITUDE

### Power Architecture
\`\`\`
Battery (14.8 V nominal) 
  → Power Module (current + voltage sensing → Pixhawk ADC)
  → PDB (distributes raw VBAT to 4× ESCs)
  → ESC integrated 5 V / 3 A BEC → Pixhawk POWER1
  → Separate 3.3 V LDO on ESP32 DevKit
\`\`\`

### Propulsion
- **Frame:** 450 mm carbon fibre X-quad
- **Motors:** 920 KV brushless, 188 W max each → 752 W total
- **ESCs:** BLHeli_32 30 A, DSHOT600 capable
- **Props:** 10 × 4.5 carbon fibre, CW/CCW matched pairs
- **Max thrust:** ~1,800 g per motor → 7,200 g total vs ~1,100 g AUW
- **Theoretical hover:** ~36 % throttle → ~22 min flight time

---

## Software Stack

| Layer | Component | Version |
|---|---|---|
| Flight Firmware | ArduCopter | 4.5.x |
| Ground Station | QGroundControl | Latest stable |
| ESP32 Framework | Arduino / PlatformIO | ESP-IDF 5.2 |
| MAVLink Library | mavlink/c_library_v2 | 2.0 |
| Camera Driver | esp32-camera | 2.0.x |
| OTA Updates | ArduinoOTA | Built-in |

---

## Network Architecture

\`\`\`
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
\`\`\`

---

## Calibration & Pre-flight Checklist

1. **Accelerometer calibration** — flat + 5-orientation in QGC
2. **Compass calibration** — outdoor, away from metal structures
3. **ESC calibration** — BLHeli_32 Suite via USB
4. **Radio calibration** — if using manual RC override
5. **Mission upload** — via QGC Plan view, verify fence boundaries
6. **Motor test** — low-throttle spin-up, check rotation directions
7. **Prop clearance check** — minimum 20 mm tip-to-frame
8. **Battery voltage verify** — ≥ 15.8 V before takeoff (4S full = 16.8 V)`,
                merge_strategy: 'replace'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'prd',
                content: `# Product Requirements Document
## Farm Patrol Autonomous Drone — v1.0

**Status:** Approved for Build  
**Owner:** Hardware Engineering  
**Last Updated:** June 2026

---

## 1. Executive Summary

This PRD defines the complete functional, non-functional, and safety requirements for the Farm Patrol Autonomous Drone MVP. The system must be buildable under $350, operable by a non-pilot farmer after a 30-minute onboarding session, and robust enough for daily agricultural use in dusty, humid, and GPS-challenged field environments.

---

## 2. User Personas

**Primary — Rajan (Farmer, 45):** Owns 25 acres of mixed crops in Maharashtra. Inspects fields twice daily on foot, spending 3+ hours. Not technically skilled; needs a "press start and walk away" experience.

**Secondary — Priya (Farm Manager, 30):** Manages 3 farms for an agri-cooperative. Needs fleet visibility, log exports, and integration with existing farm management software.

---

## 3. Functional Requirements

### 3.1 Flight & Navigation

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | Autonomous waypoint flight | P0 | Completes 10-point GPS mission with < 2 m deviation per waypoint |
| FR-002 | Return-to-Home (RTH) | P0 | Triggers at ≤ 20 % battery; lands within 1 m of launch point |
| FR-003 | Altitude hold | P0 | Maintains set altitude ± 0.5 m in winds up to 7 m/s |
| FR-004 | Geofence enforcement | P1 | Does not exit operator-defined polygon; triggers RTH if fence breached |
| FR-005 | Manual override | P1 | Pilot can take RC control at any time; Pixhawk returns to AUTO on switch |
| FR-006 | Auto-land on comms loss | P1 | If telemetry lost for > 15 s, drone descends at 0.5 m/s and lands |

### 3.2 Video & Telemetry

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-010 | Live video stream | P0 | 1080p30 MJPEG stream visible in mobile browser within 5 s of power-on |
| FR-011 | Video recording | P1 | Continuous SD recording; 32 GB stores ≥ 4 hours at 10 Mbps |
| FR-012 | Telemetry overlay | P1 | Battery %, GPS coords, altitude, speed rendered as OSD on stream |
| FR-013 | Low-latency streaming | P1 | End-to-end latency < 300 ms at 20 m range |

### 3.3 Obstacle Avoidance

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-020 | Forward obstacle detection | P1 | Detects objects ≥ 30 cm width within 0–200 cm range |
| FR-021 | Halt-and-hover response | P1 | Drone halts within 500 ms of detection; holds position |
| FR-022 | Pilot obstacle alert | P1 | Mobile app displays red "OBSTACLE DETECTED" banner with distance |

### 3.4 Battery & Power

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-030 | Battery voltage telemetry | P0 | Voltage reported to ± 0.1 V accuracy at 2 Hz |
| FR-031 | Low-battery warning | P0 | Audible + visual alert at ≤ 30 % charge |
| FR-032 | Critical RTH trigger | P0 | Autonomous RTH at ≤ 20 % charge, no pilot input required |
| FR-033 | Over-discharge protection | P0 | ESC cuts power before cell voltage drops below 3.3 V/cell |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Flight Endurance | ≥ 20 minutes at 50 % payload (camera + ESP32) |
| NFR-002 | Weather Resistance | IP54 — dust-tight, splash-resistant (light rain) |
| NFR-003 | Operating Temperature | 0 °C to 50 °C (Indian agricultural environment) |
| NFR-004 | MTBF | > 50 flight hours before first component failure |
| NFR-005 | Build Cost | Total BOM ≤ $350 USD |
| NFR-006 | Setup Time | < 30 minutes from box to first autonomous flight |
| NFR-007 | Weight | All-up weight (AUW) < 1,200 g (below DGCA micro-UAS threshold) |
| NFR-008 | Noise | < 72 dB at 3 m (not to disturb livestock) |

---

## 5. Safety & Compliance

- **DGCA India:** Compliant with Drone Rules 2021 — Nano/Micro category (< 250 g or Green Zone micro registration)
- **Pre-arm Checks:** Pixhawk enforces GPS lock (≥ 6 satellites), battery voltage, compass health, and barometer calibration before arming
- **Kill Switch:** Hardware safety button on Pixhawk disables all motor output instantly
- **Propeller Guards:** Recommended for Phase 1 testing over crops

---

## 6. Out of Scope (Phase 1)

- Thermal / multispectral imaging
- AI-powered crop stress detection
- Automatic recharging dock
- Fleet management (multiple drones)
- 4G/LTE telemetry link`,
                merge_strategy: 'replace'
            }
        }
    ]
};

const DRONE_PATROL_RESPONSE_5: DemoResponse = {
    agentType: 'bomGenerator',
    agentName: 'The BOM Generator',
    agentIcon: '📊',
    intent: 'BOM_GEN',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        'I\'ve generated the complete Bill of Materials for the Farm Patrol Drone with 21 components totaling $308. The BOM includes detailed specs, supplier links, and assembly notes for each part.\n\nI\'ve also optimized the budget — saving $82 (21%) from the original quote by substituting premium components with cost-effective alternatives that still meet performance requirements.\n\nReady to generate the wiring diagram?'
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'bom'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'bom',
                content: FARM_DRONE_BOM_DATA,
                merge_strategy: 'replace'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'budget',
                content: FARM_DRONE_BUDGET_DATA,
                merge_strategy: 'replace'
            }
        }
    ]
};

const DRONE_PATROL_RESPONSE_6: DemoResponse = {
    agentType: 'wiringSpecialist',
    agentName: 'The Wiring Specialist',
    agentIcon: '⚡',
    intent: 'WIRING_GEN',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        'Here is the wiring guide and connection map.\nReady to generate the firmware code?'
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'wiring'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'wiring',
                content: FARM_DRONE_WIRING_DATA,
                merge_strategy: 'replace'
            }
        }
    ]
};

const DRONE_PATROL_RESPONSE_7: DemoResponse = {
    agentType: 'codeGenerator',
    agentName: 'The Code Generator',
    agentIcon: '💻',
    intent: 'CODE_GEN',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        'I\'ve generated the complete ESP32-S3 companion firmware with 6 files:\n\n• **platformio.ini** - Build configuration\n• **config.h** - System parameters\n• **main.cpp** - Core loop and initialization\n• **mavlink_handler.cpp** - Pixhawk communication\n• **obstacle_sensor.cpp** - HC-SR04 driver\n• **telemetry_server.cpp** - WebSocket streaming\n\nThe firmware handles autonomous flight telemetry, live video streaming, and obstacle avoidance.\n\nReady to design the 3D-printed enclosures?'
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'code'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'code',
                path: 'platformio.ini',
                language: 'ini',
                content: platformioIniContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'code',
                path: 'include/config.h',
                language: 'cpp',
                content: configHContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'code',
                path: 'src/main.cpp',
                language: 'cpp',
                content: mainCppContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'code',
                path: 'src/mavlink_handler.cpp',
                language: 'cpp',
                content: mavlinkHandlerCppContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'code',
                path: 'src/obstacle_sensor.cpp',
                language: 'cpp',
                content: obstacleSensorCppContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'code',
                path: 'src/telemetry_server.cpp',
                language: 'cpp',
                content: telemetryServerCppContent
            }
        }
    ]
};

const DRONE_PATROL_RESPONSE_8: DemoResponse = {
    agentType: 'enclosureDesigner',
    agentName: 'The Enclosure Designer',
    agentIcon: '🛠️',
    intent: 'ENCLOSURE_GEN',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        'I\'ve created 5 3D-printable enclosures in the Enclosure drawer.\n\nClick any `.scad` file to view its code. Click "Compile & Preview 3D Model" to see the 3D preview (compiles on-demand to avoid lag).'
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'enclosure'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'README.md',
                language: 'markdown',
                content: `# 3D-Printed Enclosures — "Aero" Series

## Print Settings
- **Material:** PETG or ABS (NOT PLA - softens at 60°C in sun)
- **Layer Height:** 0.2 mm  
- **Infill:** 30-40% Gyroid
- **Walls:** 4 perimeters (1.6 mm minimum)
- **Supports:** Tree supports, touching build plate only
- **Bed Temp:** 75°C (PETG) | 90°C (ABS)

## Enclosure Files

### 1. pixhawk_case.scad
Pixhawk 6C Flight Controller Enclosure
- Snap-fit domed lid (no screws needed)
- Angled cooling fins
- 4-corner PCB standoffs  
- Access ports for all connectors

### 2. esp32_camera_nacelle.scad  
ESP32-S3 + Camera Sensor Pod
- Streamlined nose with lens barrel
- Integrated sun visor (reduces glare)
- Smooth shoulder loft
- Angled cooling slats

### 3. gps_mast_mount.scad
GPS Antenna Mast (60mm elevation)
- Tapered stalk (thick base, slim neck)
- Finned stabilizer base
- Low-profile domed GPS puck
- F450 mounting pattern

### 4. landing_leg_set.scad
Shock-Absorbing Landing Legs
- **Print 4 copies**
- Wide leaf-spring flex zone
- Sculpted grip-tread foot pads
- Curved saddle arm clamp

### 5. battery_tray.scad
Battery Cradle (Tattu 4S 5000mAh)
- Smooth rounded-edge cradle
- Scalloped finger-access cutouts
- 2× Velcro strap channels
- XT60 cable guide

## Assembly Notes
- Test-fit all parts before gluing
- Use M3 nylon screws for electronics mounts
- Apply thread-locker on arm clamp bolts
- Color recommendation: Orange or yellow for field visibility

## Click any .scad file to view code and compile 3D preview!`
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/pixhawk_case.scad',
                language: 'openscad',
                content: pixhawkCaseScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/esp32_camera_nacelle.scad',
                language: 'openscad',
                content: esp32CameraNacelleScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/gps_mast_mount.scad',
                language: 'openscad',
                content: gpsMastMountScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/landing_leg_set.scad',
                language: 'openscad',
                content: landingLegSetScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/battery_tray.scad',
                language: 'openscad',
                content: batteryTrayScadContent
            }
        }
    ]
};

const DRONE_PATROL_RESPONSE_9: DemoResponse = {
    agentType: 'enclosureDesigner',
    agentName: 'The Enclosure Designer',
    agentIcon: '🛠️',
    intent: 'ENCLOSURE_IMPROVE',
    title: 'Farm Patrol Autonomous Drone Build',
    textChunks: [
        '# 🎨 Enclosure Design Upgrade — "Aero" Series\n\nI\'ve redesigned all 5 enclosures with a modern, streamlined aesthetic while improving functionality:\n\n## 🔧 **Pixhawk Case**\n- Smooth domed lid with soft-touch pebble silhouette\n- Engineered snap-fit closure (no screws needed)\n- Angled cooling fin slots on underside (modern speaker-grille style)\n- 4-corner PCB standoffs for better stability\n- Recessed label plate area\n\n## 📸 **ESP32 Camera Nacelle**\n- Streamlined nose cowling with lens barrel boss\n- Integrated sun visor above the lens (reduces glare)\n- Smooth shoulder loft connecting camera and ESP32 bays\n- Angled cooling slats on ESP32 compartment\n- Tapered mounting keel for clean frame integration\n\n## 🛰️ **GPS Mast Mount**\n- Tapered antenna stalk (thick base, slim neck)\n- Low-profile domed GPS puck (replaces flat disc)\n- Finned stabiliser base with turbine-blade aesthetic\n- Improved rigidity with conic transitions\n\n## 🦵 **Landing Legs**\n- Wide leaf-spring flex zone (distributes landing stress over longer section)\n- Sculpted grip-tread foot pads with domed profile\n- Curved saddle arm clamp (smooth blend, no hard shoulders)\n- Hollow tapered struts for weight reduction\n\n## 🔋 **Battery Tray**\n- Smooth rounded-edge cradle\n- Scalloped finger-access cutouts for easy battery removal\n- Partial-depth weight-relief pockets (maintains floor strength)\n- Single continuous shell construction (no z-fighting)\n\nAll designs now follow a cohesive "Aero" language with organic curves, functional details, and weight optimization. Ready to print! ✨'
    ],
    toolCalls: [
        {
            name: 'open_drawer',
            arguments: {
                drawer: 'enclosure'
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/pixhawk_case.scad',
                language: 'openscad',
                content: improvedPixhawkCaseScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/esp32_camera_nacelle.scad',
                language: 'openscad',
                content: improvedEsp32CameraNacelleScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/gps_mast_mount.scad',
                language: 'openscad',
                content: improvedGpsMastMountScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/landing_leg_set.scad',
                language: 'openscad',
                content: improvedLandingLegSetScadContent
            }
        },
        {
            name: 'write',
            arguments: {
                artifact_type: 'enclosure',
                path: 'models/battery_tray.scad',
                language: 'openscad',
                content: improvedBatteryTrayScadContent
            }
        }
    ]
};

/**
 * Get demo response for a specific prompt
 */
export function getDemoResponse(message: string, userMessageCount?: number): DemoResponse | null {
    const normalizedMessage = message.toLowerCase().trim();

    // If this is a drone project initialization, or we are already in the flow
    const isDroneFlow = 
        (userMessageCount !== undefined && userMessageCount > 0) || 
        normalizedMessage.includes('drone') || 
        normalizedMessage.includes('patrol') || 
        normalizedMessage.includes('farm') ||
        normalizedMessage.includes('autonomo') ||
        normalizedMessage.includes('prd') ||
        normalizedMessage.includes('bom') ||
        normalizedMessage.includes('wiring') ||
        normalizedMessage.includes('firmware') ||
        normalizedMessage.includes('enclosure');

    if (!isDroneFlow) {
        return null;
    }

    // Direct turn-based mapping for robust demo flow
    if (userMessageCount !== undefined) {
        if (userMessageCount === 0) {
            return DRONE_PATROL_RESPONSE_1; // Questions about environment/use case/budget
        }
        if (userMessageCount === 1) {
            return DRONE_PATROL_RESPONSE_2; // Questions about flight time/video/experience
        }
        if (userMessageCount === 2) {
            return DRONE_PATROL_RESPONSE_3; // MVP + Context
        }
        if (userMessageCount === 3) {
            return DRONE_PATROL_RESPONSE_4; // PRD
        }
        if (userMessageCount === 4) {
            return DRONE_PATROL_RESPONSE_5; // BOM
        }
        if (userMessageCount === 5) {
            return DRONE_PATROL_RESPONSE_6; // Wiring
        }
        if (userMessageCount === 6) {
            return DRONE_PATROL_RESPONSE_7; // Code
        }
        if (userMessageCount === 7) {
            return DRONE_PATROL_RESPONSE_8; // Enclosure
        }
        if (userMessageCount === 8) {
            return DRONE_PATROL_RESPONSE_9; // Improved Enclosure
        }
    }

    // Fallback keyword-based matching if count is out of bounds or not provided
    // Turn 1 - Initial questions
    if (normalizedMessage.includes('autonomous drone') && normalizedMessage.includes('farm')) {
        return DRONE_PATROL_RESPONSE_1;
    }

    // Turn 3 - MVP/Context (skipping questions in fallback)
    if (normalizedMessage.includes('create the prd') || (normalizedMessage.includes('prd') && normalizedMessage.includes('architecture'))) {
        return DRONE_PATROL_RESPONSE_4;
    }

    // Turn 5 - BOM
    if (normalizedMessage.includes('complete bom') || (normalizedMessage.includes('bom') && (normalizedMessage.includes('pricing') || normalizedMessage.includes('sourcing')))) {
        return DRONE_PATROL_RESPONSE_5;
    }

    // Turn 6 - Wiring
    if (normalizedMessage.includes('wiring diagram') || normalizedMessage.includes('wiring guide')) {
        return DRONE_PATROL_RESPONSE_6;
    }

    // Turn 7 - Code
    if (normalizedMessage.includes('firmware') && (normalizedMessage.includes('esp32') || normalizedMessage.includes('companion'))) {
        return DRONE_PATROL_RESPONSE_7;
    }

    // Turn 8 - Enclosure
    if (normalizedMessage.includes('design the 3d') || normalizedMessage.includes('printable enclosure') || normalizedMessage.includes('charging dock')) {
        return DRONE_PATROL_RESPONSE_8;
    }

    // Turn 9 - Improved Enclosure (when user asks to improve)
    if ((normalizedMessage.includes('improve') || normalizedMessage.includes('better') || normalizedMessage.includes('enhance') || normalizedMessage.includes('update') || normalizedMessage.includes('upgrade')) && (normalizedMessage.includes('enclosure') || normalizedMessage.includes('case') || normalizedMessage.includes('design') || normalizedMessage.includes('scad'))) {
        return DRONE_PATROL_RESPONSE_9;
    }

    return null;
}
