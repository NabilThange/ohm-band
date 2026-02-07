"use client";

import { useState } from "react";
import { CheckIcon } from "./check";

/**
 * Test component to validate triggerOn prop functionality
 * Tests all 4 modes: hover, click, auto, none
 */
export default function AnimatedIconTest() {
    const [clickCount, setClickCount] = useState(0);
    const [autoKey, setAutoKey] = useState(0);

    return (
        <div className="p-8 space-y-8 bg-background">
            <h1 className="text-2xl font-bold">Animated Icon triggerOn Test</h1>

            {/* Hover Trigger */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">1. Hover Trigger (default)</h2>
                <p className="text-sm text-muted-foreground">Hover over the icon to animate</p>
                <div className="flex gap-4 items-center">
                    <CheckIcon size={32} className="text-green-500" />
                    <CheckIcon size={32} triggerOn="hover" className="text-green-500" />
                </div>
            </div>

            {/* Click Trigger */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">2. Click Trigger</h2>
                <p className="text-sm text-muted-foreground">Click the icon to animate</p>
                <div className="flex gap-4 items-center">
                    <CheckIcon
                        size={32}
                        triggerOn="click"
                        className="text-blue-500 cursor-pointer"
                        onClick={() => setClickCount(c => c + 1)}
                    />
                    <span className="text-sm">Clicks: {clickCount}</span>
                </div>
            </div>

            {/* Auto Trigger */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">3. Auto Trigger (on mount)</h2>
                <p className="text-sm text-muted-foreground">Icon animates automatically on mount</p>
                <div className="flex gap-4 items-center">
                    <CheckIcon key={autoKey} size={32} triggerOn="auto" className="text-purple-500" />
                    <button
                        onClick={() => setAutoKey(k => k + 1)}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
                    >
                        Remount (key={autoKey})
                    </button>
                </div>
            </div>

            {/* None Trigger */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">4. None Trigger (static)</h2>
                <p className="text-sm text-muted-foreground">No animation, static icon</p>
                <div className="flex gap-4 items-center">
                    <CheckIcon size={32} triggerOn="none" className="text-gray-500" />
                </div>
            </div>

            {/* Test Results */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Test Checklist:</h3>
                <ul className="space-y-1 text-sm">
                    <li>✅ Hover: Icon animates on mouse enter, returns on leave</li>
                    <li>✅ Click: Icon animates on click, counter increments</li>
                    <li>✅ Auto: Icon animates on mount, remount button triggers new animation</li>
                    <li>✅ None: Icon remains static, no animation</li>
                </ul>
            </div>
        </div>
    );
}
