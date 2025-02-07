
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  executeAgent, 
  createToolFromConfig 
} from "@/lib/langchain/config";
import { AgentType } from "@/lib/langchain/agent-types";
import { 
  DatabaseAgent, 
  DatabaseTool,
  convertToEnhancedConfig,
  convertResultToJson,
  parseToolConfig 
} from "@/lib/langchain/database-utils";
import { useToast } from "@/components/ui/use-toast";

export function useAgentExecution(agentId: string) {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  // Fetch agent configuration and tools
  const { data: agent } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .maybeSingle();

      if (agentError) throw agentError;

      // Fetch associated tools
      const { data: toolData, error: toolError } = await supabase
        .from("agent_tools")
        .select(`
          tool_id,
          tools (*)
        `)
        .eq("agent_id", agentId);

      if (toolError) throw toolError;

      const dbAgent = agentData as DatabaseAgent;
      const dbTools = toolData?.map((t) => t.tools as DatabaseTool) || [];

      return {
        agent: dbAgent,
        tools: dbTools,
      };
    },
  });

  // Execute agent mutation
  const executeMutation = useMutation({
    mutationFn: async ({ input }: { input: string }) => {
      try {
        setIsExecuting(true);

        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from("agent_executions")
          .insert({
            agent_id: agentId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            input,
            status: "running",
          })
          .select()
          .single();

        if (execError) throw execError;

        if (!agent) throw new Error("Agent not found");

        // Convert agent configuration to enhanced config
        const enhancedConfig = convertToEnhancedConfig(agent.agent);

        // Convert tool configs to LangChain tools
        const tools = agent.tools.map(tool => createToolFromConfig({
          name: tool.name,
          description: tool.description,
          config: parseToolConfig(tool.config || {}),
        }));

        // Execute the agent with enhanced configuration
        const result = await executeAgent(enhancedConfig, tools, input);

        // Convert result to JSON-safe format
        const jsonResult = convertResultToJson(result);

        // Update execution record with result
        await supabase
          .from("agent_executions")
          .update({
            output: jsonResult,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", execution.id);

        return jsonResult;
      } catch (error) {
        console.error("Agent execution error:", error);
        toast({
          title: "Execution Error",
          description: "Failed to execute agent. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
  });

  // Fetch agent execution history
  const { data: executionHistory } = useQuery({
    queryKey: ["agent-executions", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_executions")
        .select("*")
        .eq("agent_id", agentId)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    agent,
    isExecuting,
    execute: executeMutation.mutate,
    executionHistory,
  };
}
