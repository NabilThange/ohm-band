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
} {
    if (!rawContent) return { cleanedText: '', bomData: null, isStreamingBOM: false };

    // Remove legacy container tags if any exist
    const cleaned = rawContent
        .replace(/<BOM_CONTAINER>[\s\S]*?<\/BOM_CONTAINER>/g, '')
        .replace(/<CODE_CONTAINER>[\s\S]*?<\/CODE_CONTAINER>/g, '')
        .trim();

    return {
        cleanedText: cleaned || rawContent,
        bomData: null,
        isStreamingBOM: false,
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
            const ans = answers[q.id] || answers[q.question] || answers[i] || 'Not answered';
            return `${label}: ${ans}`;
        })
        .join('\n\n');
}
