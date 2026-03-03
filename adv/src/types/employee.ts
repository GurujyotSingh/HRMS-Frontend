// Employee Types 
export interface Employee { emp_id: number; name: string; email: string; department_id: number; department?: Department; manager_id?: number; manager?: Employee; academic_rank: string; hire_date: string; status: string; phone: string; address: string; emergency_contact: string; skills?: string[]; competencies?: string[]; } 
export interface Department { dept_id: number; name: string; code: string; head_id?: number; head?: Employee; budget: number; } 
