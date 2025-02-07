
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createAgentExecutor, createAgentChain } from "@/lib/langchain/config";
import { useToast } from "@/components/ui/use-toast";

export function useAgentExecution(agentId: string) {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  // Fetch agent configuration
  const { data: agent } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error) throw error;
      return data;
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
            input,
            status: "running",
          })
          .select()
          .single();

        if (execError) throw execError;

        // Initialize agent executor
        const executor = await createAgentExecutor(agent!);
        const chain = createAgentChain(executor);

        // Execute the agent
        const result = await chain.invoke({
          input,
        });

        // Update execution record
        await supabase
          .from("agent_executions")
          .update({
            output: result,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", execution.id);

        return result;
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
