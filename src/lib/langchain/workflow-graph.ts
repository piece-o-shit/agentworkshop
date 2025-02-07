
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { RunnableLike } from "@langchain/core/runnables";

interface WorkflowState {
  messages: BaseMessage[];
  current_step: number;
  workflow_status: 'running' | 'completed' | 'error';
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
        default: () => [] as BaseMessage[],
        reducer: (messages: BaseMessage[], newMessages: BaseMessage[]) => 
          [...messages, ...newMessages]
      },
      current_step: {
        default: () => 0,
        reducer: (_: number, newStep: number) => newStep
      },
      workflow_status: {
        default: () => 'running' as const,
        reducer: (_: string, newStatus: string) => newStatus
      }
    },
  });

  // Define the processing node with improved sequence
  const processStep = RunnableSequence.from([
    async (state: WorkflowState) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const response = await model.invoke([
        new HumanMessage(`Process step ${state.current_step}: ${lastMessage.content}`)
      ]);
      
      return {
        messages: [response],
        current_step: state.current_step + 1,
        workflow_status: state.current_step >= 3 ? 'completed' : 'running'
      } as WorkflowState;
    }
  ]) as RunnableLike<WorkflowState, WorkflowState>;

  // Add the processing node and set edges
  workflow.addNode("process", processStep);
  workflow.setEntryPoint("process");
  workflow.addEdge("process", END);

  return workflow.compile();
}

// Execute a workflow with state updates
interface WorkflowUpdate {
  messages?: BaseMessage[];
  current_step?: number;
  workflow_status?: WorkflowState['workflow_status'];
}

export async function executeWorkflow(
  workflowSteps: string[]
): Promise<WorkflowState> {
  const graph = createWorkflowGraph();
  
  const initialState: WorkflowState = {
    messages: [new HumanMessage(workflowSteps[0])],
    current_step: 0,
    workflow_status: 'running'
  };

  return await graph.invoke(initialState);
}
