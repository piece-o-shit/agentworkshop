
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTools } from "@/hooks/use-tools";
import { Bot, Settings, PlusCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ToolParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: string;
}

const toolFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Type is required"),
  config: z.object({
    actionType: z.string(),
    parameters: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean']),
      defaultValue: z.string()
    }))
  })
});

const Tools = () => {
  const { tools, createTool, isLoading } = useTools();
  const [parameters, setParameters] = useState<ToolParameter[]>([]);

  const form = useForm({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "action",
      config: {
        actionType: "sendMessage",
        parameters: []
      }
    }
  });

  const addParameter = () => {
    const newParam: ToolParameter = {
      id: crypto.randomUUID(),
      name: "",
      type: "string",
      defaultValue: ""
    };
    setParameters([...parameters, newParam]);
  };

  const removeParameter = (id: string) => {
    setParameters(parameters.filter(param => param.id !== id));
  };

  const onSubmit = (data: z.infer<typeof toolFormSchema>) => {
    createTool({
      name: data.name,
      description: data.description,
      type: data.type,
      config: {
        ...data.config,
        parameters
      }
    });
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
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Settings className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto pt-24 px-4">
        <div className="fade-in">
          <h1 className="text-4xl font-bold mb-2">Tools</h1>
          <p className="text-muted-foreground mb-8">
            Create and manage your agent tools
          </p>

          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Tool name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Tool description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tool type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="action">Action</SelectItem>
                          <SelectItem value="data">Data</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Parameters</h3>
                    <Button type="button" onClick={addParameter} variant="outline">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>

                  {parameters.map((param) => (
                    <Card key={param.id} className="p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                value={param.name}
                                onChange={(e) => {
                                  const updated = parameters.map((p) =>
                                    p.id === param.id ? { ...p, name: e.target.value } : p
                                  );
                                  setParameters(updated);
                                }}
                                placeholder="Parameter name"
                              />
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={param.type}
                              onValueChange={(value: 'string' | 'number' | 'boolean') => {
                                const updated = parameters.map((p) =>
                                  p.id === param.id ? { ...p, type: value } : p
                                );
                                setParameters(updated);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        </div>
                        <FormItem>
                          <FormLabel>Default Value</FormLabel>
                          <FormControl>
                            <Input
                              value={param.defaultValue}
                              onChange={(e) => {
                                const updated = parameters.map((p) =>
                                  p.id === param.id ? { ...p, defaultValue: e.target.value } : p
                                );
                                setParameters(updated);
                              }}
                              placeholder="Default value"
                            />
                          </FormControl>
                        </FormItem>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeParameter(param.id)}
                        >
                          Remove Parameter
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Tool"}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Tools;
