
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Tool {
  id: string;
  name: string;
  description?: string;
  type: string;
  config: Record<string, any>;
  created_at?: string;
}

export function useTools() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tools, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Tool[];
    },
  });

  const createTool = useMutation({
    mutationFn: async (tool: Omit<Tool, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("tools")
        .insert(tool)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({
        title: "Tool created",
        description: "Your tool has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create tool. Please try again.",
        variant: "destructive",
      });
      console.error("Create tool error:", error);
    },
  });

  const updateTool = useMutation({
    mutationFn: async ({ id, ...tool }: Partial<Tool> & { id: string }) => {
      const { data, error } = await supabase
        .from("tools")
        .update(tool)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({
        title: "Tool updated",
        description: "Your tool has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tool. Please try again.",
        variant: "destructive",
      });
      console.error("Update tool error:", error);
    },
  });

  const deleteTool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast({
        title: "Tool deleted",
        description: "Your tool has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete tool. Please try again.",
        variant: "destructive",
      });
      console.error("Delete tool error:", error);
    },
  });

  return {
    tools,
    isLoading,
    createTool: createTool.mutate,
    updateTool: updateTool.mutate,
    deleteTool: deleteTool.mutate,
  };
}
