/**
 * Question Parser - Extracts and validates question JSON from agent responses
 */

export interface Question {
  id: string;
  text: string;
  type: 'single_select' | 'multiple_select' | 'text' | 'textarea';
  options?: string[];
  required?: boolean;
}

export interface QuestionBlock {
  questions: Question[];
}

export interface ParsedResponse {
  text: string; // Clean text without JSON
  questions: QuestionBlock | null;
  hasQuestions: boolean;
}

/**
 * Extract question JSON from agent response
 * Supports: <QUESTIONS>...</QUESTIONS>, raw JSON at end, or JSON anywhere
 */
export function parseQuestions(response: string): ParsedResponse {
  // ponytail: Strip question tags first to prevent them from reaching React
  let cleanedText = response;
  
  // Pattern 1: <QUESTIONS>...</QUESTIONS> tags (ponytail: uppercase tags preferred)
  const tagPattern = /<QUESTIONS>\s*([\s\S]*?)\s*<\/QUESTIONS>/i;
  const tagMatch = response.match(tagPattern);
  
  if (tagMatch) {
    try {
      const jsonStr = tagMatch[1].trim();
      const questions = JSON.parse(jsonStr) as QuestionBlock;
      
      if (validateQuestions(questions)) {
        return {
          text: response.replace(tagPattern, '').trim(),
          questions,
          hasQuestions: true
        };
      }
    } catch (e) {
      console.warn('[QuestionParser] Failed to parse tagged JSON:', e);
    }
    // ponytail: Even if parse failed, strip the tags to prevent React errors
    cleanedText = response.replace(tagPattern, '').trim();
  }
  
  // Pattern 2: Raw JSON at end
  const trailingJsonPattern = /\n\s*(\{[\s\S]*"questions"[\s\S]*\})\s*$/;
  const trailingMatch = cleanedText.match(trailingJsonPattern);
  
  if (trailingMatch) {
    try {
      const questions = JSON.parse(trailingMatch[1]) as QuestionBlock;
      
      if (validateQuestions(questions)) {
        return {
          text: cleanedText.replace(trailingJsonPattern, '').trim(),
          questions,
          hasQuestions: true
        };
      }
    } catch (e) {
      console.warn('[QuestionParser] Failed to parse trailing JSON:', e);
    }
  }
  
  // Pattern 3: JSON anywhere (ponytail: catches AI that forgets wrapping)
  const anyJsonPattern = /\{[\s\S]*?"questions"\s*:\s*\[[\s\S]*?\]\s*\}/;
  const anyMatch = cleanedText.match(anyJsonPattern);
  
  if (anyMatch) {
    try {
      const questions = JSON.parse(anyMatch[0]) as QuestionBlock;
      
      if (validateQuestions(questions)) {
        return {
          text: cleanedText.replace(anyMatch[0], '').trim(),
          questions,
          hasQuestions: true
        };
      }
    } catch (e) {
      console.warn('[QuestionParser] Failed to parse embedded JSON:', e);
    }
  }
  
  return {
    text: cleanedText,
    questions: null,
    hasQuestions: false
  };
}

/**
 * Validate question structure
 */
function validateQuestions(block: QuestionBlock): boolean {
  if (!block.questions || !Array.isArray(block.questions)) {
    return false;
  }
  
  if (block.questions.length === 0 || block.questions.length > 5) {
    console.warn('[QuestionParser] Invalid question count:', block.questions.length);
    return false;
  }
  
  return block.questions.every((q, idx) => {
    if (!q.id || !q.text || !q.type) {
      console.warn(`[QuestionParser] Question ${idx} missing required fields`);
      return false;
    }
    
    if (!['single_select', 'multiple_select', 'text', 'textarea'].includes(q.type)) {
      console.warn(`[QuestionParser] Question ${idx} has invalid type:`, q.type);
      return false;
    }
    
    if ((q.type === 'single_select' || q.type === 'multiple_select') && 
        (!q.options || q.options.length < 2 || q.options.length > 5)) {
      console.warn(`[QuestionParser] Question ${idx} has invalid options count`);
      return false;
    }
    
    return true;
  });
}

/**
 * Format user answers for agent consumption
 * Converts Question Component output back to readable text
 */
export function formatAnswersForAgent(
  questions: Question[],
  answers: Record<string, { idx: number; text: string }>
): string {
  const lines = ['**User Provided Answers:**\n'];
  
  questions.forEach(q => {
    const answer = answers[q.id];
    if (answer) {
      lines.push(`- ${q.text}`);
      lines.push(`  Answer: ${answer.text}\n`);
    }
  });
  
  return lines.join('\n');
}
