import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

import {
    ensureProjectDirectory,
    listAllProjects,
    saveProjectArtifact,
    getProjectArtifact,
    recalculateProjectStage,
    slugifyProjectTitle
} from '../lib/workspace/project-fs';

describe('Seam: Local Project Filesystem (lib/workspace/project-fs)', () => {
    const testChatId = 'test-project-' + Date.now();
    const testProjectDir = path.join(process.cwd(), 'workspace', 'projects', testChatId);

    after(async () => {
        try {
            if (fs.existsSync(testProjectDir)) {
                await fsp.rm(testProjectDir, { recursive: true, force: true, maxRetries: 3 });
            }
        } catch { }
    });

    test('ensureProjectDirectory scaffolds complete folder structure and stage.json', async () => {
        const dir = await ensureProjectDirectory(testChatId, 'IoT Smart Weather Station');
        assert.equal(dir, testProjectDir);

        // Check folders
        assert.ok(fs.existsSync(path.join(testProjectDir, 'context')), 'context/ must exist');
        assert.ok(fs.existsSync(path.join(testProjectDir, 'bom')), 'bom/ must exist');
        assert.ok(fs.existsSync(path.join(testProjectDir, 'budget')), 'budget/ must exist');
        assert.ok(fs.existsSync(path.join(testProjectDir, 'wiring')), 'wiring/ must exist');
        assert.ok(fs.existsSync(path.join(testProjectDir, 'code', 'src')), 'code/src/ must exist');
        assert.ok(fs.existsSync(path.join(testProjectDir, 'enclosure')), 'enclosure/ must exist');

        // Check files
        assert.ok(fs.existsSync(path.join(testProjectDir, 'stage.json')), 'stage.json must exist');
        assert.ok(fs.existsSync(path.join(testProjectDir, 'AGENTS.md')), 'AGENTS.md must exist');

        const stageRaw = await fsp.readFile(path.join(testProjectDir, 'stage.json'), 'utf-8');
        const stageData = JSON.parse(stageRaw);
        assert.equal(stageData.id, testChatId);
        assert.equal(stageData.title, 'IoT Smart Weather Station');
        assert.equal(stageData.stage, 'planning');
    });

    test('saveProjectArtifact and getProjectArtifact for BOM', async () => {
        const sampleBom = {
            project_name: 'IoT Weather Station',
            summary: 'BOM with ESP32 and BME280',
            components: [
                { name: 'ESP32 NodeMCU', partNumber: 'ESP32-WROOM-32', quantity: 1, estimatedCost: 4.5 },
                { name: 'BME280 Sensor', partNumber: 'BME280', quantity: 1, estimatedCost: 3.2 }
            ],
            totalCost: 7.7
        };

        await saveProjectArtifact(testChatId, 'bom', sampleBom);
        const loaded: any = await getProjectArtifact(testChatId, 'bom');

        assert.ok(loaded);
        assert.equal(loaded.components.length, 2);
        assert.equal(loaded.components[0].name, 'ESP32 NodeMCU');
        assert.equal(loaded.totalCost, 7.7);
    });

    test('saveProjectArtifact for wiring triggers synchronous SVG schematic compilation', async () => {
        const sampleWiring = {
            connections: [
                { from_component: 'ESP32', from_pin: '3V3', to_component: 'BME280', to_pin: 'VIN', wire_color: 'red' },
                { from_component: 'ESP32', from_pin: 'GND', to_component: 'BME280', to_pin: 'GND', wire_color: 'black' },
                { from_component: 'ESP32', from_pin: 'GPIO21', to_component: 'BME280', to_pin: 'SDA', wire_color: 'blue' },
                { from_component: 'ESP32', from_pin: 'GPIO22', to_component: 'BME280', to_pin: 'SCL', wire_color: 'yellow' }
            ],
            instructions: 'Connect I2C bus pins directly'
        };

        await saveProjectArtifact(testChatId, 'wiring', sampleWiring);
        const loadedWiring: any = await getProjectArtifact(testChatId, 'wiring');

        assert.ok(loadedWiring, 'Wiring artifact should load');
        assert.equal(loadedWiring.connections.length, 4);
        assert.ok(loadedWiring.diagram_svg, 'diagram_svg must be generated');
        assert.ok(loadedWiring.diagram_svg.includes('<svg'), 'diagram_svg must contain valid SVG tag');
        assert.ok(loadedWiring.diagram_svg.includes('BME280'), 'diagram_svg must include component labels');
    });

    test('saveProjectArtifact and getProjectArtifact for Code', async () => {
        const codeContent = `#include <Wire.h>\nvoid setup() { Serial.begin(115200); }\nvoid loop() {}`;
        await saveProjectArtifact(testChatId, 'code', codeContent, 'src/main.cpp');

        const loadedCode: any = await getProjectArtifact(testChatId, 'code');
        assert.ok(loadedCode, 'Code artifact must exist');
        assert.ok(loadedCode.files.length >= 1);
        const mainCpp = loadedCode.files.find((f: any) => f.path.includes('main.cpp'));
        assert.ok(mainCpp, 'main.cpp should be found');
        assert.ok(mainCpp.content.includes('Serial.begin'));
    });

    test('saveProjectArtifact and getProjectArtifact for Context', async () => {
        await saveProjectArtifact(testChatId, 'context', '# Weather Station Context', 'context.md');
        await saveProjectArtifact(testChatId, 'context', '# MVP Spec', 'mvp.md');
        await saveProjectArtifact(testChatId, 'context', '# PRD Requirements', 'prd.md');

        const loadedContext: any = await getProjectArtifact(testChatId, 'context');
        assert.ok(loadedContext);
        assert.equal(loadedContext.context, '# Weather Station Context');
        assert.equal(loadedContext.mvp, '# MVP Spec');
        assert.equal(loadedContext.prd, '# PRD Requirements');
    });

    test('recalculateProjectStage advances stage to build when context, bom, wiring, and code exist', async () => {
        const currentStage = await recalculateProjectStage(testChatId);
        assert.ok(['build', 'fix'].includes(currentStage), `Stage should be build or fix, got ${currentStage}`);
    });

    test('listAllProjects returns test project summary', async () => {
        const projects = await listAllProjects();
        assert.ok(Array.isArray(projects));
        const found = projects.find((p: any) => p.id === testChatId);
        assert.ok(found, 'Created project should appear in listAllProjects');
        assert.equal(found.title, 'IoT Smart Weather Station');
    });

    test('slugifyProjectTitle converts natural titles to clean hyphenated directory slugs', () => {
        assert.equal(slugifyProjectTitle('Smart Plant Waterer'), 'smart-plant-waterer');
        assert.equal(slugifyProjectTitle('IoT Drone Companion v2.0!'), 'iot-drone-companion-v2-0');
        assert.equal(slugifyProjectTitle('   ---   Automatic Pet Feeder ### '), 'automatic-pet-feeder');
    });
});
