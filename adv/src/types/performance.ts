// Performance Types
export interface PerformanceReview {
  review_id: number;
  employee_id: number;
  employee?: Employee;
  reviewer_id: number;
  reviewer?: Employee;
  review_period: string;
  review_date?: string;
  overall_rating?: number;
  comments?: string;
  goals?: string;
  achievements?: string;
  areas_for_improvement?: string;
  status: string;
}

export interface PerformanceRating {
  rating_id: number;
  review_id: number;
  criteria: string;
  rating: number;
  weight: number;
  comments?: string;
}
