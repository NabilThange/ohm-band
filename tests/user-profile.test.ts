import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/user-profile/route';

describe('Seam: User Hardware Profile API', () => {
    test('Empty profile returns isComplete === false', async () => {
        // Reset to empty profile
        const resetReq = new NextRequest('http://localhost/api/user-profile', {
            method: 'POST',
            body: JSON.stringify({
                rawMarkdown: `# User Hardware Profile\n\n- **Skill Level**: [Not set]\n- **Preferred Microcontrollers**: [Not set]\n- **Available Tools**: [Not set]\n- **Component Inventory**: [Not set]\n`
            })
        });
        await POST(resetReq);

        const getRes = await GET();
        assert.equal(getRes.status, 200);
        const data = await getRes.json();
        assert.equal(data.isComplete, false);
    });

    test('Saving complete profile updates workspace/USER_PROFILE.md and returns isComplete === true', async () => {
        const payload = {
            profile: {
                skillLevel: 'Intermediate',
                preferredMicrocontrollers: ['ESP32 (Wi-Fi / BLE)', 'Raspberry Pi Pico (RP2040)'],
                availableTools: ['Soldering Iron & Solder', 'Digital Multimeter', '3D Printer (FDM 220x220+)'],
                componentInventory: '5x SG90 Servos, 0.96 inch I2C OLED (SSD1306), DHT22 sensor',
                powerPreferences: ['USB-C (5V Power)', 'Rechargeable LiPo / 18650 Battery (3.7V)'],
                programmingLanguage: 'Arduino C++ / PlatformIO',
                workspaceNotes: 'Desk workspace with fume extractor'
            }
        };

        const postReq = new NextRequest('http://localhost/api/user-profile', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const postRes = await POST(postReq);
        assert.equal(postRes.status, 200);
        const postData = await postRes.json();
        assert.equal(postData.success, true);
        assert.equal(postData.isComplete, true);
        assert.equal(postData.profile.skillLevel, 'Intermediate');
        assert.deepEqual(postData.profile.preferredMicrocontrollers, ['ESP32 (Wi-Fi / BLE)', 'Raspberry Pi Pico (RP2040)']);

        // Verify GET returns the saved data
        const getRes = await GET();
        const getData = await getRes.json();
        assert.equal(getData.isComplete, true);
        assert.equal(getData.profile.skillLevel, 'Intermediate');
        assert.ok(getData.content.includes('ESP32 (Wi-Fi / BLE)'));
    });
});
