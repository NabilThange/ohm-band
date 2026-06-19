import { ConversationSummarizer } from './summarizer';

/**
 * Builds dynamic context for agent system prompts
 * Injects conversation summary and project state automatically
 */
export class AgentContextBuilder {
    private chatId: string;

    constructor(chatId: string) {
        this.chatId = chatId;
    }

    /**
     * Get enriched context to prepend to agent messages
     */
    async buildDynamicContext(): Promise<string> {
        try {
            console.log('[ContextBuilder] 🔍 Building dynamic context for chatId:', this.chatId);
            const summarizer = new ConversationSummarizer(this.chatId);
            const summaryText = await summarizer.getSummaryForContext();
            console.log('[ContextBuilder] 📝 Summary text received:', summaryText.substring(0, 100) + '...');

            // Check if there's actual context (not just "New conversation")
            if (summaryText.includes('New conversation')) {
                console.log('[ContextBuilder] ⏭️  New conversation detected, skipping context injection');
                return ''; // Don't inject empty context on first message
            }

            console.log('[ContextBuilder] ✅ Injecting conversation context');
            return `
---
📋 PROJECT CONTEXT (Auto-injected)
${summaryText}
---

Use the above context to inform your response. Reference previous decisions and artifacts when relevant.
`;
        } catch (error: any) {
            console.error('[ContextBuilder] ❌ ERROR building context:', error.message);
            console.error('[ContextBuilder] Stack:', error.stack);
            // Fail gracefully - don't break the agent if context building fails
            return '';
        }
    }

    /**
     * Get artifact metadata summary
     */
    async getArtifactsMetadata(): Promise<string> {
        const { ArtifactService } = await import('@/lib/db/artifacts');
        
        const types = ['context', 'mvp', 'prd', 'bom', 'code', 'wiring', 'budget', 'enclosure'];
        const existing: string[] = [];

        for (const type of types) {
            const artifact = await ArtifactService.getLatestArtifact(this.chatId, type as any);
            if (artifact) {
                existing.push(`${type} (v${artifact.artifact.current_version})`);
            }
        }

        return existing.length > 0
            ? `\nExisting artifacts: ${existing.join(', ')}`
            : '\nNo artifacts created yet.';
    }
}
