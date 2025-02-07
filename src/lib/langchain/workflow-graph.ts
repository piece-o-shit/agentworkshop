
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
  // Initialize the graph
  const workflow = new StateGraph({
    channels: {
      messages: [],
      current_step: 0,
      workflow_status: "running",
    },
  });

  // Define the processing node
  const processStep = RunnableSequence.from([
    (state) => state,
    async (state: WorkflowState) => {
      const { messages, current_step } = state;
      const lastMessage = messages[messages.length - 1];
      const response = await model.invoke([
        new HumanMessage(
          `Process step ${current_step}: ${lastMessage.content}`
        ),
      ]);
      
      return {
        messages: [...state.messages, response],
        current_step: state.current_step + 1,
        workflow_status: "running",
      };
    },
  ]);

  // Add the processing node to the graph
  workflow.addNode("process", processStep);

  // Add edges
  workflow.addEdge("process", END);

  // Set the entry point
  workflow.setEntryPoint("process");

  // Compile the graph
  return workflow.compile();
}

// Execute a workflow
export async function executeWorkflow(
  workflowSteps: string[]
): Promise<WorkflowState> {
  const graph = createWorkflowGraph();
  
  const config = {
    messages: [new HumanMessage(workflowSteps[0])],
    current_step: 0,
    workflow_status: "running",
  };

  // Execute the workflow
  const result = await graph.invoke(config);
  return result as WorkflowState;
}
