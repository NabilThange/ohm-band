import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type ArtifactType = Database['public']['Tables']['artifacts']['Row']['type']
type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert']
type VersionInsert = Database['public']['Tables']['artifact_versions']['Insert']

export const ArtifactService = {
    /**
     * Create a new artifact container
     */
    async createArtifact(userId: string, artifact: ArtifactInsert) {
        // Note: RLS should handle user permission checks via project_id or chat_id joining to user
        const { data, error } = await supabase
            .from('artifacts')
            .insert(artifact)
            .select()
            .single()

        if (error) throw error
        return data
    },

    /**
     * Create a new specific version of an artifact (Git-style)
     */
    async createVersion(version: VersionInsert) {
        const { data, error } = await supabase
            .from('artifact_versions')
            .insert(version)
            .select()
            .single()

        if (error) throw error

        // Update the parent artifact's current_version counter
        await supabase
            .from('artifacts')
            .update({ current_version: version.version_number })
            .eq('id', version.artifact_id);

        return data
    },

    /**
     * Get the latest version of a specific artifact type for a chat
     */
    async getLatestArtifact(chatId: string, type: ArtifactType) {
        // 1. Find the artifact
        const { data: artifact } = await supabase
            .from('artifacts')
            .select('id, title, current_version, metadata, created_at')
            .eq('chat_id', chatId)
            .eq('type', type)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!artifact) return null

        // 2. Get the specific version
        const { data: version } = await supabase
            .from('artifact_versions')
            .select('*')
            .eq('artifact_id', artifact.id)
            .order('version_number', { ascending: false })
            .limit(1)
            .single()

        return { artifact, version }
    },

    /**
     * Get artifact by chat ID and type (returns artifact record only)
     */
    async getArtifactByChatAndType(chatId: string, type: ArtifactType) {
        const { data, error } = await supabase
            .from('artifacts')
            .select('*')
            .eq('chat_id', chatId)
            .eq('type', type)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error
        return data
    },

    /**
     * Get the latest version of an artifact by artifact ID
     */
    async getLatestVersion(artifactId: string) {
        const { data, error } = await supabase
            .from('artifact_versions')
            .select('*')
            .eq('artifact_id', artifactId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error
        return data
    }
}
