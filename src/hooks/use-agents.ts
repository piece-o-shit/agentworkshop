
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/pages/Agents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { Json } from '@/integrations/supabase/types';

// Helper to convert Supabase response to Agent type
function convertToAgent(data: any): Agent {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    type: data.type,
    provider: data.provider,
    model_config: {
      model: data.model_config?.model || '',
      temperature: data.model_config?.temperature || 0,
      maxTokens: data.model_config?.maxTokens
    },
    system_prompt: data.system_prompt
  };
}

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
      return (data || []).map(convertToAgent);
    },
    enabled: !!user,
  });

  const createAgent = useMutation({
    mutationFn: async (newAgent: Omit<Agent, 'id'>) => {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...newAgent,
          model_config: newAgent.model_config as Json,
          created_by: user?.id
        })
        .single();
      if (error) throw error;
      return convertToAgent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', user?.id] });
    },
  });

  const updateAgent = useMutation({
    mutationFn: async (updatedAgent: Agent) => {
      const { data, error } = await supabase
        .from('agents')
        .update({
          ...updatedAgent,
          model_config: updatedAgent.model_config as Json
        })
        .eq('id', updatedAgent.id)
        .eq('created_by', user?.id)
        .single();
      if (error) throw error;
      return convertToAgent(data);
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
