export interface ResourceBooking {
  booking_id: number;
  resource_type: 'Room' | 'Equipment' | 'Vehicle';
  resource_id: number;
  booked_by: number;
  employee?: Employee;
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
  approved_by?: number;
  approver?: Employee;
}

export interface Room {
  room_id: number;
  name: string;
  capacity: number;
  location: string;
  facilities: string[];
  is_available: boolean;
}

export interface Equipment {
  equipment_id: number;
  name: string;
  type: string;
  serial_number: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'UnderRepair';
  location: string;
  is_available: boolean;
}

export interface TravelClaim {
  claim_id: number;
  employee_id: number;
  employee?: Employee;
  purpose: string;
  destination: string;
  start_date: string;
  end_date: string;
  estimated_amount: number;
  actual_amount?: number;
  receipts?: string[];
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Paid';
  approved_by?: number;
  approver?: Employee;
  approved_on?: string;
  comments?: string;
}

export interface Employee {
  emp_id: number;
  name: string;
  department?: string;
}