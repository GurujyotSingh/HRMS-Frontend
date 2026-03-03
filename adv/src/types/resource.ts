// Resource Types
export interface ResourceBooking {
  booking_id: number;
  resource_type: string;
  resource_id: number;
  booked_by: number;
  employee?: Employee;
  start_datetime: string;
  end_datetime: string;
  purpose: string;
  status: string;
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
  condition: string;
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
  status: string;
  approved_by?: number;
  approver?: Employee;
  approved_on?: string;
  comments?: string;
}
