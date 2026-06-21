const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    // Strip quotes if present
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('🔍 Querying latest code artifacts...');
    
    // Find all code artifacts
    const { data: artifacts, error: artError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('type', 'code')
        .order('created_at', { ascending: false });

    if (artError) {
        console.error('Error fetching artifacts:', artError);
        return;
    }

    if (!artifacts || artifacts.length === 0) {
        console.log('No code artifacts found.');
        return;
    }

    console.log(`Found ${artifacts.length} code artifacts.`);
    
    for (const art of artifacts) {
        console.log(`\n---------------------------------------`);
        console.log(`Artifact ID: ${art.id}`);
        console.log(`Chat ID: ${art.chat_id}`);
        console.log(`Title: ${art.title}`);
        console.log(`Current Version (parent table): ${art.current_version}`);
        
        // Fetch all versions of this artifact
        const { data: versions, error: verError } = await supabase
            .from('artifact_versions')
            .select('id, version_number, change_summary, created_at, content_json')
            .eq('artifact_id', art.id)
            .order('version_number', { ascending: true });

        if (verError) {
            console.error(`Error fetching versions for ${art.id}:`, verError);
            continue;
        }

        console.log(`Versions count: ${versions?.length || 0}`);
        for (const ver of versions || []) {
            const files = ver.content_json?.files || [];
            const filePaths = files.map(f => f.path);
            console.log(`  Version ${ver.version_number}: [${ver.id}]`);
            console.log(`    Change Summary: "${ver.change_summary}"`);
            console.log(`    Created At: ${ver.created_at}`);
            console.log(`    Files (${files.length}): ${JSON.stringify(filePaths)}`);
        }
    }
}

main().catch(console.error);
