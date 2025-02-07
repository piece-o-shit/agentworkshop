import { Button } from "@/components/ui/button";
import { Bot, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export function ToolHeader() {
  return (
    <>
      <nav className="glass-panel fixed top-0 w-full z-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold">AgentFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Settings className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto pt-24 px-4">
        <div className="fade-in">
          <h1 className="text-4xl font-bold mb-2">Tools</h1>
          <p className="text-muted-foreground mb-8">
            Create and manage your agent tools
          </p>
        </div>
      </div>
    </>
  );
}
