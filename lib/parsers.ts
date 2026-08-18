export interface BOMComponent {
    name: string;
    partNumber: string;
    quantity: number;
    voltage?: string;
    current?: string;
    estimatedCost?: number;
    supplier?: string;
    link?: string;
    notes?: string;
}

export interface BOMData {
    project_name?: string;
    summary?: string;
    components: BOMComponent[];
    totalCost?: number;
    powerAnalysis?: {
        totalCurrent?: string;
        recommendedSupply?: string;
    };
    warnings?: string[];
}

export interface CodeFile {
    path: string;
    filename: string;
    content: string;
    language: string;
    description?: string;
}

export interface CodeData {
    projectName?: string;
    files: CodeFile[];
}

export interface ProjectContextData {
    context: string | null;
    mvp: string | null;
    prd: string | null;
}

export interface ParsedQuestion {
    id: string;
    text: string;
    type: 'single_select' | 'multiple_select' | 'text' | 'textarea';
    options?: string[];
    required?: boolean;
}

export interface MessageSegment {
    type: 'text' | 'code';
    content: string;
    language?: string;
    filename?: string;
}

export function parseMessageContent(rawContent: string): {
    cleanedText: string;
    bomData: BOMData | null;
    isStreamingBOM: boolean;
    extractedReasoning?: string;
    hasQuestions: boolean;
    questions?: { questions: ParsedQuestion[] };
} {
    if (!rawContent) {
        return { cleanedText: '', bomData: null, isStreamingBOM: false, hasQuestions: false };
    }

    let text = rawContent;
    let extractedReasoning = '';
    let parsedQuestions: ParsedQuestion[] | null = null;

    // 1. Extract <think>...</think> reasoning blocks
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
        extractedReasoning = thinkMatch[1].trim();
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    } else {
        // Also handle unclosed streaming <think> tags
        const unclosedThink = text.match(/<think>([\s\S]*)$/i);
        if (unclosedThink) {
            extractedReasoning = unclosedThink[1].trim();
            text = text.replace(/<think>[\s\S]*$/i, '').trim();
        }
    }

    // 2. Extract <questions>...</questions> interactive questionnaire
    const questionsMatch = text.match(/<questions>([\s\S]*?)<\/questions>/i);
    if (questionsMatch) {
        try {
            const rawJson = questionsMatch[1].trim();
            const parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed)) {
                parsedQuestions = parsed.map((q: any, i: number) => ({
                    id: q.id || `q_${i + 1}`,
                    text: q.text || q.question || `Question ${i + 1}`,
                    type: q.type || 'single_select',
                    options: Array.isArray(q.options) ? q.options : [],
                    required: q.required !== false
                }));
            }
        } catch (e) {
            console.warn('[Parsers] Failed to parse <questions> JSON:', e);
        }
        text = text.replace(/<questions>[\s\S]*?<\/questions>/gi, '').trim();
    }

    // Fallback: Parse standalone JSON array of questions without XML wrapper [ { "id": "...", "options": [...] } ]
    if (!parsedQuestions) {
        const rawArrayMatch = text.match(/\[\s*\{\s*["']id["'][\s\S]*?\}\s*\]/);
        if (rawArrayMatch) {
            try {
                const parsed = JSON.parse(rawArrayMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].options || parsed[0].text || parsed[0].question)) {
                    parsedQuestions = parsed.map((q: any, i: number) => ({
                        id: q.id || `q_${i + 1}`,
                        text: q.text || q.question || `Question ${i + 1}`,
                        type: q.type || 'single_select',
                        options: Array.isArray(q.options) ? q.options : [],
                        required: q.required !== false
                    }));
                    text = text.replace(rawArrayMatch[0], '').trim();
                }
            } catch {}
        }
    }

    // 3. Remove legacy container tags if any exist
    const cleaned = text
        .replace(/<BOM_CONTAINER>[\s\S]*?<\/BOM_CONTAINER>/g, '')
        .replace(/<CODE_CONTAINER>[\s\S]*?<\/CODE_CONTAINER>/g, '')
        .trim();

    return {
        cleanedText: cleaned,
        bomData: null,
        isStreamingBOM: false,
        extractedReasoning: extractedReasoning || undefined,
        hasQuestions: !!parsedQuestions && parsedQuestions.length > 0,
        questions: parsedQuestions ? { questions: parsedQuestions } : undefined
    };
}

export function splitMessageIntoSegments(content: string): MessageSegment[] {
    if (!content) return [];

    const codeBlockRegex = /```([a-zA-Z0-9_-]*)(?::([^\n]+))?\n([\s\S]*?)```/g;
    const segments: MessageSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const text = content.slice(lastIndex, match.index);
            if (text) {
                segments.push({ type: 'text', content: text });
            }
        }

        const language = match[1] || 'text';
        const filename = match[2]?.trim() || `file_${segments.length + 1}.${language === 'cpp' ? 'ino' : language || 'txt'}`;
        const code = match[3] || '';

        segments.push({
            type: 'code',
            content: code,
            language,
            filename,
        });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        const text = content.slice(lastIndex);
        if (text) {
            segments.push({ type: 'text', content: text });
        }
    }

    return segments.length > 0 ? segments : [{ type: 'text', content }];
}

export function extractCodeBlocksFromMessage(content: string): CodeData | null {
    const segments = splitMessageIntoSegments(content);
    const codeSegments = segments.filter((s) => s.type === 'code');
    if (codeSegments.length === 0) return null;

    return {
        files: codeSegments.map((s, idx) => ({
            path: s.filename || `file_${idx + 1}.${s.language === 'cpp' ? 'ino' : s.language || 'txt'}`,
            filename: s.filename || `file_${idx + 1}.${s.language === 'cpp' ? 'ino' : s.language || 'txt'}`,
            content: s.content,
            language: s.language || 'text',
        })),
    };
}

export function formatAnswersForAgent(questions: any[], answers: Record<string, any>): string {
    if (!Array.isArray(questions)) return '';
    return questions
        .map((q, i) => {
            const label = q.question || q.text || `Question ${i + 1}`;
            const rawAns = answers[q.id] || answers[q.question] || answers[i] || 'Not answered';
            const ansText = typeof rawAns === 'object' && rawAns?.text ? rawAns.text : String(rawAns);
            return `**${label}**\nAnswer: ${ansText}`;
        })
        .join('\n\n');
}
