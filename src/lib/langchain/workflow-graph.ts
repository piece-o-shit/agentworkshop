
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
        type: "list",
        value: [] as BaseMessage[],
        merge: function merge(a: BaseMessage[], b: BaseMessage[]) {
          return [...(a || []), ...(b || [])];
        }
      },
      current_step: {
        type: "number",
        value: 0,
        merge: function merge(a: number, b: number) {
          return b;
        }
      },
      workflow_status: {
        type: "string",
        value: "running",
        merge: function merge(a: string, b: string) {
          return b;
        }
      },
    },
  });

  // Define the processing node with proper sequence of operations
  const processStep = RunnableSequence.from([
    {
      input: (state: WorkflowState) => state,
      response: async (input: { state: WorkflowState }) => {
        const lastMessage = input.state.messages[input.state.messages.length - 1];
        return await model.invoke([
          new HumanMessage(`Process step ${input.state.current_step}: ${lastMessage.content}`)
        ]);
      }
    },
    (inputs: { input: WorkflowState; response: AIMessage }) => ({
      messages: [...inputs.input.messages, inputs.response],
      current_step: inputs.input.current_step + 1,
      workflow_status: "running"
    })
  ]) as RunnableLike<WorkflowState, any>;

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
  } satisfies WorkflowState;

  const result = await graph.invoke(initialState);
  return result as WorkflowState;
}
