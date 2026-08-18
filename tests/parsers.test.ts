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

    test('parseMessageContent extracts <think> reasoning blocks out of message text', () => {
        const raw = `<think>
Analyzing the user's sensor requirements and ESP32 pin availability.
</think>
Here is the recommended circuit setup:`;

        const parsed = parseMessageContent(raw);
        assert.equal(parsed.extractedReasoning, "Analyzing the user's sensor requirements and ESP32 pin availability.");
        assert.ok(!parsed.cleanedText.includes('<think>'));
        assert.ok(parsed.cleanedText.includes('Here is the recommended circuit setup:'));
    });

    test('parseMessageContent extracts <questions> interactive questionnaire', () => {
        const raw = `Let me ask a few quick questions to narrow down the design:
<questions>
[
  {
    "id": "power_source",
    "text": "What power source do you want?",
    "type": "single_select",
    "options": ["USB-C 5V", "LiPo 3.7V"]
  }
]
</questions>
Let me know what you think!`;

        const parsed = parseMessageContent(raw);
        assert.equal(parsed.hasQuestions, true);
        assert.ok(parsed.questions);
        assert.equal(parsed.questions.questions.length, 1);
        assert.equal(parsed.questions.questions[0].id, 'power_source');
        assert.deepEqual(parsed.questions.questions[0].options, ['USB-C 5V', 'LiPo 3.7V']);
        assert.ok(!parsed.cleanedText.includes('<questions>'));
    });

    test('parseMessageContent handles standalone JSON arrays with multi_select and open-ended text', () => {
        const raw = `Here are questions:
[
  {"id":"extras","text":"Anything else you want?","type":"multi_select","options":["LED","OLED Screen"]},
  {"id":"notes","text":"Any specific mounting or dimensions requirements?"}
]
Take your time!`;

        const parsed = parseMessageContent(raw);
        assert.equal(parsed.hasQuestions, true);
        assert.ok(parsed.questions);
        assert.equal(parsed.questions.questions.length, 2);
        assert.equal(parsed.questions.questions[0].type, 'multiple_select');
        assert.equal(parsed.questions.questions[1].type, 'text');
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
        assert.ok(formatted.includes('Which microcontroller are you using?'));
        assert.ok(formatted.includes('Raspberry Pi Pico W'));
        assert.ok(formatted.includes('What is your target battery life?'));
        assert.ok(formatted.includes('7 days continuous'));
    });
});
