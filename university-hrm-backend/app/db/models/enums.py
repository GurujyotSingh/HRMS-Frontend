from enum import Enum as PyEnum


class LeaveStatus(str, PyEnum):
    PENDING          = "pending"           # waiting for HOD (or HR if applicant is HOD)
    APPROVED_BY_HOD  = "approved_by_hod"  # HOD approved, waiting for HR final decision
    APPROVED         = "approved"          # HR approved, balance deducted
    REJECTED         = "rejected"          # rejected by HOD or HR (final)
    CANCELLED        = "cancelled"         # withdrawn by employee before any approval


class LeaveType(str, PyEnum):
    CASUAL  = "casual"
    SICK    = "sick"
    EARNED  = "earned"
    UNPAID  = "unpaid"