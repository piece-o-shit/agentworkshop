
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
        merge: (a, b) => [...(a || []), ...(b || [])],
      },
      current_step: {
        type: "number",
        value: 0,
        merge: (_, b) => b,
      },
      workflow_status: {
        type: "string",
        value: "running",
        merge: (_, b) => b,
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
        messages: [...messages, response],
        current_step: state.current_step + 1,
        workflow_status: "running",
      };
    },
    // Add identity function as second element to satisfy RunnableSequence type requirements
    (state) => state,
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
    workflow_status: "running",
  };

  const result = await graph.invoke(initialState);
  return result as WorkflowState;
}
