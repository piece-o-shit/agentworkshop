import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AgentType, ModelProvider } from "@/lib/langchain/agent-types";
import { useToast } from "@/components/ui/use-toast";

import { useAgents } from "@/hooks/use-agents";

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  provider: ModelProvider;
  model_config: {
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  system_prompt?: string;
}

const Agents: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  
  const { createAgent, agents, isLoading, deleteAgent } = useAgents();
  const { toast } = useToast();

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await deleteAgent.mutateAsync(agentId);
      toast({
        title: "Agent deleted",
        description: "Successfully deleted the agent.",
      });
      if (selectedAgentId === agentId) {
        setSelectedAgentId(null);
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAgent = async (formData: FormData) => {
    try {
      const values = Object.fromEntries(formData.entries());
      const newAgent: Omit<Agent, 'id'> = {
        name: values.name as string,
        description: values.description as string,
        type: values.type as AgentType,
        provider: values.provider as ModelProvider,
        model_config: {
          model: values['model_config.model'] as string,
          temperature: parseFloat(values['model_config.temperature'] as string),
          maxTokens: values['model_config.maxTokens'] ? parseInt(values['model_config.maxTokens'] as string, 10) : undefined,
        },
        system_prompt: values.system_prompt as string,
      };
      const createdAgent = await createAgent.mutateAsync(newAgent);
      setIsCreating(false);
      setSelectedAgentId(createdAgent.id);
      toast({
        title: "Agent created",
        description: `Successfully created agent: ${createdAgent.name}`,
      });
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setIsCreating(false);
  };

  const selectedAgent = agents?.find(a => a.id === selectedAgentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agents</h1>
        {!isCreating && !selectedAgentId && (
          <Button onClick={() => setIsCreating(true)}>Create Agent</Button>
        )}
      </div>

      <main className="container mx-auto px-4">
        <div className="fade-in">
          {isCreating ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Create New Agent</h2>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateAgent(formData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="name" name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"></textarea>
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select id="type" name="type" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      {Object.values(AgentType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Provider</label>
                    <select id="provider" name="provider" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      {Object.values(ModelProvider).map((provider) => (
                        <option key={provider} value={provider}>{provider}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                    <input type="text" id="model" name="model_config.model" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                  </div>
                  <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">Temperature</label>
                    <input type="number" id="temperature" name="model_config.temperature" min="0" max="1" step="0.1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                  </div>
                  <div>
                    <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">Max Tokens</label>
                    <input type="number" id="maxTokens" name="model_config.maxTokens" min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                  </div>
                  <div>
                    <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700">System Prompt</label>
                    <textarea id="system_prompt" name="system_prompt" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"></textarea>
                  </div>
                </div>
                <div className="mt-6">
                  <Button type="submit" disabled={createAgent.isPending}>
                    {createAgent.isPending ? 'Creating...' : 'Create Agent'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : selectedAgentId ? (
            selectedAgent ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">{selectedAgent.name}</h2>
                  <Button variant="ghost" onClick={() => setSelectedAgentId(null)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p>{selectedAgent.description}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Type</h3>
                    <p>{selectedAgent.type}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Provider</h3>
                    <p>{selectedAgent.provider}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Model Configuration</h3>
                    <p>Model: {selectedAgent.model_config.model}</p>
                    <p>Temperature: {selectedAgent.model_config.temperature}</p>
                    {selectedAgent.model_config.maxTokens && <p>Max Tokens: {selectedAgent.model_config.maxTokens}</p>}
                  </div>
                  {selectedAgent.system_prompt && (
                    <div>
                      <h3 className="text-lg font-semibold">System Prompt</h3>
                      <p>{selectedAgent.system_prompt}</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div>Loading agent details...</div>
            )
          ) : (
            isLoading ? (
              <div>Loading agents...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents?.map((agent) => (
                  <Card key={agent.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="cursor-pointer" onClick={() => handleAgentSelect(agent.id)}>
                        <h3 className="text-lg font-semibold">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.type}</p>
                        <p className="mt-2">{agent.description}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Agents;
