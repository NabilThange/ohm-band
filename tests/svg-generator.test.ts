import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SVGSchematicGenerator } from '../lib/diagram/svg-generator';

describe('Seam: Deterministic SVG Schematic Generator (lib/diagram/svg-generator)', () => {
    const generator = new SVGSchematicGenerator();

    test('generateSchematic returns empty schematic when no connections provided', () => {
        const emptySvg = generator.generateSchematic({ connections: [], instructions: 'None' });
        assert.ok(emptySvg.includes('<svg'));
        assert.ok(emptySvg.includes('No connections to display'));
    });

    test('generateSchematic generates valid SVG with component boxes, wire lines, and pin labels', () => {
        const wiringData = {
            connections: [
                {
                    from_component: 'Arduino Uno',
                    from_pin: 'D13',
                    to_component: 'LED',
                    to_pin: 'ANODE',
                    wire_color: 'yellow',
                    notes: 'Current limiting resistor in series'
                },
                {
                    from_component: 'Arduino Uno',
                    from_pin: 'GND',
                    to_component: 'LED',
                    to_pin: 'CATHODE',
                    wire_color: 'black'
                }
            ],
            instructions: 'Wire anode to pin 13 and cathode to GND'
        };

        const svg = generator.generateSchematic(wiringData);

        // Verification assertions
        assert.ok(svg.startsWith('<svg'), 'Output must start with <svg tag');
        assert.ok(svg.endsWith('</svg>'), 'Output must end with </svg> tag');
        assert.ok(svg.includes('Arduino Uno'), 'Must render source component name');
        assert.ok(svg.includes('LED'), 'Must render target component name');
        assert.ok(svg.includes('D13'), 'Must render source pin label');
        assert.ok(svg.includes('ANODE'), 'Must render target pin label');
        assert.ok(svg.includes('<line'), 'Must render wire lines');
        assert.ok(svg.includes('stroke="#eab308"'), 'Must render yellow wire color');
        assert.ok(svg.includes('stroke="#000000"'), 'Must render black wire color');
    });

    test('generateSchematic handles power and ground buses', () => {
        const wiringData = {
            connections: [
                { from_component: 'ESP32', from_pin: '3V3', to_component: 'Sensor', to_pin: 'VCC', wire_color: 'red' },
                { from_component: 'ESP32', from_pin: 'GND', to_component: 'Sensor', to_pin: 'GND', wire_color: 'black' }
            ],
            instructions: 'Power rail'
        };

        const svg = generator.generateSchematic(wiringData);
        assert.ok(svg.includes('3V3'));
        assert.ok(svg.includes('VCC'));
        assert.ok(svg.includes('stroke="#dc2626"')); // Red wire
    });
});
