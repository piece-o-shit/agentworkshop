
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
        merge: (a: BaseMessage[], b: BaseMessage[]) => [...(a || []), ...(b || [])]
      },
      current_step: {
        type: "number",
        value: 0,
        merge: (a: number, b: number) => b
      },
      workflow_status: {
        type: "string",
        value: "running",
        merge: (a: string, b: string) => b
      },
    },
  });

  // Define the processing node
  const processStep = RunnableSequence.from([
    {
      state: (state: WorkflowState) => state,
      response: async (input: { state: WorkflowState }) => {
        const messages = input.state.messages;
        const lastMessage = messages[messages.length - 1];
        return await model.invoke([
          new HumanMessage(
            `Process step ${input.state.current_step}: ${lastMessage.content}`
          ),
        ]);
      }
    },
    (input: { state: WorkflowState; response: AIMessage }) => ({
      messages: [...input.state.messages, input.response],
      current_step: input.state.current_step + 1,
      workflow_status: "running"
    })
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
    workflow_status: "running"
  };

  const result = await graph.invoke(initialState);
  return result as WorkflowState;
}
