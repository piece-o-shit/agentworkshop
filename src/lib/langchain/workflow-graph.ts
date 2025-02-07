
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
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
  // Initialize the graph
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      messages: { value: [] as BaseMessage[] },
      current_step: { value: 0 },
      workflow_status: { value: "running" },
    },
  });

  // Define the processing node
  const processStep = RunnableSequence.from([
    async (state: WorkflowState) => {
      const { messages, current_step } = state;
      const lastMessage = messages[messages.length - 1];
      // Process the current step using the model
      const response = await model.invoke([
        new HumanMessage(
          `Process step ${current_step}: ${lastMessage.content}`
        ),
      ]);
      return response;
    },
  ]);

  // Add the processing node to the graph
  workflow.addNode("process_step", processStep);

  // Add edges
  workflow.addEdge("process_step", END);

  // Set the entry point
  workflow.setEntryPoint("process_step");

  // Compile the graph
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

  // Execute the workflow
  const result = await graph.invoke(initialState);
  return result;
}
