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
from ai_insights import FinancialInsightsEngine, GoalForecastingEngine
from security import SecurityManager, InputValidator, RateLimiter
from plaid_client import plaid_client

def extract_plaid_category_data(personal_finance_category: dict) -> dict:
    """Extract all category data from Plaid personal finance category"""
    if not personal_finance_category:
        return {
            "primary": None,
            "detailed": None,
            "confidence_level": None,
            "icon_url": None
        }
    
    return {
        "primary": personal_finance_category.get('primary'),
        "detailed": personal_finance_category.get('detailed'),
        "confidence_level": personal_finance_category.get('confidence_level'),
        "icon_url": personal_finance_category.get('icon_url')
    }

app = FastAPI(title="Smart Financial Coach API", version="1.0.0")

# Initialize security components
security_manager = SecurityManager()
input_validator = InputValidator()
rate_limiter = RateLimiter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
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
    # Validate and sanitize input
    validated_email = input_validator.validate_email(user_data.email)
    input_validator.validate_password(user_data.password)
    sanitized_name = input_validator.sanitize_string(user_data.name, max_length=100)
    
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.email == validated_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=validated_email,
        name=sanitized_name,
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
        # Search in both primary and detailed categories
        query = query.where(
            (Transaction.category_primary.contains(category)) | 
            (Transaction.category_detailed.contains(category))
        )
    
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
    """Fetch and sync transactions from all linked Plaid accounts"""
    try:
        # Get all active bank accounts for the user
        bank_accounts = session.exec(
            select(BankAccount).where(
                BankAccount.user_id == current_user.id,
                BankAccount.is_active == True,
                BankAccount.access_token.isnot(None)
            )
        ).all()
        
        if not bank_accounts:
            raise HTTPException(
                status_code=400,
                detail="No linked bank accounts found"
            )
        
        synced_transactions = []
        
        for bank_account in bank_accounts:
            # Fetch transactions from Plaid
            transactions_response = plaid_client.get_transactions(bank_account.access_token)
            transactions = transactions_response.get('transactions', [])
            print(transactions_response)
            
            for plaid_transaction in transactions:
                # Check if transaction already exists
                existing_transaction = session.exec(
                    select(Transaction).where(
                        Transaction.plaid_transaction_id == plaid_transaction.get('transaction_id')
                    )
                ).first()
                
                if not existing_transaction:
                    # Create new transaction
                    from decimal import Decimal
                    import json
                    
                    # In Plaid API: positive = expenses, negative = income
                    # We now store amounts as they come from Plaid (positive for expenses, negative for income)
                    plaid_amount = plaid_transaction.get('amount', 0)
                    
                    # Extract all category data from Plaid
                    category_data = extract_plaid_category_data(plaid_transaction.get('personal_finance_category', {}))
                    
                    db_transaction = Transaction(
                        user_id=current_user.id,
                        name=plaid_transaction.get('name', 'Unknown'),
                        price=Decimal(str(plaid_amount)),  # Store as-is from Plaid API
                        category_primary=category_data.get('primary'),
                        category_detailed=category_data.get('detailed'),
                        category_confidence_level=category_data.get('confidence_level'),
                        category_icon_url=category_data.get('icon_url'),
                        merchant_name=plaid_transaction.get('merchant_name') or plaid_transaction.get('name') or 'Unknown Merchant',
                        logo_url=plaid_transaction.get('logo_url'),  # Merchant logo URL from Plaid
                        date_of_transaction=plaid_transaction.get('date'),
                        plaid_transaction_id=plaid_transaction.get('transaction_id'),
                        account_id=plaid_transaction.get('account_id')
                    )
                    session.add(db_transaction)
                    synced_transactions.append(plaid_transaction.get('transaction_id'))
        
        session.commit()
        
        # Auto-generate insights after syncing transactions
        insights_generated = 0
        if len(synced_transactions) > 0:
            try:
                insights_engine = FinancialInsightsEngine(session)
                insights = insights_engine.generate_user_insights(current_user.id)
                insights_generated = len(insights)
            except Exception as e:
                print(f"Warning: Failed to generate insights after sync: {e}")
        
        return {
            "message": f"Successfully synced {len(synced_transactions)} transactions",
            "transaction_count": len(synced_transactions),
            "insights_generated": insights_generated,
            "status": "completed"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync transactions: {str(e)}"
        )

@app.post("/plaid/transaction")
def add_plaid_transaction(
    plaid_transaction: dict[str, Any], 
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
) -> TransactionResponse:
    # Parse Plaid transaction data
    from decimal import Decimal
    from datetime import datetime
    import json
    
    # Extract all category data from Plaid
    category_data = extract_plaid_category_data(plaid_transaction.get('personal_finance_category', {}))
    
    # Extract relevant fields from Plaid transaction
    transaction_data = {
        "user_id": current_user.id,
        "name": plaid_transaction.get("name", "Unknown"),
        "price": Decimal(str(plaid_transaction.get("amount", plaid_transaction.get("price", 0)))),  # Store as-is from Plaid API
        "category_primary": category_data.get('primary'),
        "category_detailed": category_data.get('detailed'),
        "category_confidence_level": category_data.get('confidence_level'),
        "category_icon_url": category_data.get('icon_url'),
        "merchant_name": plaid_transaction.get("merchant_name", "Unknown"),
        "logo_url": plaid_transaction.get("logo_url"),  # Merchant logo URL from Plaid
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
    try:
        result = plaid_client.create_link_token(str(current_user.id))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create link token: {str(e)}"
        )

@app.post("/plaid/exchange_token")
def exchange_public_token(
    public_token: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Exchange public token for access token and save bank accounts"""
    try:
        # Exchange public token for access token
        token_response = plaid_client.exchange_public_token(public_token)
        access_token = token_response['access_token']
        
        # Get accounts information
        accounts_response = plaid_client.get_accounts(access_token)
        accounts = accounts_response.get('accounts', [])
        
        # Save access token and accounts to database (you'd want to encrypt the access token in production)
        saved_accounts = []
        for account_data in accounts:
            # Check if account already exists
            existing_account = session.exec(
                select(BankAccount).where(
                    BankAccount.plaid_account_id == account_data.get("account_id")
                )
            ).first()
            
            if not existing_account:
                db_account = BankAccount(
                    user_id=current_user.id,
                    plaid_account_id=account_data.get("account_id"),
                    account_name=account_data.get("name", "Unknown Account"),
                    account_type=account_data.get("type", "unknown"),
                    account_subtype=account_data.get("subtype"),
                    institution_name=accounts_response.get("item", {}).get("institution_id", "Unknown Bank"),
                    mask=account_data.get("mask"),
                    access_token=access_token  # In production, encrypt this!
                )
                session.add(db_account)
                saved_accounts.append({
                    "account_id": account_data.get("account_id"),
                    "name": account_data.get("name"),
                    "type": account_data.get("type"),
                    "subtype": account_data.get("subtype"),
                    "mask": account_data.get("mask")
                })
        
        session.commit()
        
        return {
            "message": "Bank accounts linked successfully",
            "accounts": saved_accounts
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exchange token: {str(e)}"
        )

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
            "created_at": account.created_at,
            "is_active": account.is_active
        }
        for account in accounts
    ]

@app.delete("/accounts/{account_id}")
def remove_bank_account(
    account_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Remove/deactivate a bank account connection"""
    account = session.exec(
        select(BankAccount).where(
            BankAccount.id == account_id,
            BankAccount.user_id == current_user.id
        )
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )
    
    # Deactivate the account instead of deleting it to preserve transaction history
    account.is_active = False
    session.add(account)
    session.commit()
    
    return {
        "message": "Bank account disconnected successfully",
        "account_id": account_id
    }

def _analyze_income_patterns(transactions, bank_accounts):
    """Analyze transaction patterns to identify income sources"""
    from collections import defaultdict
    from datetime import datetime, timedelta
    import statistics
    import re
    from difflib import SequenceMatcher
    
    def normalize_merchant_name(name):
        """Normalize merchant name for comparison"""
        if not name:
            return "unknown"
        # Remove common suffixes and normalize
        name = re.sub(r'\s+(inc|corp|llc|ltd|company|co|payroll|ppd|id|payment|pay)\b', '', name.lower())
        name = re.sub(r'[^\w\s]', '', name)  # Remove punctuation
        name = re.sub(r'\s+', ' ', name).strip()  # Normalize whitespace
        return name
    
    def are_similar_sources(name1, name2, amount1, amount2, tolerance=0.1):
        """Check if two income sources are likely the same"""
        # Normalize names for comparison
        norm1 = normalize_merchant_name(name1)
        norm2 = normalize_merchant_name(name2)
        
        # Check name similarity (using sequence matching)
        name_similarity = SequenceMatcher(None, norm1, norm2).ratio()
        
        # Check amount similarity (within tolerance)
        amount_diff = abs(amount1 - amount2) / max(amount1, amount2) if max(amount1, amount2) > 0 else 0
        amount_similar = amount_diff <= tolerance
        
        # Consider similar if:
        # 1. Names are very similar (>= 0.8) OR
        # 2. Names are somewhat similar (>= 0.6) AND amounts are similar
        return (name_similarity >= 0.8) or (name_similarity >= 0.6 and amount_similar)
    
    # Group transactions by merchant_name initially
    merchant_groups = defaultdict(list)
    
    for transaction in transactions:
        merchant_name = transaction.merchant_name or "Unknown"
        merchant_groups[merchant_name].append(transaction)
    
    # Merge similar income sources
    merged_groups = {}
    processed_merchants = set()
    
    for merchant_name, transactions_list in merchant_groups.items():
        if merchant_name in processed_merchants:
            continue
            
        if len(transactions_list) < 2:  # Skip merchants with too few transactions
            continue
            
        # Calculate average amount for this merchant
        avg_amount = statistics.mean([abs(float(t.price)) for t in transactions_list])
        
        # Check if this merchant is similar to any already processed
        merged_with = None
        for existing_merchant in merged_groups.keys():
            existing_avg = statistics.mean([abs(float(t.price)) for t in merged_groups[existing_merchant]])
            
            if are_similar_sources(merchant_name, existing_merchant, avg_amount, existing_avg):
                merged_with = existing_merchant
                break
        
        if merged_with:
            # Merge with existing group
            merged_groups[merged_with].extend(transactions_list)
            processed_merchants.add(merchant_name)
        else:
            # Create new group (use the cleaner name if possible)
            clean_name = merchant_name
            # Prefer shorter, cleaner names
            for other_merchant, other_transactions in merchant_groups.items():
                if other_merchant != merchant_name and len(other_transactions) >= 2:
                    other_avg = statistics.mean([abs(float(t.price)) for t in other_transactions])
                    if are_similar_sources(merchant_name, other_merchant, avg_amount, other_avg):
                        # Choose the cleaner name
                        if len(normalize_merchant_name(other_merchant)) < len(normalize_merchant_name(clean_name)):
                            clean_name = other_merchant
            
            merged_groups[clean_name] = transactions_list
            processed_merchants.add(merchant_name)
    
    income_streams = []
    
    # Analyze each merged merchant group
    for merchant_name, merchant_transactions in merged_groups.items():
        if len(merchant_transactions) < 2:  # Need at least 2 transactions for pattern analysis
            continue
            
        # Calculate amounts (convert negative income to positive)
        amounts = [abs(float(t.price)) for t in merchant_transactions]
        
        # Check for consistency in amounts (income sources usually have regular amounts)
        avg_amount = statistics.mean(amounts)
        amount_variance = statistics.variance(amounts) if len(amounts) > 1 else 0
        
        # Skip if amounts are too inconsistent (variance > 20% of mean)
        if amount_variance > (avg_amount * 0.2) ** 2:
            continue
            
        # Calculate frequency
        dates = [datetime.fromisoformat(t.date_of_transaction.replace('Z', '+00:00') if 'Z' in t.date_of_transaction else t.date_of_transaction) for t in merchant_transactions]
        dates.sort()
        
        # Calculate intervals between transactions
        if len(dates) > 1:
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            avg_interval = statistics.mean(intervals)
            
            # Determine frequency
            if avg_interval <= 10:
                frequency = "Weekly"
                monthly_income = avg_amount * 4.33  # ~4.33 weeks per month
            elif avg_interval <= 40:
                frequency = "Monthly"
                monthly_income = avg_amount
            elif avg_interval <= 100:
                frequency = "Bi-monthly" 
                monthly_income = avg_amount * 0.5
            else:
                frequency = "Irregular"
                monthly_income = avg_amount * (30 / avg_interval)  # Estimate based on average interval
                
            # Calculate confidence based on regularity and sample size
            interval_consistency = 1 - (statistics.variance(intervals) / (avg_interval ** 2)) if len(intervals) > 1 else 1
            sample_confidence = min(len(merchant_transactions) / 5.0, 1.0)  # Higher confidence with more samples
            confidence = interval_consistency * sample_confidence * 0.8  # Max 80% confidence
            
            # Only include streams with reasonable confidence
            if confidence > 0.3:
                income_streams.append({
                    "account_id": 'general_account',  # Simplified since we're not showing account info
                    "account_name": "",  # Empty since we're not displaying this
                    "name": merchant_name,  # This is the merchant/income source name
                    "monthly_income": round(monthly_income, 2),
                    "confidence": round(confidence, 2),
                    "days_available": (max(dates) - min(dates)).days + 1,
                    "frequency": frequency
                })
    
    # Sort by monthly income (highest first)
    income_streams.sort(key=lambda x: x["monthly_income"], reverse=True)
    
    return income_streams


@app.post("/plaid/income")
def sync_plaid_income(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Analyze income data from transaction patterns"""
    try:
        # Get all active bank accounts for the user
        bank_accounts = session.exec(
            select(BankAccount).where(
                BankAccount.user_id == current_user.id,
                BankAccount.is_active == True,
                BankAccount.access_token.isnot(None)
            )
        ).all()
        
        if not bank_accounts:
            raise HTTPException(
                status_code=400,
                detail="No linked bank accounts found"
            )
        
        # Get user transactions for income analysis
        transactions = session.exec(
            select(Transaction).where(
                Transaction.user_id == current_user.id,
                Transaction.price < 0  # Negative transactions are income (Plaid API convention)
            ).order_by(Transaction.date_of_transaction.desc())
        ).all()
        
        if not transactions:
            return {
                "message": "No transaction data available for income analysis",
                "income_streams": [],
                "total_monthly_income": 0,
                "stream_count": 0
            }
        
        # Analyze income patterns
        income_data = _analyze_income_patterns(transactions, bank_accounts)
        
        # Calculate summary statistics
        total_monthly_income = sum(
            stream.get('monthly_income', 0) for stream in income_data
            if stream.get('monthly_income') is not None
        )
        
        return {
            "message": f"Successfully analyzed {len(income_data)} potential income streams from {len(transactions)} transactions",
            "income_streams": income_data,
            "total_monthly_income": total_monthly_income,
            "stream_count": len(income_data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze income data: {str(e)}"
        )

@app.post("/income/analysis")
def analyze_income_patterns(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Analyze income patterns from user's transactions (doesn't require bank accounts)"""
    try:
        # Get user transactions for income analysis
        transactions = session.exec(
            select(Transaction).where(
                Transaction.user_id == current_user.id,
                Transaction.price < 0  # Negative transactions are income (Plaid API convention)
            ).order_by(Transaction.date_of_transaction.desc())
        ).all()
        
        if not transactions:
            return {
                "message": "No income transactions found",
                "income_streams": [],
                "total_monthly_income": 0,
                "stream_count": 0
            }
        
        # Create mock bank accounts list for compatibility with existing function
        class MockAccount:
            def __init__(self, plaid_account_id, account_name):
                self.plaid_account_id = plaid_account_id
                self.account_name = account_name
        
        mock_accounts = [MockAccount("general_account", "Account")]
        
        # Use existing income analysis logic
        income_data = _analyze_income_patterns(transactions, mock_accounts)
        
        # Calculate summary statistics
        total_monthly_income = sum(
            stream.get('monthly_income', 0) for stream in income_data
            if stream.get('monthly_income') is not None
        )
        
        return {
            "message": f"Successfully analyzed {len(income_data)} potential income streams from {len(transactions)} income transactions",
            "income_streams": income_data,
            "total_monthly_income": total_monthly_income,
            "stream_count": len(income_data)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze income patterns: {str(e)}"
        )


def _analyze_income_patterns(transactions, bank_accounts):
    """Analyze transactions to identify potential income streams"""
    from collections import defaultdict
    from datetime import timedelta, datetime
    import statistics
    
    # Group transactions by merchant/source
    income_groups = defaultdict(list)
    
    # Create a lookup for account names
    account_lookup = {acc.plaid_account_id: acc.account_name for acc in bank_accounts}
    
    for trans in transactions:
        # Skip small amounts that are unlikely to be income (note: amounts are negative for income)
        if abs(trans.price) < 50:
            continue
            
        # Group by merchant name and approximate amount (to handle slight variations)
        key = (
            trans.merchant_name.lower().strip(),
            round(float(abs(trans.price)), 0),  # Round to nearest dollar (use absolute value)
            trans.account_id
        )
        income_groups[key].append(trans)
    
    income_streams = []
    
    for (merchant, amount, account_id), trans_list in income_groups.items():
        if len(trans_list) < 2:  # Need at least 2 occurrences to be considered income
            continue
            
        # Sort transactions by date
        trans_list.sort(key=lambda x: x.date_of_transaction)
        
        # Calculate intervals between transactions
        intervals = []
        for i in range(1, len(trans_list)):
            interval = (trans_list[i].date_of_transaction - trans_list[i-1].date_of_transaction).days
            intervals.append(interval)
        
        if not intervals:
            continue
            
        # Calculate average interval and determine frequency
        avg_interval = statistics.mean(intervals)
        
        # Determine if this looks like regular income
        confidence = 0.0
        frequency = "irregular"
        
        if avg_interval <= 35:  # Monthly or more frequent
            if 25 <= avg_interval <= 35:  # Monthly-ish
                frequency = "monthly"
                confidence = 0.8
            elif 12 <= avg_interval <= 16:  # Bi-weekly
                frequency = "bi-weekly"
                confidence = 0.9
            elif 6 <= avg_interval <= 8:  # Weekly
                frequency = "weekly"
                confidence = 0.7
        elif avg_interval <= 95:  # Quarterly-ish
            frequency = "quarterly"
            confidence = 0.6
        
        # Boost confidence for larger, more regular amounts
        if amount >= 1000:  # Likely salary
            confidence = min(confidence + 0.2, 1.0)
        
        # Calculate monthly equivalent income (amount is already positive from abs() in grouping)
        if frequency == "weekly":
            monthly_income = amount * 4.33  # Average weeks per month
        elif frequency == "bi-weekly":
            monthly_income = amount * 2.17  # Average bi-weeks per month
        elif frequency == "monthly":
            monthly_income = amount
        elif frequency == "quarterly":
            monthly_income = amount / 3
        else:
            monthly_income = amount * (30 / avg_interval) if avg_interval > 0 else 0
        
        # Only include if confidence is reasonable and amount is significant
        if confidence >= 0.5 and monthly_income >= 200:
            income_streams.append({
                "account_id": account_id,
                "account_name": account_lookup.get(account_id, "Unknown Account"),
                "name": merchant.title() if merchant != "unknown" else "Regular Deposit",
                "monthly_income": round(monthly_income, 2),
                "confidence": round(confidence, 2),
                "days_available": (trans_list[-1].date_of_transaction - trans_list[0].date_of_transaction).days,
                "frequency": frequency
            })
    
    # Sort by monthly income descending
    income_streams.sort(key=lambda x: x['monthly_income'], reverse=True)
    
    return income_streams

# AI-powered insights endpoints
@app.post("/insights/generate")
def generate_ai_insights(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Generate AI-powered insights based on user's transaction history"""
    insights_engine = FinancialInsightsEngine(session)
    insights = insights_engine.generate_user_insights(current_user.id)
    
    return {
        "message": f"Generated {len(insights)} new insights",
        "insights": [
            {
                "id": insight.id,
                "title": insight.title,
                "message": insight.message,
                "insight_type": insight.insight_type,
                "confidence_score": insight.confidence_score,
                "created_at": insight.created_at,
                "is_read": insight.is_read
            }
            for insight in insights
        ]
    }

@app.get("/insights/subscriptions")
def get_subscription_analysis(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Get detailed analysis of user's subscriptions and recurring charges"""
    insights_engine = FinancialInsightsEngine(session)
    transactions = insights_engine._get_user_transactions(current_user.id)
    
    if not transactions:
        return {"subscriptions": [], "gray_charges": [], "total_monthly": 0}
    
    from collections import defaultdict
    import numpy as np
    
    # Group transactions by merchant and amount
    recurring_patterns = defaultdict(list)
    
    for trans in transactions:
        # Only consider positive transactions (expenses) for subscription detection
        # Negative transactions are income and should not be considered subscriptions
        if float(trans.price) > 0:
            key = (trans.merchant_name.lower().strip(), float(trans.price))
            recurring_patterns[key].append(trans.date_of_transaction)
    
    subscriptions = []
    gray_charges = []
    
    for (merchant, amount), dates in recurring_patterns.items():
        if len(dates) >= 2:
            sorted_dates = sorted(dates)
            intervals = []
            
            for i in range(1, len(sorted_dates)):
                interval = (sorted_dates[i] - sorted_dates[i-1]).days
                intervals.append(interval)
            
            if intervals:
                avg_interval = np.mean(intervals)
                std_interval = np.std(intervals)
                
                is_monthly = 25 <= avg_interval <= 35 and std_interval < 5
                is_weekly = 6 <= avg_interval <= 8 and std_interval < 2
                is_annual = 350 <= avg_interval <= 380 and std_interval < 15
                
                if is_monthly or is_weekly or is_annual:
                    frequency = "monthly" if is_monthly else ("weekly" if is_weekly else "annual")
                    
                    subscription_data = {
                        'merchant': merchant,
                        'amount': amount,
                        'frequency': frequency,
                        'occurrences': len(dates),
                        'total_spent': amount * len(dates),
                        'last_charge': max(dates).isoformat()
                    }
                    
                    if amount < 20 and len(dates) >= 3:
                        gray_charges.append(subscription_data)
                    else:
                        subscriptions.append(subscription_data)
    
    # Calculate total monthly cost
    total_monthly = sum(
        s['amount'] if s['frequency'] == 'monthly' else 
        (s['amount'] / 4 if s['frequency'] == 'weekly' else s['amount'] / 12)
        for s in subscriptions
    )
    
    return {
        "subscriptions": subscriptions,
        "gray_charges": gray_charges,
        "total_monthly": total_monthly,
        "total_subscriptions": len(subscriptions),
        "total_gray_charges": len(gray_charges)
    }

@app.get("/goals/{goal_id}/forecast")
def get_goal_forecast(
    goal_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep
):
    """Get AI-powered forecast for goal completion"""
    forecasting_engine = GoalForecastingEngine(session)
    forecast = forecasting_engine.forecast_goal_completion(goal_id, current_user.id)
    return forecast

@app.get("/spending/analysis")
def get_spending_analysis(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep,
    period: str = "month"  # month, week, year
):
    """Get detailed spending analysis with trends and patterns"""
    import pandas as pd
    from datetime import datetime, timedelta
    
    # Get user transactions
    transactions = session.exec(
        select(Transaction).where(Transaction.user_id == current_user.id)
    ).all()
    
    if not transactions:
        return {"error": "No transaction data available"}
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'price': float(t.price),
        'merchant': t.merchant_name,
        'category_primary': t.category_primary,
        'category_detailed': t.category_detailed,
        'date': t.date_of_transaction
    } for t in transactions])
    
    # Calculate date range based on period
    end_date = datetime.now().date()
    if period == "week":
        start_date = end_date - timedelta(days=7)
        previous_start = start_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
        previous_start = start_date - timedelta(days=30)
    else:  # year
        start_date = end_date - timedelta(days=365)
        previous_start = start_date - timedelta(days=365)
    
    # Filter data for current and previous periods
    current_period = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
    previous_period = df[(df['date'] >= previous_start) & (df['date'] < start_date)]
    
    # Calculate statistics
    current_total = current_period['price'].sum() if not current_period.empty else 0
    previous_total = previous_period['price'].sum() if not previous_period.empty else 0
    
    # Category breakdown
    category_spending = {}
    if not current_period.empty:
        for _, row in current_period.iterrows():
            # Use detailed category if available, otherwise use primary
            category = row.get('category_detailed') or row.get('category_primary')
            if category:
                if category not in category_spending:
                    category_spending[category] = 0
                category_spending[category] += row['price']
    
    # Top merchants
    merchant_spending = current_period.groupby('merchant')['price'].sum().to_dict() if not current_period.empty else {}
    top_merchants = dict(sorted(merchant_spending.items(), key=lambda x: x[1], reverse=True)[:5])
    
    # Calculate change percentage
    change_percentage = 0
    if previous_total > 0:
        change_percentage = ((current_total - previous_total) / previous_total) * 100
    
    return {
        "period": period,
        "current_total": current_total,
        "previous_total": previous_total,
        "change_percentage": change_percentage,
        "daily_average": current_total / max(1, (end_date - start_date).days),
        "transaction_count": len(current_period),
        "category_breakdown": category_spending,
        "top_merchants": top_merchants,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }

@app.post("/transactions/categorize/{transaction_id}")
def categorize_transaction(
    transaction_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: SessionDep,
    category_primary: str | None = None,
    category_detailed: str | None = None
):
    """Manually categorize or update transaction categories"""
    transaction = session.exec(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if category_primary is not None:
        transaction.category_primary = category_primary
    if category_detailed is not None:
        transaction.category_detailed = category_detailed
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    
    return {
        "message": "Transaction categorized successfully",
        "transaction": TransactionResponse.from_orm(transaction)
    }

