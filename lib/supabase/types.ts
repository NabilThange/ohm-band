export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    ai_preferences: Json
                    total_chats: number
                    total_projects: number
                    subscription_tier: string
                }
                Insert: {
                    id: string
                    created_at?: string
                    updated_at?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    ai_preferences?: Json
                    total_chats?: number
                    total_projects?: number
                    subscription_tier?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    ai_preferences?: Json
                    total_chats?: number
                    total_projects?: number
                    subscription_tier?: string
                }
                Relationships: []
            }
            user_quotas: {
                Row: {
                    user_id: string
                    messages_this_month: number
                    messages_limit: number
                    projects_this_month: number
                    projects_limit: number
                    tokens_used_this_month: number
                    tokens_limit: number
                    cost_this_month: number
                    quota_reset_at: string | null
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    messages_this_month?: number
                    messages_limit?: number
                    projects_this_month?: number
                    projects_limit?: number
                    tokens_used_this_month?: number
                    tokens_limit?: number
                    cost_this_month?: number
                    quota_reset_at?: string | null
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    messages_this_month?: number
                    messages_limit?: number
                    projects_this_month?: number
                    projects_limit?: number
                    tokens_used_this_month?: number
                    tokens_limit?: number
                    cost_this_month?: number
                    quota_reset_at?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            component_templates: {
                Row: {
                    id: string
                    name: string
                    category: string
                    manufacturer: string | null
                    svg_symbol: string | null
                    breadboard_image_url: string | null
                    pinout_diagram_url: string | null
                    pins: Json
                    voltage_range: string | null
                    interface_types: string[] | null
                    default_specs: Json | null
                    description: string | null
                    common_uses: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category: string
                    manufacturer?: string | null
                    svg_symbol?: string | null
                    breadboard_image_url?: string | null
                    pinout_diagram_url?: string | null
                    pins: Json
                    voltage_range?: string | null
                    interface_types?: string[] | null
                    default_specs?: Json | null
                    description?: string | null
                    common_uses?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string
                    manufacturer?: string | null
                    svg_symbol?: string | null
                    breadboard_image_url?: string | null
                    pinout_diagram_url?: string | null
                    pins?: Json
                    voltage_range?: string | null
                    interface_types?: string[] | null
                    default_specs?: Json | null
                    description?: string | null
                    common_uses?: string[] | null
                    created_at?: string
                }
                Relationships: []
            }
            projects: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    category: string | null
                    goal: string | null
                    location: string | null
                    target_budget: number | null
                    current_estimated_cost: number | null
                    status: string | null
                    is_locked: boolean | null
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    category?: string | null
                    goal?: string | null
                    location?: string | null
                    target_budget?: number | null
                    current_estimated_cost?: number | null
                    status?: string | null
                    is_locked?: boolean | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    category?: string | null
                    goal?: string | null
                    location?: string | null
                    target_budget?: number | null
                    current_estimated_cost?: number | null
                    status?: string | null
                    is_locked?: boolean | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            chats: {
                Row: {
                    id: string
                    user_id: string | null
                    project_id: string | null
                    title: string | null
                    is_archived: boolean | null
                    is_public: boolean | null
                    share_token: string | null
                    last_message_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    project_id?: string | null
                    title?: string | null
                    is_archived?: boolean | null
                    is_public?: boolean | null
                    share_token?: string | null
                    last_message_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    project_id?: string | null
                    title?: string | null
                    is_archived?: boolean | null
                    is_public?: boolean | null
                    share_token?: string | null
                    last_message_at?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            chat_sessions: {
                Row: {
                    id: string
                    chat_id: string
                    current_agent: string | null
                    agent_context: Json | null
                    is_plan_locked: boolean | null
                    locked_blueprint: Json | null
                    budget_range: string | null
                    budget_target: number | null
                    last_active_at: string | null
                    created_at: string
                    selected_provider: 'openrouter' | 'groq' | 'aiml' | '' | null
                    selected_model: string | null
                    provider_metadata: Json | null
                    // Stage-gating fields
                    project_stage: 'planning' | 'design' | 'build' | 'fix'
                    stage_override: boolean
                    auto_orchestration: boolean
                    stage_history: Json
                }
                Insert: {
                    id?: string
                    chat_id: string
                    current_agent?: string | null
                    agent_context?: Json | null
                    is_plan_locked?: boolean | null
                    locked_blueprint?: Json | null
                    budget_range?: string | null
                    budget_target?: number | null
                    last_active_at?: string | null
                    created_at?: string
                    selected_provider?: 'openrouter' | 'groq' | 'aiml' | '' | null
                    selected_model?: string | null
                    provider_metadata?: Json | null
                    // Stage-gating fields
                    project_stage?: 'planning' | 'design' | 'build' | 'fix'
                    stage_override?: boolean
                    auto_orchestration?: boolean
                    stage_history?: Json
                }
                Update: {
                    id?: string
                    chat_id?: string
                    current_agent?: string | null
                    agent_context?: Json | null
                    is_plan_locked?: boolean | null
                    locked_blueprint?: Json | null
                    budget_range?: string | null
                    budget_target?: number | null
                    last_active_at?: string | null
                    created_at?: string
                    selected_provider?: 'openrouter' | 'groq' | 'aiml' | '' | null
                    selected_model?: string | null
                    provider_metadata?: Json | null
                    // Stage-gating fields
                    project_stage?: 'planning' | 'design' | 'build' | 'fix'
                    stage_override?: boolean
                    auto_orchestration?: boolean
                    stage_history?: Json
                }
                Relationships: []
            }
            messages: {
                Row: {
                    id: string
                    chat_id: string
                    sequence_number: number
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    agent_name: string | null
                    agent_model: string | null
                    intent: string | null
                    input_tokens: number | null
                    output_tokens: number | null
                    created_artifact_ids: string[] | null
                    metadata: Json
                    content_search: unknown | null // TSVECTOR
                    created_at: string
                }
                Insert: {
                    id?: string
                    chat_id: string
                    sequence_number: number
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    agent_name?: string | null
                    agent_model?: string | null
                    intent?: string | null
                    input_tokens?: number | null
                    output_tokens?: number | null
                    created_artifact_ids?: string[] | null
                    metadata?: Json
                    content_search?: unknown | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    chat_id?: string
                    sequence_number?: number
                    role?: 'user' | 'assistant' | 'system'
                    content?: string
                    agent_name?: string | null
                    agent_model?: string | null
                    intent?: string | null
                    input_tokens?: number | null
                    output_tokens?: number | null
                    created_artifact_ids?: string[] | null
                    metadata?: Json
                    content_search?: unknown | null
                    created_at?: string
                }
                Relationships: []
            }
            agent_executions: {
                Row: {
                    id: string
                    chat_id: string
                    message_id: string | null
                    user_id: string | null
                    agent_name: string
                    agent_model: string
                    status: 'running' | 'completed' | 'failed' | 'timeout' | null
                    started_at: string | null
                    completed_at: string | null
                    duration_ms: number | null
                    input_tokens: number | null
                    output_tokens: number | null
                    cost_usd: number | null
                    error_message: string | null
                    input_payload: Json | null
                    output_payload: Json | null
                }
                Insert: {
                    id?: string
                    chat_id: string
                    message_id?: string | null
                    user_id?: string | null
                    agent_name: string
                    agent_model: string
                    status?: 'running' | 'completed' | 'failed' | 'timeout' | null
                    started_at?: string | null
                    completed_at?: string | null
                    duration_ms?: number | null
                    input_tokens?: number | null
                    output_tokens?: number | null
                    cost_usd?: number | null
                    error_message?: string | null
                    input_payload?: Json | null
                    output_payload?: Json | null
                }
                Update: {
                    id?: string
                    chat_id?: string
                    message_id?: string | null
                    user_id?: string | null
                    agent_name?: string
                    agent_model?: string
                    status?: 'running' | 'completed' | 'failed' | 'timeout' | null
                    started_at?: string | null
                    completed_at?: string | null
                    duration_ms?: number | null
                    input_tokens?: number | null
                    output_tokens?: number | null
                    cost_usd?: number | null
                    error_message?: string | null
                    input_payload?: Json | null
                    output_payload?: Json | null
                }
                Relationships: []
            }
            artifacts: {
                Row: {
                    id: string
                    chat_id: string | null
                    project_id: string | null
                    type: 'context' | 'mvp' | 'prd' | 'bom' | 'code' | 'wiring' | 'circuit' | 'budget' | 'conversation_summary' | 'enclosure'
                    title: string
                    current_version: number | null
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    chat_id?: string | null
                    project_id?: string | null
                    type: 'context' | 'mvp' | 'prd' | 'bom' | 'code' | 'wiring' | 'circuit' | 'budget' | 'conversation_summary' | 'enclosure'
                    title: string
                    current_version?: number | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    chat_id?: string | null
                    project_id?: string | null
                    type?: 'context' | 'mvp' | 'prd' | 'bom' | 'code' | 'wiring' | 'circuit' | 'budget' | 'conversation_summary' | 'enclosure'
                    title?: string
                    current_version?: number | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            artifact_versions: {
                Row: {
                    id: string
                    artifact_id: string
                    version_number: number
                    content: string | null
                    content_json: Json | null
                    filename: string | null
                    language: string | null
                    file_path: string | null
                    diagram_svg: string | null
                    diagram_metadata: Json | null
                    fritzing_url: string | null
                    diagram_status: string | null
                    generation_attempts: number | null
                    error_message: string | null
                    change_summary: string | null
                    parent_version_id: string | null
                    created_by_message_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    artifact_id: string
                    version_number: number
                    content?: string | null
                    content_json?: Json | null
                    filename?: string | null
                    language?: string | null
                    file_path?: string | null
                    diagram_svg?: string | null
                    diagram_metadata?: Json | null
                    fritzing_url?: string | null
                    diagram_status?: string | null
                    generation_attempts?: number | null
                    error_message?: string | null
                    change_summary?: string | null
                    parent_version_id?: string | null
                    created_by_message_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    artifact_id?: string
                    version_number?: number
                    content?: string | null
                    content_json?: Json | null
                    filename?: string | null
                    language?: string | null
                    file_path?: string | null
                    diagram_svg?: string | null
                    diagram_metadata?: Json | null
                    fritzing_url?: string | null
                    diagram_status?: string | null
                    generation_attempts?: number | null
                    error_message?: string | null
                    change_summary?: string | null
                    parent_version_id?: string | null
                    created_by_message_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            diagram_queue: {
                Row: {
                    id: string
                    circuit_json: Json
                    artifact_id: string
                    chat_id: string
                    status: string | null
                    created_at: string
                    processed_at: string | null
                    error_message: string | null
                }
                Insert: {
                    id?: string
                    circuit_json: Json
                    artifact_id: string
                    chat_id: string
                    status?: string | null
                    created_at?: string
                    processed_at?: string | null
                    error_message?: string | null
                }
                Update: {
                    id?: string
                    circuit_json?: Json
                    artifact_id?: string
                    chat_id?: string
                    status?: string | null
                    created_at?: string
                    processed_at?: string | null
                    error_message?: string | null
                }
                Relationships: []
            }
            diagram_cache: {
                Row: {
                    id: string
                    circuit_hash: string
                    fritzing_url: string
                    created_at: string
                    access_count: number | null
                    last_accessed_at: string | null
                }
                Insert: {
                    id?: string
                    circuit_hash: string
                    fritzing_url: string
                    created_at?: string
                    access_count?: number | null
                    last_accessed_at?: string | null
                }
                Update: {
                    id?: string
                    circuit_hash?: string
                    fritzing_url?: string
                    created_at?: string
                    access_count?: number | null
                    last_accessed_at?: string | null
                }
                Relationships: []
            }
            parts: {
                Row: {
                    id: string
                    project_id: string
                    template_id: string | null
                    artifact_id: string | null
                    name: string
                    part_number: string | null
                    category: string | null
                    subcategory: string | null
                    quantity: number | null
                    price: number | null
                    supplier: string | null
                    supplier_url: string | null
                    lead_time_days: number | null
                    position: Json | null
                    usage_notes: string[] | null
                    specs: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    template_id?: string | null
                    artifact_id?: string | null
                    name: string
                    part_number?: string | null
                    category?: string | null
                    subcategory?: string | null
                    quantity?: number | null
                    price?: number | null
                    supplier?: string | null
                    supplier_url?: string | null
                    lead_time_days?: number | null
                    position?: Json | null
                    usage_notes?: string[] | null
                    specs?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    template_id?: string | null
                    artifact_id?: string | null
                    name?: string
                    part_number?: string | null
                    category?: string | null
                    subcategory?: string | null
                    quantity?: number | null
                    price?: number | null
                    supplier?: string | null
                    supplier_url?: string | null
                    lead_time_days?: number | null
                    position?: Json | null
                    usage_notes?: string[] | null
                    specs?: Json | null
                    created_at?: string
                }
                Relationships: []
            }
            connections: {
                Row: {
                    id: string
                    project_id: string
                    artifact_id: string | null
                    from_part_id: string
                    from_pin: string
                    to_part_id: string
                    to_pin: string
                    wire_color: string | null
                    wire_gauge: string | null
                    sequence_number: number | null
                    validation_result: Json | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    artifact_id?: string | null
                    from_part_id: string
                    from_pin: string
                    to_part_id: string
                    to_pin: string
                    wire_color?: string | null
                    wire_gauge?: string | null
                    sequence_number?: number | null
                    validation_result?: Json | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    artifact_id?: string | null
                    from_part_id?: string
                    from_pin?: string
                    to_part_id?: string
                    to_pin?: string
                    wire_color?: string | null
                    wire_gauge?: string | null
                    sequence_number?: number | null
                    validation_result?: Json | null
                    notes?: string | null
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
