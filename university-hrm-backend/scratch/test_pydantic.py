from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    assigned_to: str = "EMPLOYEE"
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class DummyORM:
    def __init__(self):
        self.id = "1"
        self.title = "Test"
        self.description = None
        self.is_completed = False
        self.completed_at = None

orm_obj = DummyORM()
try:
    print(TaskOut.model_validate(orm_obj))
except Exception as e:
    print("Error:", e)
