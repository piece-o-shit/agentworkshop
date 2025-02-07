import { Json } from "@/integrations/supabase/types";
import { AgentType, ModelProvider, EnhancedAgentConfig } from "./agent-types";
import { z } from "zod";

// Type for agent data from database
export interface DatabaseAgent {
  id: string;
  name: string;
  description?: string;
  model_config: Json;
  system_prompt?: string;
  created_at: string;
  updated_at: string | null;
}

// Type for tool data from database
export interface DatabaseTool {
  id: string;
  name: string;
  description: string;
  type: string;
  config: Json;
  created_at: string;
  created_by: string;
}

// Convert database model config to typed model config
function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseModelConfig(config: Json): {
  temperature?: number;
  maxTokens?: number;
  model?: string;
} {
  if (!isJsonObject(config)) {
    return {};
  }

  const result: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  } = {};

  if (typeof config.temperature === 'number') {
    result.temperature = config.temperature;
  }
  if (typeof config.maxTokens === 'number') {
    result.maxTokens = config.maxTokens;
  }
  if (typeof config.model === 'string') {
    result.model = config.model;
  }

  return result;
}

// Convert database tool config to typed tool config
export function parseToolConfig(config: Json): {
  schema?: z.ZodObject<{
    input: z.ZodOptional<z.ZodString>;
  }, "strip">;
  returnDirect?: boolean;
  verbose?: boolean;
} {
  if (!isJsonObject(config)) {
    return {};
  }

  const result: {
    returnDirect?: boolean;
    verbose?: boolean;
  } = {};

  if (typeof config.returnDirect === 'boolean') {
    result.returnDirect = config.returnDirect;
  }
  if (typeof config.verbose === 'boolean') {
    result.verbose = config.verbose;
  }

  return result;
}

// Convert database agent to enhanced agent config
export function convertToEnhancedConfig(
  agent: DatabaseAgent,
  defaultType: AgentType = AgentType.STRUCTURED_CHAT
): EnhancedAgentConfig {
  // Extract provider from model_config if available, default to OpenAI
  const modelConfig = isJsonObject(agent.model_config) ? agent.model_config : {};
  const provider = typeof modelConfig.provider === 'string' &&
    Object.values(ModelProvider).includes(modelConfig.provider as ModelProvider)
    ? modelConfig.provider as ModelProvider
    : ModelProvider.OPENAI;

  return {
    name: agent.name,
    description: agent.description,
    provider,
    model_config: parseModelConfig(agent.model_config),
    system_prompt: agent.system_prompt,
    type: defaultType,
    maxIterations: 5,
    returnIntermediateSteps: true,
    memory: {
      type: 'conversation_buffer_window',
      windowSize: 10,
    },
    errorHandling: {
      maxRetries: 2,
      handleParsingErrors: true,
      fallbackResponses: {
        error: "I encountered an error. Please try rephrasing your request.",
      },
    },
  };
}

// Convert agent step to JSON-safe format
export function convertStepToJson(step: {
  action: string;
  result: string;
  timestamp: Date;
}): { [key: string]: Json } {
  return {
    action: step.action,
    result: step.result,
    timestamp: step.timestamp.toISOString(),
  } as { [key: string]: Json };
}

// Convert execution result to JSON-safe format
export function convertResultToJson(result: {
  output: string;
  intermediateSteps?: Array<{
    action: string;
    result: string;
    timestamp: Date;
  }>;
}): { [key: string]: Json } {
  const jsonResult: { [key: string]: Json } = {
    response: result.output,
    timestamp: new Date().toISOString(),
  };

  if (result.intermediateSteps) {
    jsonResult.intermediateSteps = result.intermediateSteps.map(step => ({
      action: step.action,
      result: step.result,
      timestamp: step.timestamp.toISOString(),
    }));
  }

  return jsonResult;
}
