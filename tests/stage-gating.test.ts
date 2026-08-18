import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    STAGE_CONFIG,
    STAGE_ORDER,
    getStageIndex,
    isStageComplete
} from '../lib/stages/stage-config';
import {
    isArtifactValid,
    isVersionContentValid
} from '../lib/stages/artifact-validator';

describe('Seam: Stage Gating & Artifact Validator (lib/stages)', () => {
    test('STAGE_ORDER contains exactly planning, design, build, and fix', () => {
        assert.deepEqual(STAGE_ORDER, ['planning', 'design', 'build', 'fix']);
        assert.equal(getStageIndex('planning'), 0);
        assert.equal(getStageIndex('design'), 1);
        assert.equal(getStageIndex('build'), 2);
        assert.equal(getStageIndex('fix'), 3);
    });

    test('STAGE_CONFIG requires context, mvp, prd for planning stage', () => {
        assert.deepEqual(STAGE_CONFIG.planning.requiredArtifacts, ['context', 'mvp', 'prd']);
    });

    test('STAGE_CONFIG requires bom for design stage', () => {
        assert.deepEqual(STAGE_CONFIG.design.requiredArtifacts, ['bom']);
    });

    test('STAGE_CONFIG requires wiring and code for build stage', () => {
        assert.deepEqual(STAGE_CONFIG.build.requiredArtifacts, ['wiring', 'code']);
    });

    test('isStageComplete returns true only when all required artifacts exist', () => {
        const dummyMeta = {
            artifactId: '123',
            version: 1,
            generatedBy: 'opencode',
            createdAt: new Date().toISOString()
        };

        const incompletePlanning: any = {
            context: dummyMeta,
            mvp: dummyMeta,
            prd: null,
            bom: null,
            budget: null,
            wiring: null,
            code: null,
            enclosure: null
        };

        assert.equal(isStageComplete('planning', incompletePlanning), false);

        const completePlanning = {
            ...incompletePlanning,
            prd: dummyMeta
        };

        assert.equal(isStageComplete('planning', completePlanning), true);
    });

    test('isVersionContentValid validates minimum character length for string and json content', () => {
        assert.equal(isVersionContentValid('Too short', null), false);
        assert.equal(
            isVersionContentValid(
                'This is a valid long specification document containing more than fifty characters easily.',
                null
            ),
            true
        );

        assert.equal(isVersionContentValid(null, { empty: true }), false);
        assert.equal(
            isVersionContentValid(null, {
                components: [
                    { name: 'ESP32', partNumber: 'ESP32', quantity: 1, estimatedCost: 5.0 }
                ],
                totalCost: 5.0
            }),
            true
        );
    });
});
