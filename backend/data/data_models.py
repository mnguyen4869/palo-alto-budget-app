from datetime import date
from decimal import Decimal

from sqlmodel import Field, SQLModel, String

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(default=None, index=True)
    name: str

class Transaction(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(default=None, foreign_key="user.id")
    name: str
    price: Decimal
    category: list[str] | None = Field(sa_type=String)
    merchant_name: str
    date_of_transaction: date

