
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useRole } from "@/hooks/use-role";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { UserList } from "@/components/users/UserList";
import { UserDetailsModal } from "@/components/users/UserDetailsModal";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
  roles: string[];
}

const Users = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useRole();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, updated_at");

      if (usersError) throw usersError;

      // Fetch roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine user data with roles
      return users.map((user) => ({
        ...user,
        roles: roles
          .filter((r) => r.user_id === user.id)
          .map((r) => r.role),
      }));
    },
    enabled: isAdmin,
  });

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (deleteError) throw deleteError;
      } else {
        // Using upsert instead of insert to handle potential race conditions
        const { error: upsertError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: userId, role: "admin" },
            { onConflict: 'user_id,role' }
          );

        if (upsertError) throw upsertError;
      }

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      refetch();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  if (roleLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <UserList 
        users={users}
        onToggleAdmin={toggleAdminRole}
        onViewDetails={setSelectedUser}
      />
      <UserDetailsModal 
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default Users;
