import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/pages/Agents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useAgents() {
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*');
      if (error) throw error;
      return data as Agent[];
    },
  });

  const createAgent = useMutation({
    mutationFn: async (newAgent: Omit<Agent, 'id'>) => {
      const { data, error } = await supabase
        .from('agents')
        .insert(newAgent)
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const updateAgent = useMutation({
    mutationFn: async (updatedAgent: Agent) => {
      const { data, error } = await supabase
        .from('agents')
        .update(updatedAgent)
        .eq('id', updatedAgent.id)
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  return {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
