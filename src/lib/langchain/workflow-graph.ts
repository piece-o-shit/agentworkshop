
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { RunnableLike } from "@langchain/core/runnables";

interface WorkflowState {
  messages: BaseMessage[];
  current_step: number;
  workflow_status: string;
}

// Initialize LLM
const model = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-4",
});

// Create workflow execution graph
export function createWorkflowGraph() {
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      messages: {
        type: "list" as const,
        default: () => [] as BaseMessage[],
        merge: (a: BaseMessage[], b: BaseMessage[]) => [...(a || []), ...(b || [])]
      },
      current_step: {
        type: "number" as const,
        default: () => 0,
        merge: (a: number, b: number) => b
      },
      workflow_status: {
        type: "string" as const,
        default: () => "running",
        merge: (a: string, b: string) => b
      }
    },
  });

  // Define the processing node with two-step sequence
  const processStep = RunnableSequence.from([
    {
      current: (state: WorkflowState) => state,
      response: async (input: { current: WorkflowState }) => {
        const lastMessage = input.current.messages[input.current.messages.length - 1];
        return await model.invoke([
          new HumanMessage(`Process step ${input.current.current_step}: ${lastMessage.content}`)
        ]);
      }
    },
    (input: { current: WorkflowState; response: AIMessage }) => ({
      messages: [...input.current.messages, input.response],
      current_step: input.current.current_step + 1,
      workflow_status: "running"
    } as WorkflowState)
  ]) as RunnableLike<WorkflowState, WorkflowState>;

  // Add the processing node and set edges
  workflow.addNode("__start__", processStep);
  workflow.setEntryPoint("__start__");
  workflow.addEdge("__start__", END);

  return workflow.compile();
}

// Execute a workflow with state updates
interface StateUpdate {
  messages?: BaseMessage[];
  current_step?: number;
  workflow_status?: string;
}

export async function executeWorkflow(
  workflowSteps: string[]
): Promise<WorkflowState> {
  const graph = createWorkflowGraph();
  
  const initialState: WorkflowState = {
    messages: [new HumanMessage(workflowSteps[0])],
    current_step: 0,
    workflow_status: "running"
  };

  const result = await graph.invoke(initialState);
  return result as WorkflowState;
}
