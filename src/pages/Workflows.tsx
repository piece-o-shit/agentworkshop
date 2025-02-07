
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Bot, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { useWorkflows } from "@/hooks/use-workflows";

export default function Workflows() {
  const [isCreating, setIsCreating] = useState(false);
  const { createWorkflow, isLoading } = useWorkflows();

  const handleCreateWorkflow = async (values: any) => {
    await createWorkflow.mutateAsync({
      ...values,
      status: "draft",
    });
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
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

      <main className="container mx-auto pt-24 px-4">
        <div className="fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Workflows</h1>
              <p className="text-muted-foreground">
                Create and manage your automated workflows
              </p>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            )}
          </div>

          {isCreating ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Create New Workflow</h2>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
              <WorkflowBuilder
                onSubmit={handleCreateWorkflow}
                isLoading={createWorkflow.isPending}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Workflow list will be implemented here */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
