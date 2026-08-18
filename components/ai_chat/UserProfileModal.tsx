"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench, Cpu, Zap, Code2, Box, Check, Save, Sparkles, Plus, X } from "lucide-react";

interface UserProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaveSuccess?: () => void;
}

const MCU_OPTIONS = [
    "ESP32 (Wi-Fi / BLE)",
    "ESP8266",
    "Raspberry Pi Pico (RP2040)",
    "Arduino Nano / Uno",
    "STM32 (Blue Pill)",
    "nRF52 (Nordic BLE)",
    "Teensy 4.0 / 4.1",
    "ATtiny85"
];

const TOOL_OPTIONS = [
    "Soldering Iron & Solder",
    "Digital Multimeter",
    "Oscilloscope / Logic Analyzer",
    "3D Printer (FDM 220x220+)",
    "Resin 3D Printer",
    "Breadboards & Jumper Wires",
    "Benchtop Power Supply",
    "Hot Air Rework Station",
    "Wire Stripper & Flush Cutters",
    "Heat Shrink & Lighter"
];

const POWER_OPTIONS = [
    "USB-C (5V Power)",
    "Rechargeable LiPo / 18650 Battery (3.7V)",
    "AA / AAA Battery Pack",
    "9V Battery",
    "12V DC Wall Adapter",
    "Solar Panel + LiPo Charger"
];

const LANGUAGE_OPTIONS = [
    "Arduino C++ / PlatformIO",
    "MicroPython / CircuitPython",
    "ESP-IDF (Native C/C++)",
    "Embedded Rust"
];

/**
 * Reusable Option Grid with Custom Tag Input
 */
interface OptionSelectorWithCustomProps {
    label: string;
    icon: React.ReactNode;
    options: string[];
    selected: string[];
    onChange: (newSelected: string[]) => void;
    placeholder?: string;
    gridCols?: string;
    mono?: boolean;
}

function OptionSelectorWithCustom({
    label,
    icon,
    options,
    selected,
    onChange,
    placeholder = "Add other (comma separated or enter)...",
    gridCols = "grid-cols-2 sm:grid-cols-3",
    mono = false
}: OptionSelectorWithCustomProps) {
    const [customInput, setCustomInput] = useState("");

    const toggleItem = (item: string) => {
        if (selected.includes(item)) {
            onChange(selected.filter(i => i !== item));
        } else {
            onChange([...selected, item]);
        }
    };

    const handleAddCustom = () => {
        if (!customInput.trim()) return;

        // Split by comma to support multiple additions
        const newItems = customInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s && !selected.includes(s));

        if (newItems.length > 0) {
            onChange([...selected, ...newItems]);
        }
        setCustomInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustom();
        }
    };

    // Find custom items that aren't in predefined options
    const customItems = selected.filter(item => !options.includes(item));

    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                {icon}
                {label}
            </label>

            {/* Standard Options Grid */}
            <div className={`grid ${gridCols} gap-2`}>
                {options.map((option) => {
                    const isSelected = selected.includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleItem(option)}
                            className={`px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all ${
                                mono ? 'font-mono' : ''
                            } ${
                                isSelected
                                    ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                            }`}
                        >
                            <span className="truncate">{option}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-1" />}
                        </button>
                    );
                })}
            </div>

            {/* Custom Selected Items Badges */}
            {customItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {customItems.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/15 border border-primary/40 text-foreground"
                        >
                            <span>{item}</span>
                            <button
                                type="button"
                                onClick={() => toggleItem(item)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Add Custom / Other Input */}
            <div className="flex items-center gap-2 pt-1">
                <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustom}
                    disabled={!customInput.trim()}
                    className="h-8 px-2.5 text-xs inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                </Button>
            </div>
        </div>
    );
}

export default function UserProfileModal({ open, onOpenChange, onSaveSuccess }: UserProfileModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);

    const [skillLevel, setSkillLevel] = useState("Intermediate");
    const [selectedMcus, setSelectedMcus] = useState<string[]>([]);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [selectedPower, setSelectedPower] = useState<string[]>([]);
    const [programmingLanguages, setProgrammingLanguages] = useState<string[]>(["Arduino C++ / PlatformIO"]);
    const [inventory, setInventory] = useState("");
    const [notes, setNotes] = useState("");

    // Load profile on open
    useEffect(() => {
        if (!open) return;

        setLoading(true);
        fetch('/api/user-profile')
            .then(res => res.json())
            .then(data => {
                if (data.profile) {
                    const p = data.profile;
                    if (p.skillLevel) setSkillLevel(p.skillLevel);
                    if (Array.isArray(p.preferredMicrocontrollers)) setSelectedMcus(p.preferredMicrocontrollers);
                    if (Array.isArray(p.availableTools)) setSelectedTools(p.availableTools);
                    if (Array.isArray(p.powerPreferences)) setSelectedPower(p.powerPreferences);
                    if (p.programmingLanguage) {
                        const langs = p.programmingLanguage.split(',').map((s: string) => s.trim()).filter(Boolean);
                        setProgrammingLanguages(langs.length > 0 ? langs : ["Arduino C++ / PlatformIO"]);
                    }
                    if (p.componentInventory && p.componentInventory !== '[Not set]') setInventory(p.componentInventory);
                    if (p.workspaceNotes && p.workspaceNotes !== '[Not set]') setNotes(p.workspaceNotes);
                }
            })
            .catch(err => console.error("Error loading user profile:", err))
            .finally(() => setLoading(false));
    }, [open]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: {
                        skillLevel,
                        preferredMicrocontrollers: selectedMcus,
                        availableTools: selectedTools,
                        componentInventory: inventory.trim(),
                        powerPreferences: selectedPower,
                        programmingLanguage: programmingLanguages.join(', ') || 'Arduino C++ / PlatformIO',
                        workspaceNotes: notes.trim()
                    }
                })
            });

            if (res.ok) {
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 2000);
                if (onSaveSuccess) onSaveSuccess();
                setTimeout(() => onOpenChange(false), 600);
            }
        } catch (err) {
            console.error("Failed to save profile:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6 bg-card border-border shadow-2xl">
                <DialogHeader className="mb-4">
                    <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
                        <Wrench className="w-4 h-4" />
                        Maker Workspace Configuration
                    </div>
                    <DialogTitle className="text-2xl font-bold">Hardware & Maker Profile</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Ohm's OpenCode agents read this profile to tailor BOM parts, wiring diagrams, code frameworks, and 3D enclosures to your exact inventory and tools.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-16 text-center text-muted-foreground text-sm font-mono animate-pulse">
                        Loading workspace profile...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 1. Skill Level */}
                        <div>
                            <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Maker Experience Level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setSkillLevel(level)}
                                        className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                            skillLevel === level
                                                ? "border-primary bg-primary/10 text-foreground shadow-xs"
                                                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Microcontrollers with Custom Adder */}
                        <OptionSelectorWithCustom
                            label="Preferred Microcontrollers & Dev Boards"
                            icon={<Cpu className="w-4 h-4 text-primary" />}
                            options={MCU_OPTIONS}
                            selected={selectedMcus}
                            onChange={setSelectedMcus}
                            placeholder="Add other board (e.g. ESP32-S3, Seeed XIAO, Teensy 4.1)..."
                            gridCols="grid-cols-2 sm:grid-cols-4"
                            mono={true}
                        />

                        {/* 3. Available Tools with Custom Adder */}
                        <OptionSelectorWithCustom
                            label="Available Tools & Equipment"
                            icon={<Wrench className="w-4 h-4 text-primary" />}
                            options={TOOL_OPTIONS}
                            selected={selectedTools}
                            onChange={setSelectedTools}
                            placeholder="Add other tool (e.g. Hot Plate, Logic Analyzer, CNC, Lab Supply)..."
                            gridCols="grid-cols-2 sm:grid-cols-3"
                        />

                        {/* 4. Power Preferences with Custom Adder */}
                        <OptionSelectorWithCustom
                            label="Power Source Preferences"
                            icon={<Zap className="w-4 h-4 text-primary" />}
                            options={POWER_OPTIONS}
                            selected={selectedPower}
                            onChange={setSelectedPower}
                            placeholder="Add other power source (e.g. 24V Industrial, PoE, Coin Cell CR2032)..."
                            gridCols="grid-cols-2 sm:grid-cols-3"
                        />

                        {/* 5. Programming Language with Custom Adder */}
                        <OptionSelectorWithCustom
                            label="Preferred Firmware Language & IDE"
                            icon={<Code2 className="w-4 h-4 text-primary" />}
                            options={LANGUAGE_OPTIONS}
                            selected={programmingLanguages}
                            onChange={setProgrammingLanguages}
                            placeholder="Add other language / framework (e.g. TinyGo, Zephyr RTOS, CircuitPython)..."
                            gridCols="grid-cols-2 sm:grid-cols-4"
                            mono={true}
                        />

                        {/* 6. Spare Parts & Inventory */}
                        <div>
                            <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                                <Box className="w-4 h-4 text-primary" />
                                Owned Component Inventory & Spare Parts (Optional)
                            </label>
                            <p className="text-xs text-muted-foreground mb-2">
                                List sensors, displays, relays, or motors you already own so Ohm prioritizes them in your BOM.
                            </p>
                            <textarea
                                value={inventory}
                                onChange={(e) => setInventory(e.target.value)}
                                placeholder="e.g. 5x SG90 Servos, 0.96 inch SSD1306 OLED, DHT22 Sensor, 5V Relays, WS2812B NeoPixel ring, HC-SR04 ultrasonic..."
                                rows={3}
                                className="w-full rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-mono resize-none"
                            />
                        </div>

                        {/* 7. Workspace Notes */}
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-1 block">
                                Additional Workspace Notes
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Indoor desk setup, prefer compact enclosures, European 230V mains..."
                                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <span className="text-xs text-muted-foreground font-mono">
                                Saved to <code className="text-foreground">workspace/USER_PROFILE.md</code>
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    size="sm"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold inline-flex items-center gap-1.5"
                                >
                                    {saving ? (
                                        "Saving..."
                                    ) : savedNotice ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-300" />
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
