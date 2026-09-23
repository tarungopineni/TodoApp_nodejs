export interface Todo {
  id: number | string;
  title: string;
  description: string;
  priority: number;
  complete: boolean;
  owner_id: number | string;
  task_datetime?: string | null;
  deadline?: string | null;
}

export interface TodoRequest {
  title: string;
  description: string;
  priority: number;
  complete: boolean;
  task_datetime?: string | null;
  deadline?: string | null;
}
