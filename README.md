# AgentFlow - AI-Powered Workflow Automation

AgentFlow is a modern web application that combines the power of LangChain.js and LangGraph.js to create an intelligent workflow automation system with advanced document processing capabilities.

## Features

### 🤖 Agent System
- **Multiple Agent Types**
  - ReAct agents for reasoning and action
  - Structured Chat agents for natural language interaction
  - Extensible agent architecture for custom implementations
- **Advanced Memory Management**
  - Conversation history tracking
  - Token-based memory windows
  - Configurable memory strategies
- **Tool Integration**
  - Custom tool creation interface
  - Dynamic tool loading
  - Parameter validation and type safety
- **Error Handling**
  - Automatic retries with exponential backoff
  - Graceful error recovery
  - Detailed error reporting

### 📚 Vector Store Integration
- **Document Management**
  - Efficient document storage using Supabase and pgvector
  - Document embeddings using OpenAI's text-embedding-3-small
  - Automatic metadata handling
- **Intelligent Search**
  - Similarity search with configurable parameters
  - Natural language query parsing
  - Contextual result ranking
- **Document Analysis**
  - Automatic content summarization
  - Topic extraction and classification
  - Sentiment analysis
  - Key points identification
  - Named entity recognition

### 🔄 Workflow System
- **Visual Workflow Builder**
  - Drag-and-drop interface
  - Step configuration
  - Conditional branching
- **State Management**
  - Persistent workflow state
  - Progress tracking
  - Error state handling
- **Execution Engine**
  - Sequential and parallel execution
  - State graph management
  - Event system for monitoring
- **Workflow Scheduling**
  - Cron-based scheduling
  - Error handling with automatic retries
  - Execution logging and monitoring
  - Status tracking and notifications

## Technical Stack

- **Frontend Framework**
  - React 18.3
  - TypeScript 5.5
  - Vite 5.4

- **State Management & Data Fetching**
  - TanStack Query (React Query) 5
  - React Hook Form
  - Zod for validation

- **UI Components**
  - Shadcn/UI
  - Tailwind CSS
  - Radix UI primitives
  - Lucide icons

- **AI/ML Integration**
  - LangChain.js 0.3
  - LangGraph.js 0.2
  - OpenAI GPT-4 integration

- **Backend & Database**
  - Supabase
  - PostgreSQL with pgvector
  - Vector embeddings storage

## Getting Started

### Prerequisites

1. Node.js 18+ and npm/bun
2. Supabase account
3. OpenAI API key
4. PostgreSQL database with pgvector extension

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Database Setup

1. Create a new Supabase project
2. Enable the pgvector extension
3. Run the migrations in order:
   ```bash
   cd supabase
   supabase migration up 20240207_create_vector_store
   supabase migration up 20240207_create_scheduled_workflows
   supabase migration up 20240207_create_workflow_logs
   supabase migration up 20240207_create_error_count_function
   ```

## Usage Examples

### Creating a Document Search Tool

```typescript
import { useVectorStore } from '@/hooks/use-vector-store';

function DocumentSearch() {
  const { addDocuments, search, searchResults } = useVectorStore();

  // Add a document with analysis
  await addDocuments({
    texts: ['Your document text'],
    metadata: [{ source: 'user-input' }],
    analyze: true
  });

  // Search with analysis
  const results = await search('your query', {
    k: 4,
    analyze: true,
    formatResults: true
  });
}
```

### Creating a Custom Agent Tool

```typescript
import { createToolFromConfig } from '@/lib/langchain/config';

const customTool = createToolFromConfig({
  name: 'custom_tool',
  description: 'A custom tool implementation',
  config: {
    schema: z.object({
      input: z.string()
    }),
    returnDirect: false
  },
  handler: async (input) => {
    // Tool implementation
    return 'Tool result';
  }
});
```

### Building a Workflow

```typescript
import { createWorkflowGraph } from '@/lib/langchain/workflow-graph';

const workflow = createWorkflowGraph({
  tools: [customTool],
  workflow: {
    steps: [
      {
        name: 'Process Data',
        action: 'process',
        parameters: { /* ... */ }
      }
    ]
  }
});

const result = await executeWorkflow(workflow);
```

### Scheduling a Workflow

```typescript
import { useScheduler } from '@/hooks/use-scheduler';

function ScheduleWorkflow({ workflowId }) {
  const { createSchedule } = useScheduler();

  // Create a schedule
  await createSchedule({
    workflow_id: workflowId,
    name: 'Daily Processing',
    schedule: '0 0 * * *', // Run daily at midnight
    config: {
      max_retries: 3,
      timeout: 300,
      notifications: true
    }
  });
}
```

## Architecture

### Component Structure

```
src/
├── components/         # UI components
├── hooks/             # Custom React hooks
├── lib/
│   ├── langchain/     # LangChain integration
│   └── workers/       # Background workers
├── integrations/      # External service integrations
├── pages/            # Route components
└── types/            # TypeScript type definitions
```

### Data Flow

1. User Interface Layer
   - React components
   - Form handling
   - State management

2. Business Logic Layer
   - Custom hooks
   - LangChain agents
   - Workflow execution
   - Background scheduling

3. Data Access Layer
   - Vector store operations
   - Supabase integration
   - Document processing
   - Execution logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [LangChain.js](https://js.langchain.com/docs/)
- [LangGraph.js](https://github.com/langchain-ai/langgraphjs)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
