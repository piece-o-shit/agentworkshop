import { Tool } from "@langchain/core/tools";
import { BaseMessage } from "@langchain/core/messages";
import { 
  BufferMemory, 
  ConversationTokenBufferMemory 
} from "langchain/memory";
import { OpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MistralAI } from "@langchain/mistralai";

export enum AgentType {
  REACT = 'react',
  STRUCTURED_CHAT = 'structured_chat',
  PLAN_AND_EXECUTE = 'plan_and_execute'
}

export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  MISTRAL = 'mistral'
}

export interface AgentConfig {
  name: string;
  description?: string;
  provider: ModelProvider;
  model_config: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    // Provider-specific options
    anthropicOptions?: {
      maxTokens?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
    };
    googleOptions?: {
      maxOutputTokens?: number;
      temperature?: number;
      topK?: number;
      topP?: number;
    };
    mistralOptions?: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      safeMode?: boolean;
    };
  };
  system_prompt?: string;
}

export interface EnhancedAgentConfig extends AgentConfig {
  type: AgentType;
  maxIterations?: number;
  returnIntermediateSteps?: boolean;
  earlyStoppingMethod?: 'force' | 'generate';
  memory?: {
    type: 'buffer' | 'conversation_buffer_window';
    maxSize?: number;
    windowSize?: number;
  };
  errorHandling?: {
    maxRetries: number;
    handleParsingErrors: boolean;
    fallbackResponses?: Record<string, string>;
  };
}

export interface AgentMemoryConfig {
  type: 'buffer' | 'conversation_buffer_window';
  maxSize?: number;
  windowSize?: number;
}

export function createAgentMemory(config?: AgentMemoryConfig, modelName: string = "gpt-3.5-turbo", provider: ModelProvider = ModelProvider.OPENAI) {
  if (!config) {
    return new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
    });
  }

  switch (config.type) {
    case 'buffer':
      return new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
      });
    case 'conversation_buffer_window': {
      let llm;
      switch (provider) {
        case ModelProvider.ANTHROPIC:
          llm = new ChatAnthropic({
            modelName: modelName || "claude-3-opus-20240229",
            temperature: 0,
          });
          break;
        case ModelProvider.GOOGLE:
          llm = new ChatGoogleGenerativeAI({
            modelName: modelName || "gemini-pro",
            temperature: 0,
          });
          break;
        case ModelProvider.MISTRAL:
          llm = new MistralAI({
            model: modelName || "mistral-large-latest", // Changed from modelName to model
            temperature: 0,
          });
          break;
        default:
          llm = new OpenAI({
            modelName: modelName,
            temperature: 0,
          });
      }
      return new ConversationTokenBufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
        maxTokenLimit: config.windowSize ? config.windowSize * 200 : 1000, // Approximate tokens per message
        llm,
      });
    }
    default:
      return new BufferMemory({
        returnMessages: true,
        memoryKey: "chat_history",
      });
  }
}

export interface AgentStep {
  action: string;
  result: string;
  timestamp: Date;
}

export interface AgentExecutorResult {
  output: string;
  intermediateSteps?: AgentStep[];
  errorDetails?: {
    message: string;
    type: string;
    retryCount?: number;
  };
}

export interface AgentContext {
  messages: BaseMessage[];
  tools: Tool[];
  memory?: BufferMemory | ConversationTokenBufferMemory;
  previousSteps?: AgentStep[];
}
