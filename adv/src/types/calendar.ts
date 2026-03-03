// Calendar Types
export interface CalendarEvent {
  event_id: number;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day: boolean;
  created_by: number;
  creator?: Employee;
  attendees?: number[];
}

export interface Holiday {
  holiday_id: number;
  name: string;
  date: string;
  type: string;
  is_paid: boolean;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  priority: string;
}
