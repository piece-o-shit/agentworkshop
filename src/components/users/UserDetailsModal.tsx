
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
  roles: string[];
}

interface UserDetailsModalProps {
  user: User | null;
  onClose: () => void;
}

export const UserDetailsModal = ({ user, onClose }: UserDetailsModalProps) => {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information about the user
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {user.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <div className="col-span-3">
              {user.full_name}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Roles</Label>
            <div className="col-span-3">
              {user.roles.length > 0 
                ? user.roles.join(", ") 
                : "No special roles"}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Last Updated</Label>
            <div className="col-span-3">
              {format(new Date(user.updated_at), "PPpp")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
