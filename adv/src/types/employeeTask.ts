// Task Types
export interface EmployeeTask {
  task_id: number;
  employee_id: number;
  employee?: Employee;
  task_type: string;
  task_name: string;
  description: string;
  due_date: string;
  completed_date?: string;
  status: string;
  assigned_by: number;
  assigner?: Employee;
  priority: string;
  category: string;
}
