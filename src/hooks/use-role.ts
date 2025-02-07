
import { useAuth } from '@/lib/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user';

export function useRole() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) throw error;
      return (data || []).map(r => r.role) as UserRole[];
    },
    enabled: !!user,
  });

  const isAdmin = roles.includes('admin');
  const hasRole = (role: UserRole) => roles.includes(role);

  return {
    roles,
    isAdmin,
    hasRole,
    isLoading,
  };
}
