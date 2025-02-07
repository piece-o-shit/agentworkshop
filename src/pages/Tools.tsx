import { useTools } from "@/hooks/use-tools";
import { ToolHeader } from "@/components/tools/ToolHeader";
import { ToolTabs } from "@/components/tools/ToolTabs";
import { ToolFormValues } from "@/components/tools/types";

export default function Tools() {
  const { createTool, isLoading } = useTools();

  const handleSubmit = (data: ToolFormValues) => {
    createTool({
      name: data.name,
      description: data.description,
      type: data.type,
      config: data.config
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <ToolHeader />
      <main className="container mx-auto px-4">
        <div className="fade-in">
          <ToolTabs onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
