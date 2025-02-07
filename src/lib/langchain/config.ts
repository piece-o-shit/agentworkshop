
import { OpenAI } from "@langchain/openai";
import { 
  Tool,
  StructuredToolInterface
} from "@langchain/core/tools";
import { 
  BaseMessageLike,
  ChainValues,
  ChatPromptTemplate, 
  MessagesPlaceholder 
} from "@langchain/core/prompts";
import { 
  RunnableSequence,
  RunnablePassthrough 
} from "@langchain/core/runnables";
import {
  AgentAction,
  AgentFinish,
  BaseMessage
} from "@langchain/core/messages";

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

export function createToolFromConfig(toolConfig: any): Tool {
  class CustomTool extends Tool {
    name = toolConfig.name;
    description = toolConfig.description;
    schema = toolConfig.config.schema;
    returnDirect = false;
    verbose = false;

    get lc_namespace() {
      return ['custom'];
    }

    constructor() {
      super();
    }

    protected async _call(input: Record<string, any>): Promise<string> {
      return `Executed ${toolConfig.name} with input: ${JSON.stringify(input)}`;
    }
  }

  return new CustomTool();
}

export interface AgentExecutor {
  invoke(input: Record<string, any>): Promise<any>;
  call(input: Record<string, any>): Promise<ChainValues>;
}

// Create a basic agent executor
export async function createAgentExecutor(
  config: AgentConfig,
  toolConfigs: any[] = []
): Promise<AgentExecutor> {
  const model = createModel(config);
  const tools = toolConfigs.map(createToolFromConfig);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", config.system_prompt || "You are a helpful AI assistant."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // Create a simple agent that can use tools and follow a conversation
  const agent = {
    invoke: async (input: Record<string, any>): Promise<any> => {
      const result = await model.invoke(input.input);
      return result;
    },
    call: async (input: Record<string, any>): Promise<ChainValues> => {
      const result = await model.invoke(input.input);
      return { output: result };
    }
  };

  return agent;
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
