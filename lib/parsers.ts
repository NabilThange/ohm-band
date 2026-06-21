
export interface BOMComponent {
    id?: string;
    name: string;
    partNumber: string;
    category?: string;
    quantity: number;
    unitCost?: number;
    lineCost?: number;
    supplier?: string;
    link?: string;
    notes?: string;
    specs?: Record<string, any>;
}

export interface BOMData {
    project_name?: string;
    summary?: any;
    components: BOMComponent[];
    totalCost?: number;
    powerAnalysis?: {
        totalCurrent?: string;
        recommendedSupply?: string;
    };
    warnings?: string[];
}

import { parseQuestions } from "./agents/question-parser";

export interface CodeFile {
    path: string;
    content: string;
}

export interface CodeData {
    files: CodeFile[];
}

export interface ProjectContextData {
    context: string | null;
    mvp: string | null;
    prd: string | null;
}

/**
 * Enhanced BOM Parser - Handles multiple formats
 * 1. XML-style tags: <BOM_CONTAINER>...</BOM_CONTAINER>
 * 2. Markdown code blocks with BOM labels
 * 3. Plain JSON with project_name field
 */
export const extractBOMFromMessage = (content: string): BOMData | null => {
    // Pattern 1: XML-style tags <BOM_CONTAINER>...</BOM_CONTAINER>
    let match = content.match(/<BOM_CONTAINER>([\s\S]*?)<\/BOM_CONTAINER>/);

    // Pattern 2: Markdown code block with BOM/Bill of Materials label
    if (!match) {
        match = content.match(/(?:BOM|Bill of Materials)[\s\S]*?```(?:json)?\s*(\{[\s\S]*?"components"\s*:[\s\S]*?\})\s*```/i);
    }

    // Pattern 3: Just look for JSON with "project_name" and "components" (last resort)
    if (!match) {
        match = content.match(/(\{\s*"project_name"[\s\S]*?"components"\s*:[\s\S]*?\})/);
    }

    if (match && match[1]) {
        try {
            // Remove markdown code blocks if present
            const cleanJson = match[1].replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            console.log("[Parser] ✅ BOM extracted successfully");
            return parsed;
        } catch (e) {
            console.error("[Parser] ❌ Failed to parse BOM JSON", e);
            console.log("[Parser] Raw content:", match[1].substring(0, 200));
            return null;
        }
    }
    return null;
};

/**
 * Enhanced Code Parser - Handles multiple formats
 * 1. XML-style tags: <CODE_CONTAINER>...</CODE_CONTAINER>
 * 2. Markdown code blocks with Code/Firmware labels
 * 3. Plain JSON with "files" array
 */
export const extractCodeFromMessage = (content: string): CodeData | null => {
    // Pattern 1: XML-style tags <CODE_CONTAINER>...</CODE_CONTAINER>
    let match = content.match(/<CODE_CONTAINER>([\s\S]*?)<\/CODE_CONTAINER>/);

    // Pattern 2: Markdown code block with Code/Firmware label
    if (!match) {
        match = content.match(/(?:Code|Firmware)[\s\S]*?```(?:json)?\s*(\{[\s\S]*?"files"\s*:[\s\S]*?\})\s*```/i);
    }

    // Pattern 3: Just look for JSON with "files" array (last resort)
    if (!match) {
        match = content.match(/(\{\s*"files"\s*:\s*\[[\s\S]*?\]\s*\})/);
    }

    if (match && match[1]) {
        try {
            const cleanJson = match[1].replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            console.log("[Parser] ✅ Code extracted successfully");
            return parsed;
        } catch (e) {
            console.error("[Parser] ❌ Failed to parse Code JSON", e);
            console.log("[Parser] Raw content:", match[1].substring(0, 200));
            return null;
        }
    }
    return null;
};

/**
 * ULTRA-FLEXIBLE Context Parser
 * Handles ALL possible variations:
 * - Markdown code blocks: ```...```
 * - Various delimiters: ---, ***, ___, ###, or none
 * - With/without spaces around markers
 * - With/without line breaks
 * - Case insensitive
 */
export const extractContextFromMessage = (content: string): ProjectContextData => {
    console.log("[Parser] Extracting Context/MVP/PRD from message...");

    // Helper function to try multiple patterns for each artifact type
    const extractArtifact = (artifactName: string): string | null => {
        const patterns = [
            // Pattern 1: Markdown code block with markers
            new RegExp(`\`\`\`[\\s\\S]*?${artifactName}_START[\\s\\S]*?\`\`\`[\\s\\S]*?\`\`\`([\\s\\S]*?)\`\`\`[\\s\\S]*?${artifactName}_END`, 'i'),

            // Pattern 2: Standard markers with various delimiters (---, ***, ___, ###)
            new RegExp(`(?:[-*_#]{2,}|\\*\\*|##)?\\s*${artifactName}[_\\s-]*START\\s*(?:[-*_#]{2,}|\\*\\*|##)?\\s*([\\s\\S]*?)\\s*(?:[-*_#]{2,}|\\*\\*|##)?\\s*${artifactName}[_\\s-]*END`, 'i'),

            // Pattern 3: Without delimiters, just the markers
            new RegExp(`${artifactName}[_\\s-]*START\\s*([\\s\\S]*?)\\s*${artifactName}[_\\s-]*END`, 'i'),

            // Pattern 4: With line breaks and spaces
            new RegExp(`${artifactName}\\s*START\\s*\\n+([\\s\\S]*?)\\n+\\s*${artifactName}\\s*END`, 'i'),

            // Pattern 5: Compact (no line breaks)
            new RegExp(`${artifactName}START\\s*([\\s\\S]*?)\\s*${artifactName}END`, 'i'),

            // Pattern 6: Inside markdown code block (entire block)
            new RegExp(`\`\`\`\\s*${artifactName}[\\s\\S]*?\\n([\\s\\S]*?)\\n\`\`\``, 'i'),

            // Pattern 7: Markdown headers (## CONTEXT, etc.)
            new RegExp(`##\\s*${artifactName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i'),
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                const extracted = match[1].trim();
                if (extracted.length > 0) {
                    console.log(`[Parser] ✅ ${artifactName} found using pattern ${patterns.indexOf(pattern) + 1}`);
                    return extracted;
                }
            }
        }

        console.log(`[Parser] ⚠️ ${artifactName} not found`);
        return null;
    };

    const context = extractArtifact('CONTEXT');
    const mvp = extractArtifact('MVP');
    const prd = extractArtifact('PRD');

    if (context || mvp || prd) {
        console.log(`[Parser] ✅ Extracted - Context: ${!!context}, MVP: ${!!mvp}, PRD: ${!!prd}`);
    } else {
        console.log("[Parser] ❌ No Context/MVP/PRD artifacts found");
    }

    return {
        context,
        mvp,
        prd
    };
};

/**
 * Parses a message and extracts all supported artifacts.
 * Returns the cleaned text (with artifact containers removed) and the extracted data.
 */
export const parseMessageContent = (content: string) => {
    let cleanedText = content;

    // Remove questions tag/JSON from content so it doesn't render in Markdown
    const parsedQ = parseQuestions(cleanedText);
    cleanedText = parsedQ.text;

    let bomData: BOMData | null = null;
    let codeData: CodeData | null = null;
    let isStreamingBOM = false;
    let isStreamingCode = false;

    // Debug: Check if content contains BOM markers
    const hasBOMStart = content.includes('<BOM_CONTAINER>');
    const hasBOMEnd = content.includes('</BOM_CONTAINER>');
    if (hasBOMStart) {
        console.log('[Parser Debug] BOM container detected:', { hasBOMStart, hasBOMEnd, contentLength: content.length });
    }

    // Extract BOM - Support partial/streaming
    const bomMatch = cleanedText.match(/<BOM_CONTAINER>([\s\S]*?)(?:<\/BOM_CONTAINER>|$)/);
    if (bomMatch) {
        const isComplete = cleanedText.includes('</BOM_CONTAINER>');
        const jsonContent = bomMatch[1].trim();
        console.log('[Parser Debug] BOM match found:', { isComplete, jsonContentLength: jsonContent.length, jsonPreview: jsonContent.substring(0, 100) });

        if (isComplete) {
            try {
                // Remove markdown code blocks if present inside the container
                const cleanJson = jsonContent.replace(/```json/g, '').replace(/```/g, '').trim();
                bomData = JSON.parse(cleanJson);
                cleanedText = cleanedText.replace(/<BOM_CONTAINER>[\s\S]*?<\/BOM_CONTAINER>/, '').trim();
                console.log('[Parser Debug] ✅ BOM parsed successfully:', { projectName: bomData?.project_name, componentCount: bomData?.components?.length });
            } catch (e) {
                console.error("[Parser Debug] ❌ Failed to parse complete BOM JSON", e);
                console.error("[Parser Debug] Cleaned content attempt:", jsonContent.substring(0, 500));
            }
        } else {
            // Streaming mode
            isStreamingBOM = true;
            cleanedText = cleanedText.replace(/<BOM_CONTAINER>[\s\S]*$/, '').trim();
            console.log('[Parser Debug] 🔄 BOM is streaming (incomplete)');
        }
    } else if (hasBOMStart) {
        // Fallback to helper (only for complete messages)
        console.log('[Parser Debug] Using fallback extractBOMFromMessage...');
        bomData = extractBOMFromMessage(content);
        if (bomData) {
            console.log('[Parser Debug] ✅ Fallback found BOM:', bomData.project_name);
        }
    }

    // Extract CODE - Support partial/streaming
    const codeMatch = cleanedText.match(/<CODE_CONTAINER>([\s\S]*?)(?:<\/CODE_CONTAINER>|$)/);
    if (codeMatch) {
        const isComplete = cleanedText.includes('</CODE_CONTAINER>');
        const jsonContent = codeMatch[1].trim();

        if (isComplete) {
            try {
                codeData = JSON.parse(jsonContent);
                cleanedText = cleanedText.replace(/<CODE_CONTAINER>[\s\S]*?<\/CODE_CONTAINER>/, '').trim();
            } catch (e) {
                console.error("[Parser] Failed to parse complete Code JSON", e);
            }
        } else {
            isStreamingCode = true;
            cleanedText = cleanedText.replace(/<CODE_CONTAINER>[\s\S]*$/, '').trim();
        }
    }

    // Extract Context artifacts (hidden usually)
    const contextData = extractContextFromMessage(content);
    // Remove markers from cleaned text if they exist
    const artifactMarkers = [
        /CONTEXT_START[\s\S]*?CONTEXT_END/gi,
        /MVP_START[\s\S]*?MVP_END/gi,
        /PRD_START[\s\S]*?PRD_END/gi,
        /```[\s\S]*?CONTEXT_START[\s\S]*?```[\s\S]*?```[\s\S]*?```[\s\S]*?CONTEXT_END/gi, // Pattern 1 handler
    ];

    artifactMarkers.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
    });

    return {
        cleanedText: cleanedText.trim(),
        bomData,
        codeData,
        contextData,
        isStreamingBOM,
        isStreamingCode
    };
};

/**
 * Parses markdown code blocks from a message.
 * Detects filenames and groups them into a project structure.
 */
export interface ExtractedCodeBlock {
    projectName?: string;
    files: {
        filename: string;
        language: string;
        content: string;
    }[];
}

export const extractCodeBlocksFromMessage = (content: string): ExtractedCodeBlock | null => {
    // Print raw response for debugging as requested by user
    if (content.includes('```')) {
        console.log("[Code Parser] Raw AI Response Content:", content);
    }

    // Regex to match code blocks: ```language content ```
    // Capture group 1: language (optional)
    // Capture group 2: content
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    // Regex to find filename preceding the code block
    // file.ext: or file.ext
    // Look back a reasonable amount of characters (e.g., 100) before the match
    const filenameRegex = /([a-zA-Z0-9_\-\/]+\.(ino|cpp|h|html|css|js|jsx|ts|tsx|py|java|json|md))(:)?/i;

    console.log("[Code Parser] Starting extraction from content length:", content.length);
    const files: { filename: string; language: string; content: string }[] = [];
    let match;

    // We need to keep track of the original content to search backwards for filenames
    // But since exec() maintains state, we can use the index property

    while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1] || 'text';
        const codeContent = match[2];
        const startIndex = match.index;

        // Skip text/plain snippets from being extracted as files
        if (language.toLowerCase() === 'text' || language.toLowerCase() === 'txt') {
            continue;
        }

        console.log("[Code Parser] Found code block:", { language, startIndex });

        // Search backwards from the start of the code block for a filename
        // Look in the preceding 200 characters
        const lookbackText = content.substring(Math.max(0, startIndex - 200), startIndex);

        // Split by lines and check the last few lines
        const lines = lookbackText.split('\n');
        let filename = '';

        // Check standard pattern: "filename.ext:" or just "filename.ext" on the line before
        // Go backwards through lines
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line) continue;

            const fileMatch = line.match(filenameRegex);
            if (fileMatch) {
                filename = fileMatch[1];
                console.log("[Code Parser] Found filename:", filename);
                break;
            }

            // If we hit a line that looks like a sentence end or double newline, stop searching
            if (line.endsWith('.') || line.length > 100) break;
        }

        // Generate fallback filename if none found
        if (!filename) {
            const ext = language === 'cpp' ? 'ino' :
                language === 'javascript' ? 'js' :
                    language === 'typescript' ? 'ts' :
                        language === 'python' ? 'py' :
                            language === 'html' ? 'html' :
                                language === 'css' ? 'css' : 'txt';
            filename = `file_${files.length + 1}.${ext}`;
            console.log("[Code Parser] Using fallback filename:", filename);
        }

        files.push({
            filename,
            language: language.toLowerCase(),
            content: codeContent.trim() // Trim whitespace from the code content
        });
    }

    if (files.length === 0) {
        return null;
    }

    console.log("[Code Parser] Extraction complete. Files found:", files.length);

    return {
        // Can be enhanced later to extract project name from context
        projectName: "Generated Code",
        files
    };

};

export interface MessageSegment {
    type: 'text' | 'code';
    content?: string; // For text segments
    data?: {          // For code segments
        filename: string;
        language: string;
        content: string;
    };
}

export const splitMessageIntoSegments = (content: string): MessageSegment[] => {
    const segments: MessageSegment[] = [];
    let lastIndex = 0;

    // Regex to find code blocks: ```language\ncontent\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    // Regex to find filename preceding the code block, reuse existing pattern
    const filenameRegex = /([a-zA-Z0-9_\-\/]+\.(ino|cpp|h|html|css|js|jsx|ts|tsx|py|java|json|md))(:)?/i;

    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        const codeStart = match.index;
        const codeEnd = codeStart + match[0].length;
        const language = match[1] || 'text';
        const codeContent = match[2];

        // 1. Add text BEFORE this code block
        if (codeStart > lastIndex) {
            let textBefore = content.substring(lastIndex, codeStart);

            if (textBefore) {
                segments.push({ type: 'text', content: textBefore });
            }
        }

        // Special handling for text blocks - render as plain text (with markdown wrapping)
        // This keeps them out of the "Code Drawer" and renders them as standard markdown code blocks
        if (language.toLowerCase() === 'text' || language.toLowerCase() === 'txt') {
            segments.push({ type: 'text', content: match[0] });
            lastIndex = codeEnd;
            continue;
        }

        // 2. Extract Filename
        const lookbackText = content.substring(Math.max(0, codeStart - 200), codeStart);
        const lines = lookbackText.split('\n');
        let filename = '';

        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line) continue;

            const fileMatch = line.match(filenameRegex);
            if (fileMatch) {
                filename = fileMatch[1];
                break;
            }
            if (line.endsWith('.') || line.length > 100) break;
        }

        // Fallback filename
        if (!filename) {
            const ext = language === 'cpp' ? 'ino' :
                language === 'javascript' ? 'js' :
                    language === 'typescript' ? 'ts' :
                        language === 'python' ? 'py' :
                            language === 'html' ? 'html' :
                                language === 'css' ? 'css' : 'txt';
            filename = `file_${segments.filter(s => s.type === 'code').length + 1}.${ext}`;
        }

        // 3. Add the code block
        segments.push({
            type: 'code',
            data: {
                filename,
                language: language.toLowerCase(),
                content: codeContent.trim()
            }
        });

        lastIndex = codeEnd;
    }

    // 4. Add remaining text AFTER last code block
    if (lastIndex < content.length) {
        const textAfter = content.substring(lastIndex);
        if (textAfter) {
            segments.push({ type: 'text', content: textAfter });
        }
    }

    return segments;
};

