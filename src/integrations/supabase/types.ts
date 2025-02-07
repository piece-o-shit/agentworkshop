export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      workflow_execution_logs: {
        Row: {
          id: string;
          workflow_id: string;
          step: number;
          status: 'pending' | 'running' | 'completed' | 'error';
          result: Json;
          error: string | null;
          execution_time: string;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          workflow_id: string;
          step?: number;
          status: 'pending' | 'running' | 'completed' | 'error';
          result?: Json;
          error?: string;
          execution_time?: string;
          metadata?: Json;
        };
        Update: {
          workflow_id?: string;
          step?: number;
          status?: 'pending' | 'running' | 'completed' | 'error';
          result?: Json;
          error?: string;
          execution_time?: string;
          metadata?: Json;
        };
      };
      documents: {
        Row: {
          id: number;
          content: string;
          metadata: Json;
          embedding: number[];
        };
        Insert: {
          content: string;
          metadata?: Json;
          embedding: number[];
        };
        Update: {
          content?: string;
          metadata?: Json;
          embedding?: number[];
        };
      };
      workflows: {
        Row: {
          id: string;
          name: string;
          description: string;
          steps: Json;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string;
          config: Json;
        };
        Insert: {
          name: string;
          description?: string;
          steps: Json;
          status?: string;
          config?: Json;
        };
        Update: {
          name?: string;
          description?: string;
          steps?: Json;
          status?: string;
          config?: Json;
        };
      };
      scheduled_workflows: {
        Row: {
          id: string;
          workflow_id: string;
          name: string;
          description: string | null;
          schedule: string;
          last_run: string | null;
          next_run: string | null;
          status: 'active' | 'paused' | 'error';
          config: {
            max_retries?: number;
            timeout?: number;
            notifications?: boolean;
          };
          created_at: string;
          updated_at: string;
          created_by: string;
          error_count: number;
          last_error: string | null;
          metadata: Json;
        };
        Insert: {
          workflow_id: string;
          name: string;
          description?: string;
          schedule: string;
          status?: 'active' | 'paused' | 'error';
          config?: {
            max_retries?: number;
            timeout?: number;
            notifications?: boolean;
          };
          metadata?: Json;
        };
        Update: {
          workflow_id?: string;
          name?: string;
          description?: string;
          schedule?: string;
          status?: 'active' | 'paused' | 'error';
          config?: {
            max_retries?: number;
            timeout?: number;
            notifications?: boolean;
          };
          metadata?: Json;
        };
      };
    };
    Views: {
      pending_workflow_executions: {
        Row: {
          id: string;
          workflow_id: string;
          name: string;
          next_run: string;
          config: Json;
          steps: Json;
          created_by: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "pending_workflow_executions_workflow_id_fkey";
            columns: ["workflow_id"];
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Enums: {
      workflow_execution_status: 'pending' | 'running' | 'completed' | 'error';
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
