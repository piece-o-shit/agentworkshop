
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
  roles: string[];
}

interface UserListItemProps {
  user: User;
  onToggleAdmin: (userId: string, isCurrentlyAdmin: boolean) => Promise<void>;
  onViewDetails: (user: User) => void;
}

export const UserListItem = ({ user, onToggleAdmin, onViewDetails }: UserListItemProps) => {
  return (
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
            onToggleAdmin(user.id, user.roles.includes("admin"))
          }
        />
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onViewDetails(user)}
        >
          View Details
        </Button>
      </TableCell>
    </TableRow>
  );
};
