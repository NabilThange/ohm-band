/**
 * Visual Wiring Pipeline
 * Orchestrates the full wiring diagram generation workflow:
 * - Synchronous SVG generation (fast)
 * - Asynchronous AI image generation (background)
 * - Status tracking and error handling
 * - Progress updates for UI
 */

import { PromptBuilder } from './prompt-builder';
import { ImageGenerator } from './image-generator';
import { SVGSchematicGenerator } from './svg-generator';
import { ArtifactService } from '@/lib/db/artifacts';
import { getProviderConfig } from '@/lib/agents/provider-config';

interface WiringData {
  connections: Array<{
    from_component: string;
    from_pin: string;
    to_component: string;
    to_pin: string;
    wire_color?: string;
    wire_gauge?: string;
    notes?: string;
  }>;
  instructions: string;
  warnings?: string[];
}

interface VisualWiringResult {
  svg: string;
  artifactVersionNumber: number;
}

interface AIImageStatus {
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  current_step?: string;
  error?: string;
  breadboard?: {
    url: string;
    storage_path: string;
    prompt: string;
    model: string;
    generated_at: string;
  };
}

export class VisualWiringPipeline {
  private imageGenerator: ImageGenerator;
  private svgGenerator: SVGSchematicGenerator;

  constructor() {
    this.imageGenerator = new ImageGenerator();
    this.svgGenerator = new SVGSchematicGenerator();
  }

  /**
   * SYNCHRONOUS: Generate SVG schematic only (fast, ~500ms)
   * Returns immediately for instant user feedback
   */
  async generateSVG(wiringData: WiringData): Promise<string> {
    console.log('[VisualWiringPipeline] Generating SVG schematic...');
    const svg = this.svgGenerator.generateSchematic(wiringData);
    console.log('[VisualWiringPipeline] ✅ SVG generated:', svg.length, 'chars');
    return svg;
  }

  /**
   * ASYNCHRONOUS: Generate AI images in background
   * This runs AFTER the artifact is saved and user sees SVG
   * Updates artifact with progress and final result
   */
  async generateAIImages(
    chatId: string,
    artifactId: string,
    wiringData: WiringData
  ): Promise<void> {
    console.log('[VisualWiringPipeline] Starting async AI image generation...');
    console.log(`[VisualWiringPipeline] Chat ID: ${chatId}, Artifact ID: ${artifactId}`);

    try {
      // Step 1: Update status to 'generating'
      await this.updateImageStatus(chatId, artifactId, wiringData, {
        status: 'generating',
        progress: 10,
        current_step: 'Building prompt...'
      });

      // Step 2: Build prompt using template (instant, no LLM call)
      console.log('[VisualWiringPipeline] Building breadboard prompt...');
      const prompt = PromptBuilder.buildBreadboardPrompt(wiringData);
      console.log('[VisualWiringPipeline] Prompt generated:', prompt.substring(0, 100) + '...');

      // Evaluate prompt quality (optional, for logging)
      const { score, feedback } = PromptBuilder.evaluatePrompt(prompt);
      console.log(`[VisualWiringPipeline] Prompt quality score: ${score}/100`);
      if (score < 80) {
        console.warn('[VisualWiringPipeline] Prompt quality issues:', feedback);
      }

      await this.updateImageStatus(chatId, artifactId, wiringData, {
        status: 'generating',
        progress: 30,
        current_step: 'Generating image...'
      });

      // Step 3: Generate image via BYTEZ API (8-12 seconds)
      console.log('[VisualWiringPipeline] Calling BYTEZ API...');
      const imageResult = await this.imageGenerator.generateBreadboardImage(prompt, chatId);
      console.log('[VisualWiringPipeline] ✅ Image generated successfully!');

      await this.updateImageStatus(chatId, artifactId, wiringData, {
        status: 'generating',
        progress: 90,
        current_step: 'Finalizing...'
      });

      // Step 4: Update artifact with completed image
      await this.updateImageStatus(chatId, artifactId, wiringData, {
        status: 'completed',
        progress: 100,
        breadboard: {
          url: imageResult.url,
          storage_path: imageResult.storagePath,
          prompt: imageResult.prompt,
          model: imageResult.model,
          generated_at: imageResult.generatedAt
        }
      });

      console.log('[VisualWiringPipeline] ✅ AI image pipeline completed successfully');
      console.log(`[VisualWiringPipeline] Image URL: ${imageResult.url}`);

    } catch (error: any) {
      console.error('[VisualWiringPipeline] ❌ AI image generation failed:', error.message);
      console.error('[VisualWiringPipeline] Full error:', error);

      // Update artifact with failure status
      await this.updateImageStatus(chatId, artifactId, wiringData, {
        status: 'failed',
        progress: 0,
        error: error.message || 'Unknown error occurred',
        current_step: 'Failed'
      }).catch(updateError => {
        console.error('[VisualWiringPipeline] Failed to update error status:', updateError);
      });

      // Don't throw - this is a background job, failure should be logged but not crash
      // User will see error status in UI
    }
  }

  /**
   * Update artifact with AI image status
   * Creates a new version with updated metadata
   */
  private async updateImageStatus(
    chatId: string,
    artifactId: string,
    wiringData: WiringData,
    imageStatus: AIImageStatus
  ): Promise<void> {
    try {
      // Get current artifact to get latest version number
      const { artifact, version: currentVersion } = await ArtifactService.getLatestArtifact(
        chatId,
        'wiring'
      ) || { artifact: null, version: null };

      if (!artifact) {
        console.error('[VisualWiringPipeline] Artifact not found for chat:', chatId);
        return;
      }

      const currentVersionNumber = artifact.current_version || 0;

      // Create new version with updated status
      await ArtifactService.createVersion({
        artifact_id: artifact.id,
        version_number: currentVersionNumber + 1,
        content_json: {
          ...wiringData,
          ai_images: imageStatus
        } as any,
        diagram_svg: currentVersion?.diagram_svg || null, // Preserve existing SVG
        change_summary: `AI image status: ${imageStatus.status} (${imageStatus.progress}%)`
      });

      console.log(`[VisualWiringPipeline] Updated status to ${imageStatus.status} (${imageStatus.progress}%)`);
    } catch (error: any) {
      console.error('[VisualWiringPipeline] Failed to update image status:', error.message);
      throw error;
    }
  }

  /**
   * FULL PIPELINE: Generate both SVG (sync) and AI images (async)
   * Returns immediately with SVG, AI images generate in background
   */
  async generateAll(
    chatId: string,
    artifactId: string,
    wiringData: WiringData
  ): Promise<VisualWiringResult> {
    console.log('[VisualWiringPipeline] Starting full generation pipeline...');

    // Generate SVG immediately (fast, deterministic)
    const svg = await this.generateSVG(wiringData);

    // Get current artifact version
    const { artifact } = await ArtifactService.getLatestArtifact(chatId, 'wiring') || {};
    const currentVersionNumber = artifact?.current_version || 0;

    // Kick off AI image generation in background (don't await)
    if (this.imageGenerator.isConfigured()) {
      console.log('[VisualWiringPipeline] Starting background AI image generation...');
      this.generateAIImages(chatId, artifactId, wiringData).catch(err => {
        console.error('[VisualWiringPipeline] Background AI generation error:', err);
        // Error is already handled in generateAIImages, just log here
      });
    } else {
      const providerConfig = getProviderConfig();
      console.warn(`[VisualWiringPipeline] Image generation is not supported by the active provider (${providerConfig.name}) - skipping AI image generation`);
    }

    return {
      svg,
      artifactVersionNumber: currentVersionNumber + 1
    };
  }

  /**
   * Check if AI image generation is available
   */
  isAIGenerationAvailable(): boolean {
    return this.imageGenerator.isConfigured();
  }

  /**
   * Get available AI models
   */
  getAvailableModels() {
    return this.imageGenerator.getAvailableModels();
  }
}
