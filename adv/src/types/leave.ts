// Leave Types 
export interface LeaveApplication { leave_id: number; employee_id: number; employee?: Employee; leave_type_id: number; leave_type?: LeaveType; start_date: string; end_date: string; days_applied: number; reason: string; status: string; applied_on: string; approved_by?: number; approver?: Employee; approved_on?: string; comments?: string; } 
export interface LeaveType { type_id: number; name: string; code: string; days_allowed: number; is_paid: boolean; } 
export interface LeaveBalance { balance_id: number; employee_id: number; leave_type_id: number; year: number; total_days: number; used_days: number; remaining_days: number; carried_forward: number; } 
