import { z } from 'zod';

export interface ToolParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: string;
}

export const toolFormSchema = z.object({
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

export type ToolFormValues = z.infer<typeof toolFormSchema>;
