import sqlite3
from datetime import timedelta
from typing import Annotated, Any, Sequence

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Field, Session, SQLModel, create_engine, select

from data.data_models import User, Transaction, Goal, Insight, BankAccount
from auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_password_hash,
    oauth2_scheme,
)
from schemas import (
    Token,
    UserCreate,
    UserResponse,
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    InsightCreate,
    InsightResponse,
    TransactionResponse,
)

app = FastAPI(title="Smart Financial Coach API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

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

# Authentication dependency
def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep
) -> User:
    import jwt
    from jwt import PyJWTError
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, "your-secret-key-change-in-production", algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"message": "Smart Financial Coach API", "version": "1.0.0"}

@app.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, session: SessionDep):
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
def read_users_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return current_user

# Goal management endpoints
@app.post("/goals", response_model=GoalResponse)
def create_goal(
    goal_data: GoalCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    db_goal = Goal(**goal_data.dict(), user_id=current_user.id)
    session.add(db_goal)
    session.commit()
    session.refresh(db_goal)
    return db_goal

@app.get("/goals", response_model=list[GoalResponse])
def get_goals(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100
):
    goals = session.exec(
        select(Goal).where(Goal.user_id == current_user.id).offset(offset).limit(limit)
    ).all()
    return goals

@app.get("/goals/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@app.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal_data = goal_update.dict(exclude_unset=True)
    for field, value in goal_data.items():
        setattr(goal, field, value)
    
    from datetime import datetime
    goal.updated_at = datetime.utcnow()
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal

@app.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    session.delete(goal)
    session.commit()
    return {"message": "Goal deleted successfully"}

# Insights endpoints
@app.post("/insights", response_model=InsightResponse)
def create_insight(
    insight_data: InsightCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    db_insight = Insight(**insight_data.dict(), user_id=current_user.id)
    session.add(db_insight)
    session.commit()
    session.refresh(db_insight)
    return db_insight

@app.get("/insights", response_model=list[InsightResponse])
def get_insights(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    unread_only: bool = False
):
    query = select(Insight).where(Insight.user_id == current_user.id)
    if unread_only:
        query = query.where(Insight.is_read == False)
    
    insights = session.exec(query.offset(offset).limit(limit)).all()
    return insights

@app.put("/insights/{insight_id}/read")
def mark_insight_read(
    insight_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    insight = session.exec(
        select(Insight).where(Insight.id == insight_id, Insight.user_id == current_user.id)
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    insight.is_read = True
    session.add(insight)
    session.commit()
    return {"message": "Insight marked as read"}

@app.get("/users/")
def get_users(
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
) -> Sequence[User]:
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users

# Protected transaction endpoints
@app.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
    category: str | None = None
):
    query = select(Transaction).where(Transaction.user_id == current_user.id)
    if category:
        query = query.where(Transaction.categories.contains(category))
    
    transactions = session.exec(query.offset(offset).limit(limit)).all()
    return transactions

@app.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    transaction = session.exec(
        select(Transaction).where(
            Transaction.id == transaction_id, 
            Transaction.user_id == current_user.id
        )
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@app.post("/plaid/transactions")
def sync_plaid_transactions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    # This endpoint would integrate with Plaid to fetch and sync transactions
    # For now, return a placeholder response
    return {"message": "Plaid transaction sync initiated", "status": "pending"}

@app.post("/plaid/transaction")
def add_plaid_transaction(
    plaid_transaction: dict[str, Any], 
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
) -> TransactionResponse:
    # Parse Plaid transaction data
    from decimal import Decimal
    from datetime import datetime
    
    # Extract relevant fields from Plaid transaction
    transaction_data = {
        "user_id": current_user.id,
        "name": plaid_transaction.get("name", "Unknown"),
        "price": Decimal(str(abs(plaid_transaction.get("amount", 0)))),
        "categories": plaid_transaction.get("category", []),
        "merchant_name": plaid_transaction.get("merchant_name", "Unknown"),
        "date_of_transaction": datetime.strptime(
            plaid_transaction.get("date", datetime.now().strftime("%Y-%m-%d")), 
            "%Y-%m-%d"
        ).date(),
        "plaid_transaction_id": plaid_transaction.get("transaction_id"),
        "account_id": plaid_transaction.get("account_id")
    }
    
    # Check if transaction already exists
    existing_transaction = session.exec(
        select(Transaction).where(
            Transaction.plaid_transaction_id == transaction_data["plaid_transaction_id"]
        )
    ).first()
    
    if existing_transaction:
        raise HTTPException(
            status_code=400, 
            detail="Transaction already exists"
        )
    
    db_transaction = Transaction(**transaction_data)
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction

# Bank account linking endpoints
@app.post("/plaid/create_link_token")
def create_link_token(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Create a link token for Plaid Link initialization"""
    # In a real implementation, you would use the Plaid client
    # from plaid_client import plaid_client
    # return plaid_client.create_link_token(str(current_user.id))
    
    # Mock response for now
    return {
        "link_token": "link-sandbox-mock-token",
        "expiration": "2024-01-01T00:00:00Z"
    }

@app.post("/plaid/exchange_token")
def exchange_public_token(
    public_token: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Exchange public token for access token and save bank accounts"""
    # In a real implementation:
    # from plaid_client import plaid_client
    # token_response = plaid_client.exchange_public_token(public_token)
    # accounts_response = plaid_client.get_accounts(token_response['access_token'])
    
    # Mock implementation
    mock_accounts = [
        {
            "account_id": "mock_account_1",
            "name": "Checking Account",
            "type": "depository",
            "subtype": "checking",
            "mask": "1234"
        },
        {
            "account_id": "mock_account_2", 
            "name": "Savings Account",
            "type": "depository",
            "subtype": "savings",
            "mask": "5678"
        }
    ]
    
    # Save accounts to database
    saved_accounts = []
    for account_data in mock_accounts:
        # Check if account already exists
        existing_account = session.exec(
            select(BankAccount).where(
                BankAccount.plaid_account_id == account_data["account_id"]
            )
        ).first()
        
        if not existing_account:
            db_account = BankAccount(
                user_id=current_user.id,
                plaid_account_id=account_data["account_id"],
                account_name=account_data["name"],
                account_type=account_data["type"],
                account_subtype=account_data.get("subtype"),
                institution_name="Mock Bank",
                mask=account_data.get("mask")
            )
            session.add(db_account)
            saved_accounts.append(account_data)
    
    session.commit()
    
    return {
        "message": "Bank accounts linked successfully",
        "accounts": saved_accounts
    }

@app.get("/accounts")
def get_bank_accounts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Get user's linked bank accounts"""
    accounts = session.exec(
        select(BankAccount).where(
            BankAccount.user_id == current_user.id,
            BankAccount.is_active == True
        )
    ).all()
    
    return [
        {
            "id": account.id,
            "account_name": account.account_name,
            "account_type": account.account_type,
            "account_subtype": account.account_subtype,
            "institution_name": account.institution_name,
            "mask": account.mask,
            "created_at": account.created_at
        }
        for account in accounts
    ]

