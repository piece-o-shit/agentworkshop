
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserListItem } from "./UserListItem";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
  roles: string[];
}

interface UserListProps {
  users: User[];
  onToggleAdmin: (userId: string, isCurrentlyAdmin: boolean) => Promise<void>;
  onViewDetails: (user: User) => void;
}

export const UserList = ({ users, onToggleAdmin, onViewDetails }: UserListProps) => {
  return (
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
          <UserListItem
            key={user.id}
            user={user}
            onToggleAdmin={onToggleAdmin}
            onViewDetails={onViewDetails}
          />
        ))}
      </TableBody>
    </Table>
  );
};
