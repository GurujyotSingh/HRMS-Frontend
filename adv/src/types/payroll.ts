// Payroll Types
export interface Payroll {
  payroll_id: number;
  employee_id: number;
  employee?: Employee;
  month: number;
  year: number;
  basic_salary: number;
  allowances: any[];
  deductions: any[];
  gross_pay: number;
  net_pay: number;
  payment_date?: string;
  payment_method: string;
  status: string;
  notes?: string;
}

export interface Allowance {
  allowance_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export interface Deduction {
  deduction_id: number;
  name: string;
  amount: number;
  is_mandatory: boolean;
}

export interface TaxDetail {
  tax_id: number;
  employee_id: number;
  financial_year: string;
  pan_number: string;
  total_income: number;
  total_deductions: number;
  taxable_income: number;
  tax_amount: number;
  rebate?: number;
  net_tax: number;
}
