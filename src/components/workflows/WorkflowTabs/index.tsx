import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { ScheduleWorkflow } from "@/components/workflow/ScheduleWorkflow";
import { FormattedWorkflow, WorkflowFormValues } from "../types";

interface WorkflowTabsProps {
  workflow?: FormattedWorkflow;
  onBack: () => void;
  onUpdate: (values: WorkflowFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function WorkflowTabs({ workflow, onBack, onUpdate, isLoading }: WorkflowTabsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {workflow?.name}
        </h2>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Workflows
        </Button>
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <WorkflowBuilder
            onSubmit={onUpdate}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleWorkflow workflowId={workflow?.id || ''} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
