import { Button } from "@/components/ui/button";
import { Bot, ArrowLeft, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkflowHeaderProps {
  onCreateClick: () => void;
  showCreateButton?: boolean;
}

export function WorkflowHeader({ onCreateClick, showCreateButton = true }: WorkflowHeaderProps) {
  return (
    <>
      <nav className="glass-panel fixed top-0 w-full z-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold">AgentFlow</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto pt-24 px-4">
        <div className="fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Workflows</h1>
              <p className="text-muted-foreground">
                Create and manage your automated workflows
              </p>
            </div>
            {showCreateButton && (
              <Button onClick={onCreateClick}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
