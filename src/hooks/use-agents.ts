
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/pages/Agents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';

export function useAgents() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('created_by', user?.id);
      if (error) throw error;
      return data as Agent[];
    },
    enabled: !!user,
  });

  const createAgent = useMutation({
    mutationFn: async (newAgent: Omit<Agent, 'id'>) => {
      const { data, error } = await supabase
        .from('agents')
        .insert({ ...newAgent, created_by: user?.id })
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', user?.id] });
    },
  });

  const updateAgent = useMutation({
    mutationFn: async (updatedAgent: Agent) => {
      const { data, error } = await supabase
        .from('agents')
        .update(updatedAgent)
        .eq('id', updatedAgent.id)
        .eq('created_by', user?.id)
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', user?.id] });
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('created_by', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', user?.id] });
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
