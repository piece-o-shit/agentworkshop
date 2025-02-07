
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Bot, Workflow, Settings, LogOut, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useRole } from "@/hooks/use-role";

const Index = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useRole();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <nav className="glass-panel fixed top-0 w-full z-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold">AgentFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto pt-24 px-4">
        <div className="fade-in">
          <h1 className="text-4xl font-bold mb-2">Welcome to AgentFlow</h1>
          <p className="text-muted-foreground mb-8">
            Create and manage your AI agents and workflows
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Bot className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold">Agents</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Create and manage your AI agents
              </p>
              <Button asChild>
                <Link to="/agents">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Agent
                </Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Workflow className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold">Workflows</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Design automated workflows
              </p>
              <Button asChild>
                <Link to="/workflows">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <Settings className="w-6 h-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold">Tools</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Configure agent tools and capabilities
              </p>
              <Button asChild>
                <Link to="/tools">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Tool
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
