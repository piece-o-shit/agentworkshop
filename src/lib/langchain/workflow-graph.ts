
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";

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
        type: "list",
        value: [] as BaseMessage[],
        merge: function(a: BaseMessage[] | undefined, b: BaseMessage[] | undefined) {
          return [...(a || []), ...(b || [])];
        }
      },
      current_step: {
        type: "number",
        value: 0,
        merge: function(a: number | undefined, b: number | undefined) {
          return b ?? a ?? 0;
        }
      },
      workflow_status: {
        type: "string",
        value: "running",
        merge: function(a: string | undefined, b: string | undefined) {
          return b ?? a ?? "running";
        }
      },
    },
  });

  // Define the processing node
  const processStep = RunnableSequence.from([
    async (state: WorkflowState) => {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      const response = await model.invoke([
        new HumanMessage(
          `Process step ${state.current_step}: ${lastMessage.content}`
        ),
      ]);
      
      return {
        messages: [...state.messages, response],
        current_step: state.current_step + 1,
        workflow_status: "running"
      } as WorkflowState;
    }
  ]);

  // Add the processing node and set edges
  workflow.addNode("__start__", processStep);
  workflow.setEntryPoint("__start__");
  workflow.addEdge("__start__", END);

  return workflow.compile();
}

// Execute a workflow
export async function executeWorkflow(
  workflowSteps: string[]
): Promise<WorkflowState> {
  const graph = createWorkflowGraph();
  
  const initialState: WorkflowState = {
    messages: [new HumanMessage(workflowSteps[0])],
    current_step: 0,
    workflow_status: "running"
  };

  return await graph.invoke(initialState);
}
