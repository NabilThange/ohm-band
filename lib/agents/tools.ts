/**
 * Tool Call Definitions for OHM Multi-Agent System
 * OpenAI-compatible function schemas for drawer updates
 */

export interface ToolCall {
    name: string;
    arguments: Record<string, any>;
}

export const DRAWER_TOOLS = {
    // ========================================
    // SIMPLIFIED TOOL SET (4 TOOLS)
    // ========================================

    read: {
        name: "read",
        description: "Read any project artifact to understand current project state. Use this to check what's been created or decided before making changes. Available artifacts: context, mvp, prd, bom, code, wiring, budget, conversation_summary.",
        parameters: {
            type: "object",
            properties: {
                artifact_type: {
                    type: "string",
                    enum: ["context", "mvp", "prd", "bom", "code", "wiring", "budget", "conversation_summary"],
                    description: "Type of artifact to read"
                },
                path: {
                    type: "string",
                    description: "Optional: For code artifacts, specify which file to read (e.g., 'src/main.cpp')"
                }
            },
            required: ["artifact_type"]
        }
    },

    write: {
        name: "write",
        description: "Create or update any project artifact. Supports all artifact types with flexible merge strategies. Always read the artifact first to preserve existing data.",
        parameters: {
            type: "object",
            properties: {
                artifact_type: {
                    type: "string",
                    enum: ["context", "mvp", "prd", "bom", "code", "wiring", "budget"],
                    description: "Type of artifact to write"
                },
                content: {
                    type: ["string", "object"],
                    description: "Content to write. Use string for markdown (context/mvp/prd), object for structured data (bom/wiring/budget)"
                },
                merge_strategy: {
                    type: "string",
                    enum: ["replace", "append", "merge"],
                    description: "How to handle existing content. Default: replace"
                },
                path: {
                    type: "string",
                    description: "For code artifacts: file path (e.g., 'src/main.cpp')"
                },
                language: {
                    type: "string",
                    description: "For code artifacts: programming language identifier"
                }
            },
            required: ["artifact_type", "content"]
        }
    },

    delete: {
        name: "delete",
        description: "Delete an artifact or specific file within an artifact. For code artifacts, specify the file path to delete a single file. Without path, deletes the entire artifact.",
        parameters: {
            type: "object",
            properties: {
                artifact_type: {
                    type: "string",
                    enum: ["context", "mvp", "prd", "bom", "code", "wiring", "budget"],
                    description: "Type of artifact to delete"
                },
                path: {
                    type: "string",
                    description: "Optional: For code artifacts, specify which file to delete (e.g., 'src/main.cpp')"
                }
            },
            required: ["artifact_type"]
        }
    },

    open_drawer: {
        name: "open_drawer",
        description: "Open any drawer to display project artifacts. Call this before generating content to show the user you're working on their project.",
        parameters: {
            type: "object",
            properties: {
                drawer: {
                    type: "string",
                    enum: ["context", "bom", "code", "wiring", "budget"],
                    description: "Which drawer to open"
                }
            },
            required: ["drawer"]
        }
    },

    // ========================================
    // LEGACY TOOLS (BACKWARD COMPATIBILITY)
    // ========================================

    open_context_drawer: {
        name: "open_context_drawer",
        description: "[DEPRECATED] Use open_drawer with drawer='context' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    open_bom_drawer: {
        name: "open_bom_drawer",
        description: "[DEPRECATED] Use open_drawer with drawer='bom' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    open_code_drawer: {
        name: "open_code_drawer",
        description: "[DEPRECATED] Use open_drawer with drawer='code' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    open_wiring_drawer: {
        name: "open_wiring_drawer",
        description: "[DEPRECATED] Use open_drawer with drawer='wiring' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    open_budget_drawer: {
        name: "open_budget_drawer",
        description: "[DEPRECATED] Use open_drawer with drawer='budget' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    update_context: {
        name: "update_context",
        description: "[DEPRECATED] Use write with artifact_type='context' instead",
        parameters: { type: "object", properties: { context: { type: "string" } }, required: ["context"] }
    },

    update_mvp: {
        name: "update_mvp",
        description: "[DEPRECATED] Use write with artifact_type='mvp' instead",
        parameters: { type: "object", properties: { mvp: { type: "string" } }, required: ["mvp"] }
    },

    update_prd: {
        name: "update_prd",
        description: "[DEPRECATED] Use write with artifact_type='prd' instead",
        parameters: { type: "object", properties: { prd: { type: "string" } }, required: ["prd"] }
    },

    update_bom: {
        name: "update_bom",
        description: "[DEPRECATED] Use write with artifact_type='bom' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    add_code_file: {
        name: "add_code_file",
        description: "[DEPRECATED] Use write with artifact_type='code' and path parameter instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    update_wiring: {
        name: "update_wiring",
        description: "[DEPRECATED] Use write with artifact_type='wiring' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    update_budget: {
        name: "update_budget",
        description: "[DEPRECATED] Use write with artifact_type='budget' instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    read_file: {
        name: "read_file",
        description: "[DEPRECATED] Use read instead",
        parameters: { type: "object", properties: {}, required: [] }
    },

    write_file: {
        name: "write_file",
        description: "[DEPRECATED] Use write instead",
        parameters: { type: "object", properties: {}, required: [] }
    }
};

/**
 * Get available tools for a specific agent type
 */
export function getToolsForAgent(agentType: string): any[] {
    const toolMap: Record<string, string[]> = {
        conversational: ['read', 'write', 'open_drawer'],
        projectInitializer: ['read', 'write', 'open_drawer'],
        bomGenerator: ['read', 'write', 'open_drawer'],
        codeGenerator: ['read', 'write', 'open_drawer'],
        wiringDiagram: ['read', 'write', 'open_drawer'],
        budgetOptimizer: ['read', 'write', 'open_drawer'],
        conversationSummarizer: ['read'],
        // Agents that don't use tools
        orchestrator: [],
        datasheetAnalyzer: [],
        // Debugger has read-only access
        debugger: ['read', 'open_drawer']
    };

    const toolNames = toolMap[agentType] || [];
    return toolNames.map(name => DRAWER_TOOLS[name as keyof typeof DRAWER_TOOLS]);
}