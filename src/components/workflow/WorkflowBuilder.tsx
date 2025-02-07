
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { WorkflowStep } from "@/types/workflow";
import { cn } from "@/lib/utils";

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string().min(1, "ID is required"),
      name: z.string().min(1, "Step name is required"),
      action: z.string().min(1, "Action is required"),
      parameters: z.record(z.any()),
    })
  ),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

interface WorkflowBuilderProps {
  onSubmit: (values: WorkflowFormValues) => void;
  initialValues?: Partial<WorkflowFormValues>;
  isLoading?: boolean;
}

export function WorkflowBuilder({
  onSubmit,
  initialValues,
  isLoading = false,
}: WorkflowBuilderProps) {
  const defaultStep: WorkflowStep = {
    id: uuidv4(),
    name: "",
    action: "",
    parameters: {},
  };

  const [steps, setSteps] = useState<WorkflowStep[]>(
    initialValues?.steps || [defaultStep]
  );

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      steps: (initialValues?.steps || [defaultStep]).map(step => ({
        id: step.id || uuidv4(),
        name: step.name || "",
        action: step.action || "",
        parameters: step.parameters || {},
      })),
    },
  });

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: uuidv4(),
      name: "",
      action: "",
      parameters: {},
    };
    setSteps([...steps, newStep]);
    form.setValue("steps", [...steps, newStep]);
  };

  const removeStep = (id: string) => {
    const updatedSteps = steps.filter((step) => step.id !== id);
    setSteps(updatedSteps);
    form.setValue("steps", updatedSteps);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Workflow" {...field} />
              </FormControl>
              <FormDescription>
                Give your workflow a descriptive name
              </FormDescription>
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
                <Textarea
                  placeholder="Describe what this workflow does..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add details about the workflow's purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Steps</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className={cn(steps.length === 0 ? "animate-pulse" : "")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>

          {steps.map((step, index) => (
            <Card key={step.id} className="p-4">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium">Step {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-4">
                <FormField
                  control={form.control}
                  name={`steps.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Step Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Process Data" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`steps.${index}.action`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <FormControl>
                        <Input placeholder="transform_data" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`steps.${index}.parameters`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parameters (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={JSON.stringify(field.value, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              field.onChange(parsed);
                            } catch (error) {
                              // Handle invalid JSON
                            }
                          }}
                          placeholder="{}"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Workflow"}
        </Button>
      </form>
    </Form>
  );
}
