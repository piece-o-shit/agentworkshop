
import { OpenAI } from "@langchain/openai";
import { 
  StructuredToolInterface,
  BaseTool
} from "@langchain/core/tools";
import { 
  AgentExecutor as BaseAgentExecutor
} from "langchain/agents";
import { 
  createOpenAIFunctionsAgent 
} from "langchain/agents/openai";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder 
} from "@langchain/core/prompts";
import { 
  RunnableSequence,
  RunnablePassthrough 
} from "@langchain/core/runnables";

export interface AgentConfig {
  name: string;
  description?: string;
  model_config: any;
  system_prompt?: string;
}

// Initialize OpenAI model with configuration 
export function createModel(config: AgentConfig) {
  const modelConfig = config.model_config || {};
  return new OpenAI({
    temperature: modelConfig.temperature ?? 0.7,
    maxTokens: modelConfig.maxTokens,
    modelName: modelConfig.model || "gpt-4",
  });
}

export function createToolFromConfig(toolConfig: any): BaseTool {
  class CustomTool extends BaseTool {
    name = toolConfig.name;
    description = toolConfig.description;
    schema = toolConfig.config.schema;

    async _call(input: Record<string, any>) {
      return `Executed ${toolConfig.name} with input: ${JSON.stringify(input)}`;
    }
  }

  return new CustomTool();
}

// Create a basic agent executor
export async function createAgentExecutor(
  config: AgentConfig,
  toolConfigs: any[] = []
) {
  const model = createModel(config);
  const tools = toolConfigs.map(createToolFromConfig);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", config.system_prompt || "You are a helpful AI assistant."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    tools,
    prompt,
  });

  return new BaseAgentExecutor({
    agent,
    tools,
  });
}

// Create a runnable chain for the agent
export function createAgentChain(executor: BaseAgentExecutor) {
  return RunnableSequence.from([
    {
      input: new RunnablePassthrough(),
      chat_history: () => [], // Can be extended to maintain chat history
      agent_scratchpad: () => [],
    },
    executor,
  ]);
}
