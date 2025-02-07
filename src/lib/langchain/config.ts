
import { OpenAI } from "@langchain/openai";
import { StructuredTool } from "@langchain/core/tools";
import { 
  AgentExecutor, 
  createOpenAIToolsAgent 
} from "@langchain/openai"; // Updated import path
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
  model_config: any; // Match the database schema
  system_prompt?: string;
}

// Initialize OpenAI model with configuration 
export function createModel(config: AgentConfig) {
  const modelConfig = config.model_config || {};
  return new OpenAI({
    temperature: modelConfig.temperature ?? 0.7,
    maxTokens: modelConfig.maxTokens,
    modelName: modelConfig.model || "gpt-4o-mini",
  });
}

// Create a basic agent executor
export async function createAgentExecutor(
  config: AgentConfig,
  tools: StructuredTool[] = []
) {
  const model = createModel(config);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", config.system_prompt || "You are a helpful AI assistant."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIToolsAgent({
    llm: model,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
  });
}

// Create a runnable chain for the agent
export function createAgentChain(executor: AgentExecutor) {
  return RunnableSequence.from([
    {
      input: new RunnablePassthrough(),
      chat_history: () => [], // Can be extended to maintain chat history
      agent_scratchpad: () => [],
    },
    executor,
  ]);
}
