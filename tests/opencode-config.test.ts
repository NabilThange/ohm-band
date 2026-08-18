import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Seam: OpenCode Config & Personas (opencode.json)', () => {
    const configPath = path.join(process.cwd(), 'opencode.json');

    test('opencode.json exists and is valid JSON', () => {
        assert.ok(fs.existsSync(configPath), 'opencode.json must exist at repo root');
        const raw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(raw);
        assert.ok(config, 'Parsed config must be non-null');
        assert.ok(config.agent, 'Config must define agent personas');
    });

    test('All 7 required hardware agent personas are defined in opencode.json', () => {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(raw);

        const expectedAgents = [
            'projectInitializer',
            'bomGenerator',
            'budgetOptimizer',
            'wiringSpecialist',
            'codeGenerator',
            'enclosureGenerator',
            'debugger'
        ];

        expectedAgents.forEach(agentName => {
            assert.ok(config.agent[agentName], `Persona '${agentName}' must be defined`);
            assert.ok(config.agent[agentName].prompt, `Persona '${agentName}' must have a system prompt`);
        });
    });

    test('All agent personas have allowed native tools', () => {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(raw);

        Object.entries(config.agent).forEach(([name, agentConfig]: [string, any]) => {
            if (agentConfig.tools) {
                assert.ok(
                    typeof agentConfig.tools === 'object',
                    `Agent ${name} tools must be a permission configuration object`
                );
            }
        });
    });
});
