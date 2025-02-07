
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
        // Add merge function for list type
        merge: (a: BaseMessage[], b: BaseMessage[]) => [...a, ...b],
      },
      current_step: { 
        type: "number", 
        value: 0,
        // Add merge function for number type
        merge: (_: number, b: number) => b,
      },
      workflow_status: { 
        type: "string", 
        value: "running",
        // Add merge function for string type
        merge: (_: string, b: string) => b,
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
      } as WorkflowState;
    },
  ]);

  // Add the processing node and set edges
  workflow.addNode("process", processStep);
  workflow.setEntryPoint("process");
  workflow.addEdge("process", END);

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
