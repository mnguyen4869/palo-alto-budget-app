from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator
from data.data_models import GoalStatus

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
    is_active: bool

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    target_date: Optional[date] = None
    
    @validator('target_date')
    def validate_target_date(cls, v):
        if v and v <= date.today():
            raise ValueError('Target date must be in the future')
        return v

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    target_date: Optional[date] = None
    status: Optional[GoalStatus] = None

class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    target_amount: Decimal
    current_amount: Decimal
    target_date: Optional[date]
    status: GoalStatus
    created_at: datetime
    updated_at: datetime

class InsightCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    insight_type: str = Field(default="general", max_length=50)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)

class InsightResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    insight_type: str
    confidence_score: Optional[float]
    created_at: datetime
    is_read: bool

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    name: str
    price: Decimal
    category_primary: Optional[str]
    category_detailed: Optional[str]
    category_confidence_level: Optional[str]
    category_icon_url: Optional[str]
    merchant_name: str
    logo_url: Optional[str]
    date_of_transaction: date
    plaid_transaction_id: Optional[str]
    account_id: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True