
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRole } from "@/hooks/use-role";
import { Navigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        // Check if the role already exists
        const { data: existingRole, error: checkError } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();

        if (checkError && checkError.code !== "PGRST116") throw checkError; // PGRST116 means no rows returned

        // Only insert if the role doesn't exist
        if (!existingRole) {
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "admin" });

          if (insertError) throw insertError;
        }
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Admin Access</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.full_name}</span>
                </div>
              </TableCell>
              <TableCell>
                {new Date(user.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Switch
                  checked={user.roles.includes("admin")}
                  onCheckedChange={() =>
                    toggleAdminRole(user.id, user.roles.includes("admin"))
                  }
                />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Users;
