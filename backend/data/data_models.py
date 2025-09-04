from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel, String, Column, Text

class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

class Transaction(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    price: Decimal
    category_primary: str | None = Field(default=None)  # Primary category from Plaid
    category_detailed: str | None = Field(default=None)  # Detailed category from Plaid
    category_confidence_level: str | None = Field(default=None)  # Confidence level from Plaid
    category_icon_url: str | None = Field(default=None)  # Icon URL from Plaid
    merchant_name: str | None = Field(default=None)
    logo_url: str | None = Field(default=None)  # Merchant logo URL from Plaid
    date_of_transaction: date
    plaid_transaction_id: str | None = Field(default=None, unique=True)
    account_id: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Goal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    description: str | None = Field(default=None)
    target_amount: Decimal
    current_amount: Decimal = Field(default=Decimal("0.00"))
    target_date: date | None = Field(default=None)
    status: GoalStatus = Field(default=GoalStatus.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Insight(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str
    message: str = Field(sa_column=Column(Text))
    insight_type: str = Field(default="general")
    confidence_score: float | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = Field(default=False)

class BankAccount(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    plaid_account_id: str = Field(unique=True)
    account_name: str
    account_type: str
    account_subtype: str | None = Field(default=None)
    institution_name: str
    mask: str | None = Field(default=None)
    access_token: str | None = Field(default=None)  # In production, this should be encrypted
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

