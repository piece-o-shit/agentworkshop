
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
      return data as Workflow[];
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      const { data, error } = await supabase
        .from("workflows")
        .insert(workflow)
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
    mutationFn: async (workflow: Partial<Workflow>) => {
      const { data, error } = await supabase
        .from("workflows")
        .update(workflow)
        .eq("id", workflow.id)
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
