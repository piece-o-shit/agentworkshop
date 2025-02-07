import { FormattedWorkflow } from "@/types/workflow";
import { WorkflowCard } from "./WorkflowCard";

interface WorkflowListProps {
  workflows?: FormattedWorkflow[];
  onSelect: (id: string) => void;
}

export function WorkflowList({ workflows = [], onSelect }: WorkflowListProps) {
  if (!workflows.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No workflows found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
