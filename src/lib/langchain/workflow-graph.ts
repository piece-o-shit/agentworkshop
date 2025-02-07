
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
        merge: (curr: BaseMessage[], next: BaseMessage[]) => [...curr, ...next]
      },
      current_step: {
        type: "number",
        value: 0,
        merge: (curr: number, next: number) => next
      },
      workflow_status: {
        type: "string",
        value: "running",
        merge: (curr: string, next: string) => next
      },
    },
  });

  // Define the processing node with proper sequence of operations
  const processStep = RunnableSequence.from([
    // First step: Process input state
    (state: WorkflowState) => ({
      state,
      lastMessage: state.messages[state.messages.length - 1]
    }),
    // Second step: Generate response
    async (input: { state: WorkflowState; lastMessage: BaseMessage }) => {
      const response = await model.invoke([
        new HumanMessage(
          `Process step ${input.state.current_step}: ${input.lastMessage.content}`
        ),
      ]);
      
      return {
        messages: [...input.state.messages, response],
        current_step: input.state.current_step + 1,
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
  
  const initialState = {
    messages: [new HumanMessage(workflowSteps[0])],
    current_step: 0,
    workflow_status: "running"
  } as const;

  const result = await graph.invoke(initialState);
  return result as WorkflowState;
}
