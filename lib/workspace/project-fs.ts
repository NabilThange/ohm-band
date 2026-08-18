import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { SVGSchematicGenerator } from '@/lib/diagram/svg-generator';

const WORKSPACE_ROOT = process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'workspace')
    : path.join(process.cwd(), 'workspace');
const PROJECTS_ROOT = path.join(WORKSPACE_ROOT, 'projects');

export interface ProjectMetadata {
    id: string;
    title: string;
    stage: 'planning' | 'design' | 'build' | 'fix';
    stage_override?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CodeFile {
    path: string;
    filename?: string;
    language: string;
    content: string;
    description?: string;
}

export function slugifyProjectTitle(title: string): string {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 45);
    return slug || 'hardware-project';
}

/**
 * Ensure workspace and project directory structure exists with starter files
 */
export async function ensureProjectDirectory(chatId: string, title: string = 'New Hardware Project'): Promise<string> {
    const projectDir = path.join(PROJECTS_ROOT, chatId);

    // Create base workspace directories
    await fsp.mkdir(WORKSPACE_ROOT, { recursive: true });
    await fsp.mkdir(PROJECTS_ROOT, { recursive: true });

    // Global USER_PROFILE.md
    const userProfilePath = path.join(WORKSPACE_ROOT, 'USER_PROFILE.md');
    if (!fs.existsSync(userProfilePath)) {
        await fsp.writeFile(
            userProfilePath,
            `# User Hardware Profile\n\n> OpenCode agents MUST read this profile to tailor component recommendations, pinouts, firmware frameworks, and 3D enclosures to the maker's available gear and preferences.\n\n- **Skill Level**: [Not set]\n- **Preferred Microcontrollers**: [Not set]\n- **Available Tools**: [Not set]\n- **Component Inventory**: [Not set]\n- **Power Preferences**: [Not set]\n- **Programming Language**: [Not set]\n- **Workspace Notes**: [Not set]\n`,
            'utf-8'
        );
    }

    // Subdirectories for the project
    const subdirs = [
        'context',
        'bom',
        'budget',
        'wiring',
        'code/src',
        'enclosure'
    ];

    for (const subdir of subdirs) {
        await fsp.mkdir(path.join(projectDir, subdir), { recursive: true });
    }

    // stage.json
    const stagePath = path.join(projectDir, 'stage.json');
    if (!fs.existsSync(stagePath)) {
        const initialStage: ProjectMetadata = {
            id: chatId,
            title,
            stage: 'planning',
            stage_override: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await fsp.writeFile(stagePath, JSON.stringify(initialStage, null, 2), 'utf-8');
    }

    // AGENTS.md
    const agentsMdPath = path.join(projectDir, 'AGENTS.md');
    if (!fs.existsSync(agentsMdPath)) {
        await fsp.writeFile(
            agentsMdPath,
            `# Project Rules & Agent Directives\n**Project:** ${title}\n**Folder:** \`workspace/projects/${chatId}\`\n\n---\n\n## ⚠️ MANDATORY: Read workspace/USER_PROFILE.md FIRST\nBefore recommending components, choosing microcontrollers, writing firmware, or designing enclosures, agents **MUST** inspect \`workspace/USER_PROFILE.md\`.\n- Prioritize microcontrollers and dev boards the user already owns.\n- Use sensors and modules from their spare parts inventory.\n- Match firmware code to their preferred programming language/IDE.\n- Design 3D enclosures only if they have access to a 3D printer.\n\n---\n\n## 💬 In-Chat Interactive UI Directives\n- **NO CLI QUESTION TOOLS**: NEVER invoke native CLI question tools that block standard input.\n- **Interactive Question Wizard**: When asking questions or giving choices, output an interactive \`<questions>\` JSON block:\n  \`\`\`xml\n  <questions>\n  [\n    {\n      "id": "power_source",\n      "text": "What power source do you prefer?",\n      "type": "single_select",\n      "options": ["USB-C 5V", "Rechargeable LiPo 3.7V", "AA/AAA Batteries", "12V Wall Adapter"]\n    }\n  ]\n  </questions>\n  \`\`\`\n\n---\n\n## 🧭 Multi-Agent Collaboration Protocol\n\n### 1. Phase 1: Planning (Project Architect / Lead Engineer)\n- **Zero Assumptions**: DO NOT generate files on turn 1. Engage in collaborative discovery first.\n- **Layman Questions**: Ask simple, encouraging questions (Why, where, size, budget, vision) via \`<questions>\`. No technical jargon.\n- **Artifacts**: Once the vision is aligned, write \`context/context.md\`, \`context/prd.md\`, and \`context/mvp.md\`.\n\n### 2. Phase 2: Design (Component Specialist & Cost Guide)\n- Ask comfort and user-preference questions (battery run time, power source, preferred sensors).\n- Select parts and produce \`bom/bom.json\` and \`budget/budget.json\`.\n\n### 3. Phase 3: Build (Circuit Designer & Firmware Engineer)\n- **Wiring**: Generate exact pinout mappings in \`wiring/wiring.json\` with clear color codes.\n- **Firmware**: Ask behavioral questions, then write production C++/Arduino code in \`code/src/main.cpp\`.\n\n### 4. Phase 4: Enclosure & Fix (3D Designer & Hardware Doctor)\n- Ask physical mounting and form-factor preferences.\n- Generate clean parametric OpenSCAD scripts in \`enclosure/case.scad\`.\n- Troubleshoot step-by-step with practical diagnostics.\n`,
            'utf-8'
        );
    }

    return projectDir;
}

/**
 * List all projects for sidebar display
 */
export async function listAllProjects(): Promise<ProjectMetadata[]> {
    await fsp.mkdir(PROJECTS_ROOT, { recursive: true });
    const entries = await fsp.readdir(PROJECTS_ROOT, { withFileTypes: true });
    const projects: ProjectMetadata[] = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const stagePath = path.join(PROJECTS_ROOT, entry.name, 'stage.json');
            if (fs.existsSync(stagePath)) {
                try {
                    const content = await fsp.readFile(stagePath, 'utf-8');
                    const parsed = JSON.parse(content);
                    projects.push({
                        id: parsed.id || entry.name,
                        title: parsed.title || 'Untitled Project',
                        stage: parsed.stage || 'planning',
                        stage_override: parsed.stage_override || false,
                        createdAt: parsed.createdAt || new Date().toISOString(),
                        updatedAt: parsed.updatedAt || new Date().toISOString(),
                    });
                } catch {
                    projects.push({
                        id: entry.name,
                        title: entry.name,
                        stage: 'planning',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                }
            }
        }
    }

    return projects.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/**
 * Read specific artifact data from project files on disk
 */
export async function getProjectArtifact(chatId: string, type: string): Promise<any> {
    const projectDir = path.join(PROJECTS_ROOT, chatId);
    if (!fs.existsSync(projectDir)) {
        await ensureProjectDirectory(chatId);
    }

    switch (type) {
        case 'bom': {
            const bomPath = path.join(projectDir, 'bom', 'bom.json');
            if (fs.existsSync(bomPath)) {
                try {
                    const raw = await fsp.readFile(bomPath, 'utf-8');
                    return JSON.parse(raw);
                } catch (e: any) {
                    console.error('[project-fs] Error parsing bom.json:', e.message);
                }
            }
            return null;
        }

        case 'budget': {
            const budgetPath = path.join(projectDir, 'budget', 'budget.json');
            if (fs.existsSync(budgetPath)) {
                try {
                    const raw = await fsp.readFile(budgetPath, 'utf-8');
                    return JSON.parse(raw);
                } catch (e: any) {
                    console.error('[project-fs] Error parsing budget.json:', e.message);
                }
            }
            return null;
        }

        case 'wiring': {
            const wiringPath = path.join(projectDir, 'wiring', 'wiring.json');
            const svgPath = path.join(projectDir, 'wiring', 'diagram.svg');

            let wiringJson: any = null;
            let diagramSvg: string | null = null;

            if (fs.existsSync(wiringPath)) {
                try {
                    const raw = await fsp.readFile(wiringPath, 'utf-8');
                    wiringJson = JSON.parse(raw);
                } catch (e: any) {
                    console.error('[project-fs] Error parsing wiring.json:', e.message);
                }
            }

            if (fs.existsSync(svgPath)) {
                diagramSvg = await fsp.readFile(svgPath, 'utf-8');
            } else if (wiringJson) {
                // Generate SVG synchronously if wiring.json exists but diagram.svg is missing
                try {
                    const generator = new SVGSchematicGenerator();
                    diagramSvg = generator.generateSchematic(wiringJson);
                    await fsp.writeFile(svgPath, diagramSvg, 'utf-8');
                } catch (e: any) {
                    console.error('[project-fs] Error generating SVG from wiring.json:', e.message);
                }
            }

            if (!wiringJson && !diagramSvg) return null;

            return {
                ...wiringJson,
                diagram_svg: diagramSvg,
            };
        }

        case 'code': {
            const codeDir = path.join(projectDir, 'code');
            if (!fs.existsSync(codeDir)) return null;

            const files: CodeFile[] = [];

            async function scanDir(dir: string, baseDir: string) {
                const entries = await fsp.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

                    if (entry.isDirectory()) {
                        await scanDir(fullPath, baseDir);
                    } else if (entry.isFile()) {
                        const content = await fsp.readFile(fullPath, 'utf-8');
                        const ext = path.extname(entry.name).toLowerCase();
                        const languageMap: Record<string, string> = {
                            '.cpp': 'cpp',
                            '.c': 'c',
                            '.h': 'cpp',
                            '.hpp': 'cpp',
                            '.ino': 'arduino',
                            '.py': 'python',
                            '.ini': 'ini',
                            '.json': 'json',
                            '.md': 'markdown',
                        };

                        files.push({
                            path: relPath,
                            filename: path.basename(relPath),
                            language: languageMap[ext] || 'text',
                            content,
                        });
                    }
                }
            }

            await scanDir(codeDir, codeDir);
            return files.length > 0 ? { files } : null;
        }

        case 'enclosure': {
            const enclosureDir = path.join(projectDir, 'enclosure');
            if (!fs.existsSync(enclosureDir)) return null;

            const files: CodeFile[] = [];
            const entries = await fsp.readdir(enclosureDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isFile() && (entry.name.endsWith('.scad') || entry.name.endsWith('.stl') || entry.name.endsWith('.json'))) {
                    const fullPath = path.join(enclosureDir, entry.name);
                    const content = await fsp.readFile(fullPath, 'utf-8');
                    files.push({
                        path: entry.name,
                        filename: entry.name,
                        language: 'openscad',
                        content,
                    });
                }
            }

            return files.length > 0 ? { files } : null;
        }

        case 'context': {
            const contextDir = path.join(projectDir, 'context');
            if (!fs.existsSync(contextDir)) return null;

            const readOptional = async (filename: string) => {
                const p = path.join(contextDir, filename);
                return fs.existsSync(p) ? await fsp.readFile(p, 'utf-8') : null;
            };

            const [context, prd, mvp] = await Promise.all([
                readOptional('context.md'),
                readOptional('prd.md'),
                readOptional('mvp.md'),
            ]);

            if (!context && !prd && !mvp) return null;

            return {
                context,
                prd,
                mvp,
            };
        }

        case 'stage': {
            const stagePath = path.join(projectDir, 'stage.json');
            if (fs.existsSync(stagePath)) {
                const raw = await fsp.readFile(stagePath, 'utf-8');
                return JSON.parse(raw);
            }
            return null;
        }

        default:
            return null;
    }
}

/**
 * Write or update an artifact on disk and handle any downstream side effects
 */
export async function saveProjectArtifact(chatId: string, type: string, content: any, filename?: string): Promise<boolean> {
    const projectDir = await ensureProjectDirectory(chatId);

    switch (type) {
        case 'bom': {
            const bomPath = path.join(projectDir, 'bom', 'bom.json');
            const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            await fsp.writeFile(bomPath, data, 'utf-8');
            break;
        }

        case 'budget': {
            const budgetPath = path.join(projectDir, 'budget', 'budget.json');
            const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            await fsp.writeFile(budgetPath, data, 'utf-8');
            break;
        }

        case 'wiring': {
            const wiringPath = path.join(projectDir, 'wiring', 'wiring.json');
            const svgPath = path.join(projectDir, 'wiring', 'diagram.svg');
            const wiringJson = typeof content === 'string' ? JSON.parse(content) : content;

            await fsp.writeFile(wiringPath, JSON.stringify(wiringJson, null, 2), 'utf-8');

            // Synchronously generate IEEE SVG schematic
            try {
                const generator = new SVGSchematicGenerator();
                const svg = generator.generateSchematic(wiringJson);
                await fsp.writeFile(svgPath, svg, 'utf-8');
            } catch (e: any) {
                console.error('[project-fs] Failed to generate SVG:', e.message);
            }
            break;
        }

        case 'code': {
            const filePath = path.join(projectDir, 'code', filename || 'src/main.cpp');
            await fsp.mkdir(path.dirname(filePath), { recursive: true });
            const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            await fsp.writeFile(filePath, data, 'utf-8');
            break;
        }

        case 'enclosure': {
            const filePath = path.join(projectDir, 'enclosure', filename || 'case.scad');
            await fsp.mkdir(path.dirname(filePath), { recursive: true });
            const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            await fsp.writeFile(filePath, data, 'utf-8');
            break;
        }

        case 'context':
        case 'prd':
        case 'mvp': {
            const targetName = filename || (type === 'context' ? 'context.md' : type === 'prd' ? 'prd.md' : 'mvp.md');
            const filePath = path.join(projectDir, 'context', targetName);
            const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            await fsp.writeFile(filePath, data, 'utf-8');
            break;
        }

        default:
            return false;
    }

    // Auto-update stage evaluation
    await recalculateProjectStage(chatId);
    return true;
}

/**
 * Recalculate project stage based on files on disk
 */
export async function recalculateProjectStage(chatId: string): Promise<ProjectMetadata['stage']> {
    const projectDir = path.join(PROJECTS_ROOT, chatId);
    const stagePath = path.join(projectDir, 'stage.json');

    let currentStageMeta: ProjectMetadata = {
        id: chatId,
        title: 'Hardware Project',
        stage: 'planning',
        stage_override: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    if (fs.existsSync(stagePath)) {
        try {
            currentStageMeta = JSON.parse(await fsp.readFile(stagePath, 'utf-8'));
        } catch { }
    }

    // If stage override is set manually by user, respect it
    if (currentStageMeta.stage_override) {
        return currentStageMeta.stage;
    }

    const hasPRD = fs.existsSync(path.join(projectDir, 'context', 'prd.md'));
    const hasBOM = fs.existsSync(path.join(projectDir, 'bom', 'bom.json'));
    const hasWiring = fs.existsSync(path.join(projectDir, 'wiring', 'wiring.json'));
    const hasCode = fs.existsSync(path.join(projectDir, 'code', 'src', 'main.cpp')) || fs.existsSync(path.join(projectDir, 'code', 'main.cpp'));

    let evaluatedStage: ProjectMetadata['stage'] = 'planning';
    if (hasWiring && hasCode) {
        evaluatedStage = 'fix';
    } else if (hasBOM) {
        evaluatedStage = 'build';
    } else if (hasPRD) {
        evaluatedStage = 'design';
    }

    currentStageMeta.stage = evaluatedStage;
    currentStageMeta.updatedAt = new Date().toISOString();

    await fsp.writeFile(stagePath, JSON.stringify(currentStageMeta, null, 2), 'utf-8');
    return evaluatedStage;
}
