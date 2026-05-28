"""AI Data Access Layer - provides role-based database queries for AI only."""
from sqlalchemy.orm import Session
from app.db.models import (
    User, Department, LeaveRequest, Attendance, Payslip, 
    PerformanceGoal, OnboardingEmployee, AuditLog, Announcement,
    AppraisalCycle, Holiday, LeaveBalance, RecruitmentJob, Kudos
)
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

class AIDataAccess:
    """Role-based data access for AI - ensures AI only sees data user is authorized to see."""
    
    def __init__(self, user: User, db: Session):
        self.user = user
        self.db = db
        self.role = user.role.name if user.role else "staff"
    
    def _check_permission(self, required_role: str) -> bool:
        """Check if user has permission to access data for this role."""
        role_hierarchy = {
            "super_admin": 10,
            "admin": 9,
            "director": 8,
            "hr": 7,
            "hr_staff": 6,
            "accountant": 5,
            "manager": 4,
            "faculty": 3,
            "staff": 2,
            "user": 1
        }
        user_level = role_hierarchy.get(self.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        return user_level >= required_level
    
    def get_my_leave_balance(self) -> Optional[Dict[str, Any]]:
        """Get current user's leave balance."""
        balance = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == self.user.id
        ).first()
        
        if not balance:
            return None
        
        return {
            "annual_total": balance.annual_total,
            "annual_used": balance.annual_used,
            "annual_remaining": balance.annual_total - balance.annual_used,
            "casual_total": balance.casual_total,
            "casual_used": balance.casual_used,
            "casual_remaining": balance.casual_total - balance.casual_used,
            "sick_total": balance.sick_total,
            "sick_used": balance.sick_used,
            "sick_remaining": balance.sick_total - balance.sick_used,
        }
    
    def get_my_leave_requests(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get current user's leave requests."""
        query = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == self.user.id
        )
        
        if status:
            query = query.filter(LeaveRequest.status == status.upper())
        
        requests = query.all()
        
        return [
            {
                "id": r.id,
                "type": r.leave_type,
                "status": r.status,
                "start_date": r.start_date.isoformat() if r.start_date else None,
                "end_date": r.end_date.isoformat() if r.end_date else None,
                "days_count": r.no_of_days,
                "reason": r.reason,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in requests
        ]
    
    def get_my_attendance(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get current user's recent attendance records."""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        records = self.db.query(Attendance).filter(
            Attendance.employee_id == self.user.id,
            Attendance.date >= start_date
        ).all()
        
        return [
            {
                "date": r.date.isoformat() if r.date else None,
                "status": r.status,
                "check_in": r.check_in.isoformat() if r.check_in else None,
                "check_out": r.check_out.isoformat() if r.check_out else None
            }
            for r in records
        ]
    
    def get_my_payslips(self, months: int = 6) -> List[Dict[str, Any]]:
        """Get current user's recent payslips."""
        payslips = self.db.query(Payslip).filter(
            Payslip.employee_id == self.user.id
        ).order_by(Payslip.month.desc()).limit(months).all()
        
        return [
            {
                "month": str(p.month),
                "status": p.status,
                "basic_salary": float(p.basic_salary) if p.basic_salary else 0,
                "deductions": float(p.deductions) if p.deductions else 0,
                "net_salary": float(p.net_salary) if p.net_salary else 0,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in payslips
        ]
    
    def get_my_performance_goals(self) -> List[Dict[str, Any]]:
        """Get current user's performance goals."""
        goals = self.db.query(PerformanceGoal).filter(
            PerformanceGoal.employee_id == self.user.id
        ).all()
        
        return [
            {
                "title": g.title,
                "description": g.description,
                "status": g.status,
                "progress": g.progress,
                "target_date": g.target_date.isoformat() if g.target_date else None,
                "created_at": g.created_at.isoformat() if g.created_at else None
            }
            for g in goals
        ]
    
    def get_my_profile(self) -> Dict[str, Any]:
        """Get current user's profile information."""
        return {
            "id": self.user.id,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "email": self.user.email,
            "phone": self.user.phone,
            "role": self.role,
            "status": self.user.status,
            "department": self.user.department.name if self.user.department else None,
            "joined_date": self.user.created_at.isoformat() if self.user.created_at else None
        }
    
    def get_team_leave_requests(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get team leave requests (only if user is manager or HR)."""
        if not self._check_permission("manager"):
            return []
        
        if self.role == "manager":
            # Get direct reports' leave
            team_members = self.db.query(User).filter(
                User.reporting_manager_id == self.user.id
            ).all()
            member_ids = [m.id for m in team_members]
        else:
            # HR can see all leaves
            member_ids = None
        
        query = self.db.query(LeaveRequest)
        if member_ids:
            query = query.filter(LeaveRequest.employee_id.in_(member_ids))
        
        if status:
            query = query.filter(LeaveRequest.status == status.upper())
        
        requests = query.all()
        
        return [
            {
                "id": r.id,
                "employee": f"{r.employee.first_name} {r.employee.last_name}" if r.employee else "Unknown",
                "type": r.leave_type,
                "status": r.status,
                "start_date": r.start_date.isoformat() if r.start_date else None,
                "end_date": r.end_date.isoformat() if r.end_date else None,
                "days_count": r.no_of_days
            }
            for r in requests
        ]
    
    def get_team_performance(self) -> List[Dict[str, Any]]:
        """Get team performance data (only if user is manager or HR)."""
        if not self._check_permission("manager"):
            return []
        
        if self.role == "manager":
            team_members = self.db.query(User).filter(
                User.reporting_manager_id == self.user.id
            ).all()
            member_ids = [m.id for m in team_members]
        else:
            member_ids = None
        
        query = self.db.query(PerformanceGoal)
        if member_ids:
            query = query.filter(PerformanceGoal.employee_id.in_(member_ids))
        
        goals = query.all()
        
        return [
            {
                "employee": f"{g.employee.first_name} {g.employee.last_name}" if g.employee else "Unknown",
                "goal": g.title,
                "progress": g.progress,
                "status": g.status
            }
            for g in goals
        ]
    
    def get_announcements(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent announcements."""
        announcements = self.db.query(Announcement).order_by(
            Announcement.created_at.desc()
        ).limit(limit).all()
        
        return [
            {
                "title": a.title,
                "content": a.content[:200],
                "priority": a.priority,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in announcements
        ]
    
    def get_upcoming_holidays(self, days: int = 90) -> List[Dict[str, Any]]:
        """Get upcoming company holidays."""
        now = datetime.utcnow()
        future = now + timedelta(days=days)
        
        holidays = self.db.query(Holiday).filter(
            Holiday.date >= now,
            Holiday.date <= future
        ).order_by(Holiday.date).all()
        
        return [
            {
                "name": h.name,
                "date": h.date.isoformat() if h.date else None,
                "type": h.holiday_type
            }
            for h in holidays
        ]
    
    def get_kudos_received(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent kudos received by user."""
        kudos_list = self.db.query(Kudos).filter(
            Kudos.to_user_id == self.user.id
        ).order_by(Kudos.created_at.desc()).limit(limit).all()
        
        return [
            {
                "from": k.from_name,
                "message": k.message,
                "created_at": k.created_at.isoformat() if k.created_at else None
            }
            for k in kudos_list
        ]
    
    def get_all_available_data(self) -> Dict[str, Any]:
        """Get all data available to AI for this user."""
        try:
            data = {}
            
            # Safely get each data source with error handling
            try:
                data["profile"] = self.get_my_profile()
            except Exception as e:
                data["profile"] = {"error": str(e)}
            
            try:
                data["leave_balance"] = self.get_my_leave_balance()
            except Exception as e:
                data["leave_balance"] = {"error": str(e)}
            
            try:
                data["my_leaves"] = self.get_my_leave_requests()
            except Exception as e:
                data["my_leaves"] = []
            
            try:
                data["my_attendance"] = self.get_my_attendance()
            except Exception as e:
                data["my_attendance"] = []
            
            try:
                data["my_payslips"] = self.get_my_payslips()
            except Exception as e:
                data["my_payslips"] = []
            
            try:
                data["my_performance_goals"] = self.get_my_performance_goals()
            except Exception as e:
                data["my_performance_goals"] = []
            
            try:
                data["kudos_received"] = self.get_kudos_received()
            except Exception as e:
                data["kudos_received"] = []
            
            try:
                data["announcements"] = self.get_announcements()
            except Exception as e:
                data["announcements"] = []
            
            try:
                data["upcoming_holidays"] = self.get_upcoming_holidays()
            except Exception as e:
                data["upcoming_holidays"] = []
            
            # Add role-based data
            if self._check_permission("manager"):
                try:
                    data["team_leaves"] = self.get_team_leave_requests()
                except Exception as e:
                    data["team_leaves"] = []
                
                try:
                    data["team_performance"] = self.get_team_performance()
                except Exception as e:
                    data["team_performance"] = []
            
            return data
        except Exception as e:
            # Return minimal safe data if everything fails
            return {
                "profile": self.get_my_profile(),
                "error": f"Partial data retrieval: {str(e)}"
            }
