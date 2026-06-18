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

        // Update the parent artifact to point to this new version count if needed
        // (Actual pointer update usually logic driven, for now we just insert)

        // Automatically update the current_version counter on the parent artifact
        // @ts-ignore
        await supabase.rpc('increment_artifact_version', { artifact_id: version.artifact_id })

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
    }
}
