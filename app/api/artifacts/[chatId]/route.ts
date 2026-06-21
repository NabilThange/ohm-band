import { NextRequest, NextResponse } from 'next/server';
import { ArtifactService } from '@/lib/db/artifacts';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'code', 'bom', 'wiring', etc.

        const validTypes = ["context", "mvp", "prd", "bom", "code", "wiring", "circuit", "budget", "conversation_summary", "enclosure"] as const;
        
        if (!type || !validTypes.includes(type as any)) {
            return NextResponse.json(
                { error: `Missing or invalid type parameter. Must be one of ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        console.log(`[API] Fetching ${type} artifact for chat ${chatId}`);

        // Get the artifact for this chat and type
        const artifact = await ArtifactService.getArtifactByChatAndType(chatId, type as any);

        if (!artifact) {
            return NextResponse.json(
                { error: `No ${type} artifact found for this chat` },
                { status: 404 }
            );
        }

        // Get the latest version
        const latestVersion = await ArtifactService.getLatestVersion(artifact.id);

        if (!latestVersion) {
            return NextResponse.json(
                { error: `No version found for ${type} artifact` },
                { status: 404 }
            );
        }

        console.log(`[API] ✅ Returning ${type} artifact v${latestVersion.version_number} with ${
            (latestVersion.content_json as any)?.files?.length || 0
        } files`);

        return NextResponse.json({
            artifact_id: artifact.id,
            type: artifact.type,
            title: artifact.title,
            version: latestVersion.version_number,
            data: latestVersion.content_json,
            updated_at: latestVersion.created_at
        });

    } catch (error: any) {
        console.error('[API] Error fetching artifact:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch artifact' },
            { status: 500 }
        );
    }
}
