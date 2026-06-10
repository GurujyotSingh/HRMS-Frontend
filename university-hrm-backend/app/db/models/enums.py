from enum import Enum as PyEnum


class LeaveStatus(str, PyEnum):
    PENDING          = "PENDING"           # waiting for HOD (or HR if applicant is HOD)
    APPROVED_BY_HOD  = "APPROVED_BY_HOD"  # HOD approved, waiting for HR final decision
    APPROVED         = "APPROVED"          # HR approved, balance deducted
    REJECTED         = "REJECTED"          # rejected by HOD or HR (final)
    CANCELLED        = "CANCELLED"         # withdrawn by employee before any approval


class LeaveType(str, PyEnum):
    CASUAL  = "CASUAL"
    SICK    = "SICK"
    EARNED  = "EARNED"
    UNPAID  = "UNPAID"