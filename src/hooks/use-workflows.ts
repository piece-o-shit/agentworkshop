
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Workflow } from "@/types/workflow";
import { useToast } from "@/components/ui/use-toast";

export function useWorkflows() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Workflow type
      return (data as any[]).map((workflow) => ({
        ...workflow,
        steps: workflow.steps || [],
      })) as Workflow[];
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Omit<Workflow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("workflows")
        .insert({
          name: workflow.name,
          description: workflow.description,
          steps: JSON.stringify(workflow.steps),
          config: workflow.config || {},
          status: workflow.status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating workflow:", error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...workflow }: Partial<Workflow> & { id: string }) => {
      const { data, error } = await supabase
        .from("workflows")
        .update({
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps ? JSON.stringify(workflow.steps) : undefined,
          config: workflow.config,
          status: workflow.status,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating workflow:", error);
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting workflow:", error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
  };
}
