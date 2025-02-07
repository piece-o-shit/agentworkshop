import { OpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MistralAI } from "@langchain/mistralai";
import { Tool, StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate
} from "@langchain/core/prompts";
import { 
  RunnableSequence,
  RunnablePassthrough 
} from "@langchain/core/runnables";
import { 
  AgentExecutor as LangChainAgentExecutor,
  createReactAgent,
  createStructuredChatAgent,
} from "langchain/agents";
import { 
  AgentType,
  ModelProvider, 
  EnhancedAgentConfig, 
  AgentExecutorResult,
  createAgentMemory 
} from "./agent-types";
import { ChatHistoryManager } from "./chat-history";

// Initialize model with configuration based on provider
export function createModel(config: EnhancedAgentConfig) {
  const modelConfig = config.model_config || {};
  const provider = config.provider || ModelProvider.OPENAI;

  switch (provider) {
    case ModelProvider.OPENAI:
      return new OpenAI({
        temperature: modelConfig.temperature ?? 0.7,
        maxTokens: modelConfig.maxTokens,
        modelName: modelConfig.model || "gpt-4",
        streaming: true,
      });

    case ModelProvider.ANTHROPIC:
      return new ChatAnthropic({
        temperature: modelConfig.anthropicOptions?.temperature ?? 0.7,
        maxTokens: modelConfig.anthropicOptions?.maxTokens,
        modelName: modelConfig.model || "claude-3-opus-20240229",
        streaming: true,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });

    case ModelProvider.GOOGLE:
      return new ChatGoogleGenerativeAI({
        temperature: modelConfig.googleOptions?.temperature ?? 0.7,
        maxOutputTokens: modelConfig.googleOptions?.maxOutputTokens,
        modelName: modelConfig.model || "gemini-pro",
        apiKey: process.env.GOOGLE_API_KEY,
      });

    case ModelProvider.MISTRAL:
      return new MistralAI({
        temperature: modelConfig.mistralOptions?.temperature ?? 0.7,
        maxTokens: modelConfig.mistralOptions?.maxTokens,
        model: modelConfig.model || "mistral-large-latest",
        apiKey: process.env.MISTRAL_API_KEY,
      });

    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}

interface ToolConfig {
  name: string;
  description: string;
  config?: {
    schema?: z.ZodObject<{
      input: z.ZodOptional<z.ZodString>;
    }, "strip">;
    returnDirect?: boolean;
    verbose?: boolean;
  };
  handler?: (input: Record<string, unknown>) => Promise<string>;
}

export function createToolFromConfig(toolConfig: ToolConfig): Tool {
  if (!toolConfig.name || !toolConfig.description) {
    throw new Error('Tool configuration must include name and description');
  }

  class CustomTool extends Tool {
    name = toolConfig.name;
    description = toolConfig.description;
    schema = z.object({
      input: z.string().optional(),
    }).transform((obj) => obj.input || "");
    returnDirect = toolConfig.config?.returnDirect ?? false;
    verbose = toolConfig.config?.verbose ?? false;

    get lc_namespace() {
      return ['custom'];
    }

    protected async _call(input: Record<string, unknown>): Promise<string> {
      try {
        if (toolConfig.handler && typeof toolConfig.handler === 'function') {
          return await toolConfig.handler(input);
        }
        throw new Error('No tool handler implemented');
      } catch (error) {
        console.error(`Error executing tool ${this.name}:`, error);
        throw error;
      }
    }
  }

  return new CustomTool();
}

// Create an agent based on type
export async function createAgentByType(
  config: EnhancedAgentConfig,
  tools: Tool[]
): Promise<LangChainAgentExecutor> {
  const model = createModel(config);
  const memory = createAgentMemory(config.memory, config.model_config?.model, config.provider);
  const chatHistory = new ChatHistoryManager(config.memory?.maxSize);

  const basePrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      config.system_prompt || "You are a helpful AI assistant."
    ),
    new MessagesPlaceholder("chat_history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  let agent;
  switch (config.type) {
    case AgentType.REACT:
      agent = await createReactAgent({
        llm: model,
        tools,
        prompt: basePrompt,
      });
      break;
    case AgentType.STRUCTURED_CHAT:
      agent = await createStructuredChatAgent({
        llm: model,
        tools,
        prompt: basePrompt,
      });
      break;
    case AgentType.PLAN_AND_EXECUTE:
      throw new Error('Plan and Execute agent type not yet implemented');
    default:
      throw new Error(`Unsupported agent type: ${config.type}`);
  }

  return new LangChainAgentExecutor({
    agent,
    tools,
    memory,
    maxIterations: config.maxIterations || 3,
    returnIntermediateSteps: config.returnIntermediateSteps || false,
    earlyStoppingMethod: config.earlyStoppingMethod || "force",
    handleParsingErrors: config.errorHandling?.handleParsingErrors || true,
  });
}

// Create a runnable chain for the agent with proper memory management
export function createAgentChain(
  executor: LangChainAgentExecutor,
  chatHistory: ChatHistoryManager
) {
  return RunnableSequence.from([
    {
      input: new RunnablePassthrough(),
      chat_history: async () => chatHistory.getFormattedHistory(),
      agent_scratchpad: () => [],
    },
    executor,
  ]);
}

// Execute agent with error handling and retries
export async function executeAgent(
  config: EnhancedAgentConfig,
  tools: Tool[],
  input: string
): Promise<AgentExecutorResult> {
  const maxRetries = config.errorHandling?.maxRetries || 2;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const executor = await createAgentByType(config, tools);
      const chatHistory = new ChatHistoryManager(config.memory?.maxSize);
      const chain = createAgentChain(executor, chatHistory);

      const result = await chain.invoke({
        input,
      });

      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps,
      };
    } catch (error) {
      retryCount++;
      if (retryCount > maxRetries) {
        return {
          output: config.errorHandling?.fallbackResponses?.error || 
                 "I encountered an error and was unable to complete the task.",
          errorDetails: {
            message: error.message,
            type: error.name,
            retryCount,
          },
        };
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }

  throw new Error('Unexpected error in executeAgent');
}
