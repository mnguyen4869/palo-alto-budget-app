import sqlite3
from typing import Annotated, Any, Sequence

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select

from data.data_models import User, Transaction

app = FastAPI()

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"Hello": "poop"}

@app.post("/user/")
def create_user(user: User, session: SessionDep) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.get("/users/")
def get_users(
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
) -> Sequence[User]:
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users

@app.post("/transaction/")
def add_transaction(transaction: Transaction, session: SessionDep) -> Transaction:
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@app.get("/transactions/")
def get_transactions(
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
) -> Sequence[Transaction]:
    transactions = session.exec(select(Transaction).offset(offset).limit(limit)).all()
    return transactions

@app.post("plaid/transaction/")
def add_plaid_transaction(plaidTransaction: dict[str, Any], session: SessionDep) -> Transaction:
    # TODO: Parse Plaid transaction and creat a Transaction class with its info
    # not modeling the JSON for now because it's too complex
    pass

