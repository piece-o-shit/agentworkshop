import { Tool } from "@langchain/core/tools";
import { BaseMessage } from "@langchain/core/messages";
import { 
  BufferMemory, 
  ConversationTokenBufferMemory 
} from "langchain/memory";
import { OpenAI } from "@langchain/openai";

export enum AgentType {
  REACT = 'react',
  STRUCTURED_CHAT = 'structured_chat',
  PLAN_AND_EXECUTE = 'plan_and_execute'
}

export interface AgentConfig {
  name: string;
  description?: string;
  model_config: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
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

export function createAgentMemory(config?: AgentMemoryConfig, modelName: string = "gpt-3.5-turbo") {
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
      const llm = new OpenAI({
        modelName: modelName,
        temperature: 0,
      });
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
