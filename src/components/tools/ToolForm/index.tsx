import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParameterCard } from "./ParameterCard";
import { ToolParameter, ToolFormValues, toolFormSchema } from "../types";

interface ToolFormProps {
  onSubmit: (data: ToolFormValues) => void;
  isLoading?: boolean;
}

export function ToolForm({ onSubmit, isLoading }: ToolFormProps) {
  const [parameters, setParameters] = useState<ToolParameter[]>([]);

  const form = useForm<ToolFormValues>({
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

  const updateParameter = (updated: ToolParameter) => {
    setParameters(parameters.map(p => p.id === updated.id ? updated : p));
  };

  const removeParameter = (id: string) => {
    setParameters(parameters.filter(p => p.id !== id));
  };

  const handleSubmit = (data: ToolFormValues) => {
    onSubmit({
      ...data,
      config: {
        ...data.config,
        parameters
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
            <ParameterCard
              key={param.id}
              parameter={param}
              onUpdate={updateParameter}
              onRemove={removeParameter}
            />
          ))}
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Tool"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
