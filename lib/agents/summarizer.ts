import { supabase } from '@/lib/supabase/client'
import { AgentRunner } from './orchestrator'

export interface ConversationSummary {
  summary: string;
  lastProcessedMessageId: string | null;
  lastProcessedSequenceNumber: number;
  messageCount: number;
  projectSnapshot: {
    components: string[];
    decisions: string[];
    codeFiles: string[];
    openQuestions: string[];
  };
  updatedAt: string;
}

const SUMMARY_TRIGGER_THRESHOLD = 5; // Update every 5 messages

/**
 * Conversation Summarizer
 * Creates incremental summaries of the conversation to reduce token usage
 * and maintain clear project state tracking
 */
export class ConversationSummarizer {
  private chatId: string;
  private runner: AgentRunner;

  constructor(chatId: string) {
    this.chatId = chatId;
    this.runner = new AgentRunner();
  }

  /**
   * Check if summary should be updated based on message count
   */
  shouldUpdateSummary(messageCount: number): boolean {
    return messageCount > 0 && messageCount % SUMMARY_TRIGGER_THRESHOLD === 0;
  }

  /**
   * Validate if a string is a valid UUID format
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Initialize a new conversation summary artifact
   */
  async initializeSummary(userId: string): Promise<string> {
    try {
      // Create artifact
      const { data: artifact, error: artifactError } = await supabase
        .from('artifacts')
        .insert({
          chat_id: this.chatId,
          type: 'conversation_summary',
          title: 'Conversation Summary',
          current_version: 1,
          metadata: {}
        })
        .select()
        .single();

      if (artifactError) throw artifactError;

      // Create initial version
      const initialSummary: ConversationSummary = {
        summary: 'Project just started',
        lastProcessedMessageId: null,
        lastProcessedSequenceNumber: 0,
        messageCount: 0,
        projectSnapshot: {
          components: [],
          decisions: [],
          codeFiles: [],
          openQuestions: []
        },
        updatedAt: new Date().toISOString()
      };

      // ponytail: Use content_json for structured data (ConversationSummary is JSON)
      const versionData: any = {
        artifact_id: artifact.id,
        version_number: 1,
        content_json: initialSummary
      };

      // Only add created_by if userId is a valid UUID (not 'system' or other strings)
      if (userId && this.isValidUUID(userId)) {
        versionData.created_by = userId;
      } else if (userId === 'system') {
        console.log('[Summarizer] Skipping created_by for system-generated summary');
        // Don't add created_by for system messages
      }

      const { error: versionError } = await supabase
        .from('artifact_versions')
        .insert(versionData);

      if (versionError) {
        // If error is about missing created_by column, retry without it
        if (versionError.message?.includes('created_by')) {
          console.warn('[Summarizer] created_by column not found, retrying without it...');
          delete versionData.created_by;
          const { error: retryError } = await supabase
            .from('artifact_versions')
            .insert(versionData);
          if (retryError) throw retryError;
        } else {
          throw versionError;
        }
      }

      return artifact.id;
    } catch (error) {
      console.error('[Summarizer] Failed to initialize summary:', error);
      // Don't throw - summarization is non-critical, just log the error
      throw error;
    }
  }

  /**
   * Get current conversation summary
   */
  async getCurrentSummary(): Promise<{ artifactId: string; summary: ConversationSummary } | null> {
    try {
      // Get the artifact
      const { data: artifact } = await supabase
        .from('artifacts')
        .select('id, current_version')
        .eq('chat_id', this.chatId)
        .eq('type', 'conversation_summary')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!artifact) return null;

      // ponytail: Read from content_json for structured data
      const { data: version } = await supabase
        .from('artifact_versions')
        .select('content_json')
        .eq('artifact_id', artifact.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (!version?.content_json) return null;

      const summary = version.content_json as unknown as ConversationSummary;

      // ponytail: Validate summary structure before returning
      if (!summary.summary || summary.messageCount === undefined) {
        console.warn('[Summarizer] Invalid summary structure detected, treating as null');
        return null;
      }

      return {
        artifactId: artifact.id,
        summary
      };
    } catch (error) {
      console.error('[Summarizer] Failed to get current summary:', error);
      return null;
    }
  }

  /**
   * Get new messages since last summary
   */
  private async getNewMessages(lastSequenceNumber: number): Promise<Array<{
    id: string;
    sequence_number: number;
    role: 'user' | 'assistant';
    content: string;
    agent_name: string | null;
  }>> {
    try {
      // ponytail: Handle legacy summaries with no sequence number
      const seqNum = lastSequenceNumber || 0;
      
      const { data, error } = await supabase
        .from('messages')
        .select('id, sequence_number, role, content, agent_name')
        .eq('chat_id', this.chatId)
        .gt('sequence_number', seqNum)
        .order('sequence_number', { ascending: true });

      if (error) throw error;

      // Filter out system messages
      return (data || []).filter(m => m.role !== 'system') as Array<{
        id: string;
        sequence_number: number;
        role: 'user' | 'assistant';
        content: string;
        agent_name: string | null;
      }>;
    } catch (error) {
      console.error('[Summarizer] Failed to get new messages:', error);
      return [];
    }
  }

  /**
   * Format messages for summarization
   */
  private formatMessagesForSummary(messages: Array<{ role: string; content: string; agent_name: string | null }>): string {
    return messages.map((m, idx) => {
      const speaker = m.role === 'user' ? 'User' : (m.agent_name || 'Assistant');
      return `[${idx + 1}] ${speaker}: ${m.content.slice(0, 500)}${m.content.length > 500 ? '...' : ''}`;
    }).join('\n\n');
  }

  /**
   * Update conversation summary with new messages
   */
  async updateSummary(userId: string): Promise<void> {
    try {
      // Get current summary
      const current = await this.getCurrentSummary();

      if (!current) {
        console.log('[Summarizer] No existing summary, initializing...');
        await this.initializeSummary(userId);
        return;
      }

      // Get new messages
      const newMessages = await this.getNewMessages(current.summary.lastProcessedSequenceNumber);

      // Check if we have enough new messages
      if (newMessages.length < SUMMARY_TRIGGER_THRESHOLD) {
        console.log(`[Summarizer] Not enough new messages (${newMessages.length}/${SUMMARY_TRIGGER_THRESHOLD})`);
        return;
      }

      console.log(`[Summarizer] Updating summary with ${newMessages.length} new messages...`);

      // Call summarizer agent
      const { response } = await this.runner.runAgent(
        'conversationSummarizer',
        [
          {
            role: 'user',
            content: this.buildSummaryPrompt(current.summary, newMessages)
          }
        ],
        { stream: false }
      );

      // Parse response and create new summary
      const updatedSummary: ConversationSummary = {
        summary: response.trim(),
        lastProcessedMessageId: newMessages[newMessages.length - 1].id,
        lastProcessedSequenceNumber: newMessages[newMessages.length - 1].sequence_number,
        messageCount: current.summary.messageCount + newMessages.length,
        projectSnapshot: this.extractProjectSnapshot(response),
        updatedAt: new Date().toISOString()
      };

      // ponytail: Get highest version number from DB, increment by 1 (safer than division)
      const { data: latestVersion } = await supabase
        .from('artifact_versions')
        .select('version_number')
        .eq('artifact_id', current.artifactId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newVersionNumber = (latestVersion?.version_number ?? 0) + 1;

      // ponytail: Use content_json for structured data
      const versionData: any = {
        artifact_id: current.artifactId,
        version_number: newVersionNumber,
        content_json: updatedSummary
      };

      // Only add created_by if userId is a valid UUID (not 'system' or other strings)
      if (userId && this.isValidUUID(userId)) {
        versionData.created_by = userId;
      } else if (userId === 'system') {
        console.log('[Summarizer] Skipping created_by for system-generated summary update');
        // Don't add created_by for system messages
      }

      const { error: versionError } = await supabase
        .from('artifact_versions')
        .insert(versionData);

      if (versionError) {
        // If error is about missing created_by column, retry without it
        if (versionError.message?.includes('created_by')) {
          console.warn('[Summarizer] created_by column not found, retrying without it...');
          delete versionData.created_by;
          const { error: retryError } = await supabase
            .from('artifact_versions')
            .insert(versionData);
          if (retryError) throw retryError;
        } else {
          throw versionError;
        }
      }

      // Update artifact version counter
      try {
        await supabase
          .from('artifacts')
          .update({ current_version: newVersionNumber })
          .eq('id', current.artifactId);
      } catch (rpcError) {
        console.warn('[Summarizer] Failed to update artifact version counter:', rpcError);
        // Non-critical, continue
      }

      console.log(`[Summarizer] ✅ Summary updated to v${newVersionNumber} (${updatedSummary.messageCount} messages processed)`);
    } catch (error) {
      console.error('[Summarizer] Failed to update summary:', error);
      // Don't throw - summarization is non-critical
    }
  }

  /**
   * Build prompt for summarizer agent
   */
  private buildSummaryPrompt(currentSummary: ConversationSummary, newMessages: Array<any>): string {
    const isFirstSummary = currentSummary.messageCount === 0;

    if (isFirstSummary) {
      return `You are summarizing the beginning of an IoT project conversation in OHM.

New messages:
${this.formatMessagesForSummary(newMessages)}

Create a concise technical summary (max 300 words) that captures:
1. **Project Goal** - What the user wants to build
2. **User Context** - Experience level, budget, constraints
3. **Key Decisions** - Components or approaches discussed
4. **Current Status** - What stage of development they're at

Be concise and factual. Focus on technical details, not conversation flow.`;
    }

    return `You are updating an existing IoT project summary in OHM.

**Current Summary:**
${currentSummary.summary}

**New messages to incorporate:**
${this.formatMessagesForSummary(newMessages)}

**Update the summary** to include new information. Rules:
- Keep it under 400 words
- Preserve critical earlier context (components chosen, decisions made)
- Add new developments (code files created, wiring diagrams, parts added to BOM)
- Update project status
- Remove obsolete/superseded info
- Stay technical and concise

Return ONLY the updated summary text, no preamble.`;
  }

  /**
   * Extract structured project snapshot from summary text
   */
  private extractProjectSnapshot(summaryText: string): ConversationSummary['projectSnapshot'] {
    // Simple keyword extraction for now - could be enhanced with NLP
    const components: string[] = [];
    const decisions: string[] = [];
    const codeFiles: string[] = [];
    const openQuestions: string[] = [];

    // Extract component mentions (ESP32, Arduino, etc.)
    const componentRegex = /(ESP32|Arduino|Raspberry Pi|DHT\d+|BME\d+|BMP\d+|OLED|LCD|sensor|relay|motor)/gi;
    const componentMatches = summaryText.match(componentRegex);
    if (componentMatches) {
      components.push(...new Set(componentMatches.map(c => c.toUpperCase())));
    }

    // Extract code file mentions
    const codeFileRegex = /(\w+\.(cpp|ino|py|h|hpp|js|ts|c))/gi;
    const fileMatches = summaryText.match(codeFileRegex);
    if (fileMatches) {
      codeFiles.push(...new Set(fileMatches));
    }

    // Extract questions
    const questionRegex = /[^\n.!?]*\?/g;
    const questionMatches = summaryText.match(questionRegex);
    if (questionMatches) {
      openQuestions.push(...questionMatches.slice(0, 3)); // Keep max 3
    }

    return { components, decisions, codeFiles, openQuestions };
  }

  /**
   * Get summary for agent context (formatted for system prompt)
   */
  async getSummaryForContext(): Promise<string> {
    const current = await this.getCurrentSummary();

    // ponytail: Guard against null, undefined, or incomplete summary objects
    if (!current?.summary || 
        typeof current.summary !== 'object' ||
        current.summary.messageCount === undefined ||
        current.summary.messageCount === 0) {
      return 'New conversation - no prior context';
    }

    const snapshot = current.summary.projectSnapshot;

    // ponytail: Handle legacy summaries without projectSnapshot
    if (!snapshot) {
      return `**CONVERSATION CONTEXT** (${current.summary.messageCount} messages):

${current.summary.summary || 'No summary available'}`;
    }

    return `**CONVERSATION CONTEXT** (${current.summary.messageCount} messages):

${current.summary.summary || 'No summary available'}

**Quick Facts:**
- Components: ${snapshot.components?.slice(0, 5).join(', ') || 'None yet'}
- Code Files: ${snapshot.codeFiles?.slice(0, 3).join(', ') || 'None yet'}
- Open Questions: ${snapshot.openQuestions?.length || 0}`;
  }
}
