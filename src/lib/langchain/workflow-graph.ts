import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { Tool } from "@langchain/core/tools";
import { WorkflowStep, Workflow } from "@/types/workflow";
import { AgentExecutorResult, AgentType } from "./agent-types";
import { executeAgent } from "./config";

type WorkflowStatus = 'running' | 'completed' | 'error';

export interface WorkflowState {
  messages: BaseMessage[];
  current_step: number;
  workflow_status: WorkflowStatus;
  step_results: Array<{
    step: WorkflowStep;
    result: AgentExecutorResult;
    timestamp: string;
  }>;
  error?: {
    step: number;
    message: string;
    timestamp: string;
  };
}

interface WorkflowContext {
  tools: Tool[];
  workflow: Workflow;
  onStepComplete?: (step: number, result: AgentExecutorResult) => void;
  onError?: (error: Error, step: number) => void;
}

// Create workflow execution graph
export function createWorkflowGraph(context: WorkflowContext) {
  const model = new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-4",
  });

  const graph = new StateGraph<WorkflowState>({
    channels: {
      messages: {
        default: () => [],
        reducer: (prev, next) => next
      },
      current_step: {
        default: () => 0,
        reducer: (prev, next) => next
      },
      workflow_status: {
        default: () => 'running',
        reducer: (prev, next) => next
      },
      step_results: {
        default: () => [],
        reducer: (prev, next) => next
      },
      error: {
        default: () => undefined,
        reducer: (prev, next) => next
      }
    }
  });

  const processStep = RunnableSequence.from([
    (state: WorkflowState) => state,
    async (state: WorkflowState) => {
      try {
        const currentStep = context.workflow.steps[state.current_step];
        if (!currentStep) {
          return {
            messages: state.messages,
            current_step: state.current_step,
            workflow_status: 'completed',
            step_results: state.step_results
          } as WorkflowState;
        }

        // Execute the step using our agent system
        const result = await executeAgent({
          name: currentStep.name,
          description: `Executing workflow step: ${currentStep.name}`,
          type: AgentType.STRUCTURED_CHAT,
          model_config: {
            temperature: 0,
            model: "gpt-4",
          },
          system_prompt: `You are executing the workflow step: ${currentStep.name}. 
                         Action: ${currentStep.action}
                         Parameters: ${JSON.stringify(currentStep.parameters)}`,
          maxIterations: 3,
          returnIntermediateSteps: true,
          memory: {
            type: 'conversation_buffer_window',
            windowSize: 5,
          },
          errorHandling: {
            maxRetries: 2,
            handleParsingErrors: true,
          },
        }, context.tools, JSON.stringify(currentStep.parameters));

        // Notify step completion if callback provided
        if (context.onStepComplete) {
          context.onStepComplete(state.current_step, result);
        }

        return {
          messages: [...state.messages, new AIMessage(result.output)],
          current_step: state.current_step + 1,
          workflow_status: state.current_step >= context.workflow.steps.length - 1 ? 'completed' : 'running',
          step_results: [...state.step_results, {
            step: currentStep,
            result,
            timestamp: new Date().toISOString()
          }]
        } as WorkflowState;
      } catch (error) {
        // Handle errors and notify if callback provided
        const errorDetails = {
          step: state.current_step,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };

        if (context.onError) {
          context.onError(error instanceof Error ? error : new Error(errorDetails.message), state.current_step);
        }

        return {
          messages: state.messages,
          current_step: state.current_step,
          workflow_status: 'error',
          step_results: state.step_results,
          error: errorDetails
        } as WorkflowState;
      }
    }
  ]);

  // Add nodes and edges
  graph.addNode("__start__", processStep);
  graph.addEdge("__start__", END);
  graph.setEntryPoint("__start__");

  return graph.compile();
}

export async function executeWorkflow(
  workflow: Workflow,
  tools: Tool[] = [],
  callbacks?: {
    onStepComplete?: (step: number, result: AgentExecutorResult) => void;
    onError?: (error: Error, step: number) => void;
  }
): Promise<WorkflowState> {
  const graph = createWorkflowGraph({
    workflow,
    tools,
    onStepComplete: callbacks?.onStepComplete,
    onError: callbacks?.onError
  });

  const initialState: WorkflowState = {
    messages: [],
    current_step: 0,
    workflow_status: 'running',
    step_results: []
  };

  try {
    const result = await graph.invoke(initialState);
    return result as WorkflowState;
  } catch (error) {
    console.error('Workflow execution error:', error);
    return {
      ...initialState,
      workflow_status: 'error',
      error: {
        step: -1,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    };
  }
}
