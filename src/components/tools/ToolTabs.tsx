import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentSearch } from "@/components/DocumentSearch";
import { ToolForm } from "./ToolForm";
import { ToolFormValues } from "./types";

interface ToolTabsProps {
  onSubmit: (data: ToolFormValues) => void;
  isLoading?: boolean;
}

export function ToolTabs({ onSubmit, isLoading }: ToolTabsProps) {
  return (
    <Tabs defaultValue="tools" className="space-y-4">
      <TabsList>
        <TabsTrigger value="tools">Custom Tools</TabsTrigger>
        <TabsTrigger value="documents">Document Search</TabsTrigger>
      </TabsList>

      <TabsContent value="tools">
        <Card className="p-6">
          <ToolForm onSubmit={onSubmit} isLoading={isLoading} />
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <DocumentSearch />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
