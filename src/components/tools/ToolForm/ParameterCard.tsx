import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolParameter } from "../types";

interface ParameterCardProps {
  parameter: ToolParameter;
  onUpdate: (updated: ToolParameter) => void;
  onRemove: (id: string) => void;
}

export function ParameterCard({ parameter, onUpdate, onRemove }: ParameterCardProps) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                value={parameter.name}
                onChange={(e) => onUpdate({ ...parameter, name: e.target.value })}
                placeholder="Parameter name"
              />
            </FormControl>
          </FormItem>
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select
              value={parameter.type}
              onValueChange={(value: 'string' | 'number' | 'boolean') => 
                onUpdate({ ...parameter, type: value })
              }
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
              value={parameter.defaultValue}
              onChange={(e) => onUpdate({ ...parameter, defaultValue: e.target.value })}
              placeholder="Default value"
            />
          </FormControl>
        </FormItem>
        <Button
          type="button"
          variant="destructive"
          onClick={() => onRemove(parameter.id)}
        >
          Remove Parameter
        </Button>
      </div>
    </Card>
  );
}
