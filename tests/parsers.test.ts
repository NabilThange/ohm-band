import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseMessageContent,
    splitMessageIntoSegments,
    extractCodeBlocksFromMessage,
    formatAnswersForAgent
} from '../lib/parsers';

describe('Seam: Message Parsers & Segmenters (lib/parsers)', () => {
    test('parseMessageContent strips legacy container tags and returns cleaned text', () => {
        const raw = `Here is the plan:
<BOM_CONTAINER>
{"components": []}
</BOM_CONTAINER>
Now let's build the firmware.`;

        const parsed = parseMessageContent(raw);
        assert.ok(!parsed.cleanedText.includes('<BOM_CONTAINER>'));
        assert.ok(parsed.cleanedText.includes('Here is the plan:'));
        assert.ok(parsed.cleanedText.includes("Now let's build the firmware."));
    });

    test('splitMessageIntoSegments extracts text and code segments with filenames', () => {
        const textWithCode = `Here is the header:
\`\`\`cpp:include/config.h
#define BAUD_RATE 115200
#define PIN_LED 13
\`\`\`
And the main implementation:
\`\`\`cpp:src/main.cpp
#include "config.h"
void setup() {}
\`\`\`
Done!`;

        const segments = splitMessageIntoSegments(textWithCode);
        assert.equal(segments.length, 5);

        assert.equal(segments[0].type, 'text');
        assert.ok(segments[0].content.includes('Here is the header:'));

        assert.equal(segments[1].type, 'code');
        assert.equal(segments[1].filename, 'include/config.h');
        assert.equal(segments[1].language, 'cpp');
        assert.ok(segments[1].content.includes('#define BAUD_RATE'));

        assert.equal(segments[2].type, 'text');
        assert.ok(segments[2].content.includes('And the main implementation:'));

        assert.equal(segments[3].type, 'code');
        assert.equal(segments[3].filename, 'src/main.cpp');
        assert.ok(segments[3].content.includes('void setup()'));

        assert.equal(segments[4].type, 'text');
        assert.ok(segments[4].content.includes('Done!'));
    });

    test('extractCodeBlocksFromMessage converts code segments into CodeData structure', () => {
        const markdown = `
\`\`\`python:sensor.py
def read_temp():
    return 24.5
\`\`\`
`;
        const codeData = extractCodeBlocksFromMessage(markdown);
        assert.ok(codeData);
        assert.equal(codeData.files.length, 1);
        assert.equal(codeData.files[0].filename, 'sensor.py');
        assert.equal(codeData.files[0].language, 'python');
        assert.ok(codeData.files[0].content.includes('def read_temp'));
    });

    test('formatAnswersForAgent formats questions and user answers for prompt injection', () => {
        const questions = [
            { id: 'q1', question: 'Which microcontroller are you using?' },
            { id: 'q2', question: 'What is your target battery life?' }
        ];
        const answers = {
            q1: 'Raspberry Pi Pico W',
            q2: '7 days continuous'
        };

        const formatted = formatAnswersForAgent(questions, answers);
        assert.ok(formatted.includes('Which microcontroller are you using?: Raspberry Pi Pico W'));
        assert.ok(formatted.includes('What is your target battery life?: 7 days continuous'));
    });
});
