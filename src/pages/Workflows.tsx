import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useWorkflows } from "@/hooks/use-workflows";
import { WorkflowHeader } from "@/components/workflows/WorkflowHeader";
import { WorkflowList } from "@/components/workflows/WorkflowList";
import { WorkflowTabs } from "@/components/workflows/WorkflowTabs";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { WorkflowFormValues, CreateWorkflowInput, Workflow, WorkflowStep, FormattedWorkflow } from "@/types/workflow";
import { Json } from "@/integrations/supabase/types";

export default function Workflows() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const { createWorkflow, workflows, isLoading } = useWorkflows();

  const transformToDbFormat = (values: WorkflowFormValues): CreateWorkflowInput => ({
    name: values.name,
    description: values.description || '',
    steps: JSON.parse(JSON.stringify(values.steps)) as Json,
    status: 'draft',
    config: JSON.parse(JSON.stringify(values.config || {})) as Json,
    created_by: 'system' // This should come from auth context in production
  });

  const transformFromDbFormat = (workflow: Workflow): FormattedWorkflow => ({
    ...workflow,
    description: workflow.description || '',  // Ensure description is never undefined
    created_by: workflow.created_by || 'system',  // Ensure created_by is never undefined
    steps: JSON.parse(JSON.stringify(workflow.steps)) as WorkflowStep[],
    config: JSON.parse(JSON.stringify(workflow.config)) as Record<string, Json>
  });

  const handleCreateWorkflow = async (values: WorkflowFormValues) => {
    const input = transformToDbFormat(values);
    const workflow = await createWorkflow.mutateAsync(input);
    setIsCreating(false);
    setSelectedWorkflowId(workflow.id);
  };

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsCreating(false);
  };

  const selectedWorkflow = workflows?.find(w => w.id === selectedWorkflowId);
  const formattedWorkflow: FormattedWorkflow | undefined = selectedWorkflow ? transformFromDbFormat(selectedWorkflow) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <WorkflowHeader
        onCreateClick={() => setIsCreating(true)}
        showCreateButton={!isCreating && !selectedWorkflowId}
      />

      <main className="container mx-auto px-4">
        <div className="fade-in">
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
          ) : selectedWorkflowId ? (
            <WorkflowTabs
              workflow={formattedWorkflow}
              onBack={() => setSelectedWorkflowId(null)}
              onUpdate={async (values) => {
                // Handle workflow update
              }}
              isLoading={isLoading}
            />
          ) : (
            <WorkflowList
              workflows={workflows?.map(w => transformFromDbFormat(w))}
              onSelect={handleWorkflowSelect}
            />
          )}
        </div>
      </main>
    </div>
  );
}
