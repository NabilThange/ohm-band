/**
 * Circuit Diagram Generator Service
 * 
 * Main service for generating Fritzing-style breadboard diagrams using AI.
 * Handles BYTEZ API calls, image storage, and database updates.
 */

import { supabase } from '@/lib/supabase/client';
import { buildFritzingPrompt, CircuitJson, validateCircuitJson } from '../diagram-generation/prompt-builder';
import { getProviderConfig } from '@/lib/agents/provider-config';

/**
 * Generate a Fritzing-style breadboard diagram for a circuit
 */
export async function generateFritzingDiagram(
    circuitJson: CircuitJson,
    artifactId: string,
    chatId: string
): Promise<string> {
    try {
        // Validate circuit JSON
        if (!validateCircuitJson(circuitJson)) {
            throw new Error('Invalid circuit JSON format');
        }

        // Build AI prompt
        const { prompt, referenceType } = buildFritzingPrompt(circuitJson);

        console.log(`[Diagram Generator] Generating ${referenceType} circuit diagram for artifact ${artifactId}`);

        // Call BYTEZ API for image generation
        const tempImageUrl = await callBytezImageAPI(prompt, referenceType);

        // Download image from temporary URL (valid for 1 hour)
        const imageBuffer = await fetch(tempImageUrl).then(r => {
            if (!r.ok) throw new Error(`Failed to download image: ${r.statusText}`);
            return r.arrayBuffer();
        });

        // Upload to Supabase Storage for permanent storage
        const filename = `diagrams/${chatId}/${artifactId}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
            .from('circuit-diagrams')
            .upload(filename, imageBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('[Diagram Generator] Upload error:', uploadError);
            throw new Error(`Failed to upload diagram: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('circuit-diagrams')
            .getPublicUrl(filename);

        console.log(`[Diagram Generator] Diagram uploaded: ${publicUrl}`);

        // Update artifact_versions with diagram URL
        const { error: updateError } = await supabase
            .from('artifact_versions')
            .update({
                fritzing_url: publicUrl,
                diagram_status: 'complete',
                updated_at: new Date().toISOString()
            })
            .eq('id', artifactId);

        if (updateError) {
            console.error('[Diagram Generator] Database update error:', updateError);
            throw new Error(`Failed to update artifact: ${updateError.message}`);
        }

        return publicUrl;

    } catch (error) {
        console.error('[Diagram Generator] Generation failed:', error);

        // Mark artifact as failed
        const { error: updateError } = await supabase
            .from('artifact_versions')
            .update({
                diagram_status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                updated_at: new Date().toISOString()
            })
            .eq('id', artifactId);

        if (updateError) {
            console.error('[Diagram Generator] Failed to mark as failed:', updateError);
        }

        throw error;
    }
}

/**
 * Call BYTEZ API to generate image using Google Imagen 4
 */
async function callBytezImageAPI(prompt: string, referenceType: string): Promise<string> {
    const providerConfig = getProviderConfig();
    throw new Error(
        `Image generation is not supported by the active provider (${providerConfig.name}). ` +
        `This feature is temporarily disabled.`
    );
}

/**
 * Retry diagram generation for a failed artifact
 */
export async function retryDiagramGeneration(artifactId: string): Promise<void> {
    // Get artifact details
    const { data, error } = await (supabase
        .from('artifact_versions')
        .select('content_json, generation_attempts, artifact:artifacts(chat_id)')
        .eq('id', artifactId)
        .single() as any);

    if (error || !data) {
        throw new Error('Artifact not found');
    }

    const artifact = data as any;

    // Extract circuit JSON from artifact content
    const circuitJson = artifact.content_json?.circuit_json;

    if (!circuitJson) {
        throw new Error('No circuit JSON found in artifact');
    }

    // Reset status and retry
    const currentAttempts = artifact.generation_attempts || 0;

    await supabase
        .from('artifact_versions')
        .update({
            diagram_status: 'queued',
            error_message: null,
            generation_attempts: currentAttempts + 1
        })
        .eq('id', artifactId);

    // Re-queue for generation
    await supabase
        .from('diagram_queue')
        .insert({
            circuit_json: circuitJson,
            artifact_id: artifactId,
            chat_id: artifact.artifact.chat_id,
            status: 'queued'
        });
}

/**
 * Get diagram generation statistics
 */
export async function getDiagramStats(): Promise<{
    total: number;
    complete: number;
    failed: number;
    pending: number;
}> {
    const { data, error } = await supabase
        .from('artifact_versions')
        .select('diagram_status')
        .not('diagram_status', 'is', null);

    if (error || !data) {
        return { total: 0, complete: 0, failed: 0, pending: 0 };
    }

    const stats = {
        total: data.length,
        complete: data.filter(d => d.diagram_status === 'complete').length,
        failed: data.filter(d => d.diagram_status === 'failed').length,
        pending: data.filter(d => d.diagram_status === 'queued' || d.diagram_status === 'generating').length
    };

    return stats;
}
