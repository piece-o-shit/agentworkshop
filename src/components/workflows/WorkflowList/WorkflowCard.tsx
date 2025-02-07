import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { FormattedWorkflow } from "@/types/workflow";

interface WorkflowCardProps {
  workflow: FormattedWorkflow;
  onClick: (id: string) => void;
}

export function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(workflow.id)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{workflow.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {workflow.description}
          </p>
        </div>
        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
          {workflow.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}
