# Requirements Document: OHM Hardware Orchestrator

## Introduction

OHM (Hardware Orchestrator) is an AI-powered IoT/Hardware Development IDE that bridges the gap between software and silicon. The system uses a multi-agent AI architecture to guide users from vague project ideas to working hardware prototypes through an intelligent, conversational interface.

## Glossary

- **System**: The OHM Hardware Orchestrator platform
- **Agent**: A specialized AI component with a specific role (e.g., BOM Generator, Code Generator)
- **Orchestrator**: The routing agent that determines which specialist agent handles each user request
- **Artifact**: A generated project document (BOM, code, wiring diagram, etc.)
- **Chat_Session**: A persistent conversation between user and agents
- **Tool_Call**: An agent's invocation of a system function to update artifacts
- **Drawer**: A UI panel that displays specific artifact types
- **Amazon_Bedrock**: AWS's fully managed foundation model service providing Claude and other models
- **DynamoDB**: AWS's NoSQL database service providing scalable data storage
- **AppSync**: AWS's managed GraphQL service for real-time subscriptions

## Requirements

### Requirement 1: Project Initialization

**User Story:** As a maker, I want to describe my hardware idea in natural language, so that the system can understand my goals and guide me through the development process.

#### Acceptance Criteria

1. WHEN a user creates a new project, THE System SHALL route the first message to the Project Initializer agent
2. WHEN the Project Initializer receives a project description, THE System SHALL generate a concise project title (3-6 words)
3. WHEN the Project Initializer gathers requirements, THE System SHALL ask 2-3 critical questions maximum (goal, deployment environment, budget)
4. WHEN sufficient information is gathered, THE System SHALL create Context, MVP, and PRD artifacts
5. WHEN artifacts are created, THE System SHALL call open_context_drawer() followed by update_context(), update_mvp(), and update_prd() tools

### Requirement 2: Multi-Agent Orchestration

**User Story:** As a user, I want my requests to be handled by the most appropriate specialist agent, so that I receive expert guidance for each aspect of my project.

#### Acceptance Criteria

1. WHEN a user sends a message (after initialization), THE Orchestrator SHALL classify the intent within 100ms
2. WHEN intent is classified, THE System SHALL route to the appropriate agent (BOM, Code, Wiring, Circuit Verify, Datasheet, Budget, or Conversational)
3. WHEN an agent is selected, THE System SHALL notify the client immediately via agent_selected event
4. WHEN routing fails, THE System SHALL default to the Conversational agent
5. WHEN a user manually selects an agent, THE System SHALL honor the forced agent selection

### Requirement 3: Bill of Materials Generation

**User Story:** As a hardware developer, I want an automatically generated BOM with validated components, so that I can order the correct parts without voltage mismatches or compatibility issues.

#### Acceptance Criteria

1. WHEN the BOM Generator receives a project description, THE System SHALL select components with exact part numbers from real distributors (DigiKey, Mouser, SparkFun)
2. WHEN components are selected, THE System SHALL verify voltage compatibility (3.3V vs 5V logic levels)
3. WHEN the BOM is generated, THE System SHALL calculate total current consumption and recommend appropriate power supply
4. WHEN the BOM is complete, THE System SHALL call open_bom_drawer() followed by update_bom() with component data
5. WHEN voltage mismatches are detected, THE System SHALL include warnings in the BOM artifact

### Requirement 4: Code Generation

**User Story:** As a developer, I want production-quality firmware code with proper error handling, so that my hardware runs reliably without crashes.

#### Acceptance Criteria

1. WHEN the Code Generator receives a request, THE System SHALL generate multiple files (main.cpp, config.h, platformio.ini)
2. WHEN generating code, THE System SHALL use non-blocking patterns (millis() instead of delay())
3. WHEN generating code, THE System SHALL include error handling for sensor failures and I2C timeouts
4. WHEN code is generated, THE System SHALL call open_code_drawer() followed by add_code_file() for each file
5. WHEN code references hardware pins, THE System SHALL use exact GPIO numbers from the BOM

### Requirement 5: Wiring Instructions

**User Story:** As a maker, I want step-by-step wiring instructions with safety warnings, so that I can assemble my circuit without damaging components.

#### Acceptance Criteria

1. WHEN the Wiring Specialist generates instructions, THE System SHALL specify exact pin-to-pin connections
2. WHEN connections are defined, THE System SHALL mandate RED wires for VCC and BLACK wires for GND
3. WHEN voltage level shifters are needed, THE System SHALL include them in the connection list
4. WHEN wiring is generated, THE System SHALL call open_wiring_drawer() followed by update_wiring()
5. WHEN polarity-sensitive components are present, THE System SHALL include explicit polarity warnings

### Requirement 6: Real-Time Streaming

**User Story:** As a user, I want to see AI responses as they are generated, so that I know the system is working and can read responses faster.

#### Acceptance Criteria

1. WHEN an agent generates a response, THE System SHALL stream text chunks to the client via Server-Sent Events
2. WHEN streaming begins, THE System SHALL send agent_selected event before any text chunks
3. WHEN tool calls are made, THE System SHALL send tool_call events immediately when tools are invoked
4. WHEN streaming completes, THE System SHALL send a metadata event with final agent info and tool calls
5. WHEN streaming errors occur, THE System SHALL send an error event and close the stream gracefully

### Requirement 7: Database Persistence

**User Story:** As a user, I want my conversations and artifacts to be saved automatically, so that I can return to my projects later without losing work.

#### Acceptance Criteria

1. WHEN a user sends a message, THE System SHALL persist it to the DynamoDB messages table with a sequence number
2. WHEN an agent responds, THE System SHALL persist the response with agent_id and intent metadata
3. WHEN artifacts are created, THE System SHALL store them in the DynamoDB artifacts table with versioning
4. WHEN artifact versions are created, THE System SHALL link them to the creating message via created_by_message_id
5. WHEN a chat session is updated, THE System SHALL record the current_agent and last_active_at timestamp

### Requirement 8: Conversation Summarization

**User Story:** As a system, I want to maintain concise conversation summaries, so that agents have relevant context without processing thousands of tokens.

#### Acceptance Criteria

1. WHEN a conversation reaches 5 new messages, THE Conversation Summarizer SHALL generate an incremental summary
2. WHEN summarizing, THE System SHALL capture project goal, constraints, decisions, and current artifacts
3. WHEN a summary is created, THE System SHALL store it as a conversation_summary artifact
4. WHEN subsequent summaries are generated, THE System SHALL merge new information with previous summaries
5. WHEN agents need context, THE System SHALL inject the latest summary into their system prompt

### Requirement 9: API Key Management

**User Story:** As a system administrator, I want automatic API key rotation when quota limits are hit, so that the service remains available without manual intervention.

#### Acceptance Criteria

1. WHEN a Bedrock API call fails with a throttling error (ThrottlingException), THE System SHALL implement exponential backoff retry
2. WHEN throttling occurs, THE System SHALL wait with increasing delays (1s, 2s, 4s, 8s) before retrying
3. WHEN throttling is detected, THE System SHALL notify the client via throttling_retry event
4. WHEN maximum retries are exceeded, THE System SHALL return a clear error message with retry instructions
5. WHEN a request succeeds after throttling, THE System SHALL record the success for health tracking

### Requirement 10: Tool Execution System

**User Story:** As an agent, I want to update project artifacts through tool calls, so that changes are persisted and reflected in the UI immediately.

#### Acceptance Criteria

1. WHEN an agent calls a tool, THE Tool Executor SHALL parse the tool name and arguments
2. WHEN a drawer-opening tool is called (open_context_drawer, open_bom_drawer, etc.), THE System SHALL send a drawer_open event to the client
3. WHEN a content-update tool is called (update_context, update_bom, add_code_file, etc.), THE System SHALL persist the artifact to the database
4. WHEN artifacts are updated, THE System SHALL create a new artifact_version with incremented version_number
5. WHEN tool execution fails, THE System SHALL log the error but continue agent execution

### Requirement 11: Real-Time Subscriptions

**User Story:** As a user, I want to see updates from other devices or sessions in real-time, so that I can collaborate or continue work across devices.

#### Acceptance Criteria

1. WHEN a client connects to a chat, THE System SHALL subscribe to AppSync real-time changes for that chat_id
2. WHEN a new message is inserted, THE System SHALL push the message to all subscribed clients via AppSync
3. WHEN an artifact is updated, THE System SHALL notify subscribed clients of the change via DynamoDB Streams
4. WHEN a subscription is established, THE System SHALL use the format `chat:{chatId}` for the subscription filter
5. WHEN a client disconnects, THE System SHALL automatically unsubscribe from the AppSync subscription

### Requirement 12: Circuit Verification

**User Story:** As a maker, I want to upload a photo of my breadboard circuit and get verification feedback, so that I can catch wiring mistakes before powering on.

#### Acceptance Criteria

1. WHEN a user uploads a circuit image, THE System SHALL route to the Circuit Verifier agent
2. WHEN the Circuit Verifier analyzes an image, THE System SHALL use Amazon Bedrock Claude with vision capabilities
3. WHEN analyzing, THE System SHALL check power rail polarity, component orientation, and GPIO connections
4. WHEN issues are found, THE System SHALL return a JSON response with criticalIssues, suggestions, and confidence level
5. WHEN the image is unclear, THE System SHALL request a better photo rather than guessing

### Requirement 13: Budget Optimization

**User Story:** As a cost-conscious maker, I want alternative component recommendations, so that I can reduce project cost without sacrificing quality.

#### Acceptance Criteria

1. WHEN the Budget Optimizer receives a BOM, THE System SHALL analyze each component for cost-saving opportunities
2. WHEN alternatives are found, THE System SHALL provide tradeoff analysis (LOW, MEDIUM, HIGH risk)
3. WHEN recommending alternatives, THE System SHALL explain what's different and why it's acceptable
4. WHEN budget optimization is complete, THE System SHALL call open_budget_drawer() followed by update_budget()
5. WHEN quality-critical components are identified, THE System SHALL warn against cheaper alternatives

### Requirement 14: Datasheet Analysis

**User Story:** As a developer, I want AI-extracted datasheet information, so that I don't have to read 200-page PDFs to find critical specifications.

#### Acceptance Criteria

1. WHEN a user provides a datasheet, THE Datasheet Analyzer SHALL extract absolute maximum ratings
2. WHEN analyzing, THE System SHALL extract electrical specs (voltage, current, logic levels)
3. WHEN interface details are found, THE System SHALL extract protocol type, default address, and pull-up requirements
4. WHEN critical notes are present, THE System SHALL flag voltage tolerance and required decoupling capacitors
5. WHEN analysis is complete, THE System SHALL return structured JSON with component specifications

### Requirement 15: Agent Context Injection

**User Story:** As an agent, I want access to previous conversation context, so that I can provide relevant responses without repeating questions.

#### Acceptance Criteria

1. WHEN an agent is invoked with a chatId, THE Context Builder SHALL retrieve the latest conversation summary
2. WHEN a summary exists, THE System SHALL inject it into the agent's system prompt
3. WHEN no summary exists, THE System SHALL proceed without context injection
4. WHEN context injection fails, THE System SHALL log the error but continue agent execution
5. WHEN context is injected, THE System SHALL log the context length for debugging

### Requirement 16: Drawer UI System

**User Story:** As a user, I want project artifacts displayed in organized drawers, so that I can easily access BOMs, code, and wiring diagrams.

#### Acceptance Criteria

1. WHEN a drawer-opening tool is called, THE System SHALL display the corresponding drawer (Context, BOM, Code, Wiring, Budget)
2. WHEN a drawer is opened, THE System SHALL slide in from the right side of the screen
3. WHEN multiple drawers are available, THE System SHALL show a Tools Sidebar with icons for each artifact type
4. WHEN a drawer is closed, THE System SHALL slide out and return to the sidebar view
5. WHEN artifacts are updated, THE System SHALL refresh the drawer content automatically

### Requirement 17: Error Handling and Failover

**User Story:** As a system, I want graceful error handling and automatic failover, so that temporary failures don't break the user experience.

#### Acceptance Criteria

1. WHEN an API call fails with a non-quota error, THE System SHALL log the error and return it to the client
2. WHEN database operations fail, THE System SHALL retry once before returning an error
3. WHEN artifact parsing fails, THE System SHALL log the error but continue displaying other artifacts
4. WHEN streaming is interrupted, THE System SHALL close the stream gracefully with an error event
5. WHEN agent execution times out, THE System SHALL return a timeout error after 60 seconds

### Requirement 18: Agent Identity System

**User Story:** As a user, I want to see which agent is responding, so that I understand the expertise behind each answer.

#### Acceptance Criteria

1. WHEN an agent responds, THE System SHALL include agent_id in the message metadata
2. WHEN displaying messages, THE UI SHALL show the agent's name and icon
3. WHEN the Orchestrator routes a request, THE System SHALL send agent_selected event with agent type, name, icon, and intent
4. WHEN an agent is manually selected, THE UI SHALL display a visual indicator of the forced agent
5. WHEN agent identity is missing, THE System SHALL default to showing "Assistant" with a generic icon

### Requirement 19: File I/O Tools

**User Story:** As an agent, I want to read existing artifacts before making changes, so that I can preserve user edits and avoid overwriting data.

#### Acceptance Criteria

1. WHEN an agent calls read_file, THE System SHALL retrieve the latest version of the specified artifact
2. WHEN reading code artifacts, THE System SHALL support file_path parameter to read specific files
3. WHEN an agent calls write_file, THE System SHALL support merge strategies (replace, append, merge)
4. WHEN writing artifacts, THE System SHALL create a new version rather than overwriting
5. WHEN artifacts don't exist, THE System SHALL return null for read_file and create new for write_file

### Requirement 20: Performance and Scalability

**User Story:** As a system, I want to handle multiple concurrent users efficiently, so that the platform scales without degradation.

#### Acceptance Criteria

1. WHEN the Orchestrator classifies intent, THE System SHALL complete within 100ms
2. WHEN streaming responses, THE System SHALL send the first chunk within 500ms
3. WHEN multiple users are active, THE System SHALL maintain separate chat sessions without interference
4. WHEN database queries are made, THE System SHALL use indexed columns (chat_id, sequence_number, artifact_id)
5. WHEN API keys are rotated, THE System SHALL complete rotation within 200ms

## Non-Functional Requirements

### Reliability
- System uptime: 99.5% availability
- Automatic failover for API quota exhaustion
- Graceful degradation when services are unavailable
- Data persistence for all user interactions

### Performance
- Intent classification: <100ms
- First response chunk: <500ms
- Database queries: <50ms average
- Real-time message delivery: <100ms latency

### Security
- Row-Level Security (RLS) on all Supabase tables
- API keys stored in environment variables only
- User authentication via Supabase Auth
- No PII in logs or error messages

### Usability
- Conversational interface requiring no technical knowledge
- Visual feedback for all agent actions
- Clear error messages with actionable guidance
- Mobile-responsive UI for all screen sizes

### Maintainability
- Modular agent architecture for easy updates
- Comprehensive logging for debugging
- Version control for all artifacts
- Database migrations for schema changes

## AWS Migration Requirements

### Migration Readiness
- Architecture designed for cloud-native deployment
- Modular components ready for AWS service integration
- Database schema adaptable to DynamoDB with minimal changes
- API layer compatible with AWS Lambda functions
- Real-time system ready for AppSync integration

### AWS Service Mapping
- **AI Service**: Amazon Bedrock (Claude 3.5 Sonnet, Claude 3 Opus)
- **Database**: Amazon DynamoDB with Global Secondary Indexes
- **Real-time**: AWS AppSync with DynamoDB Streams
- **Storage**: Amazon S3 with presigned URLs
- **Hosting**: AWS Amplify with CI/CD
- **Authentication**: Amazon Cognito User Pools
- **Monitoring**: Amazon CloudWatch + X-Ray
- **Functions**: AWS Lambda for serverless API endpoints

### AWS Architecture Benefits
- **Scalability**: Better handling of enterprise-scale workloads
- **Integration**: Native AWS service integration
- **Compliance**: Enhanced security and compliance features
- **Cost Optimization**: Potential cost savings at scale
- **Monitoring**: Comprehensive CloudWatch integration
- **Global Scale**: Multi-region deployment capabilities
