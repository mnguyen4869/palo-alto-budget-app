
# Smart Financial Coach Backend

A FastAPI-based backend service for the Smart Financial Coach application that provides AI-powered financial insights and transaction management.

## Features

- **User Authentication**: JWT-based authentication with OAuth2
- **Database Management**: SQLite database with SQLModel ORM
- **Transaction Management**: Store and retrieve financial transactions
- **Goal Tracking**: Create and manage financial goals
- **Insights Generation**: AI-powered financial insights
- **Plaid Integration**: Bank account linking and transaction sync (mock implementation)
- **Data Validation**: Comprehensive input validation and sanitization

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /token` - User login (get access token)
- `GET /me` - Get current user profile

### Goals
- `GET /goals` - Get user's goals
- `POST /goals` - Create a new goal
- `GET /goals/{goal_id}` - Get specific goal
- `PUT /goals/{goal_id}` - Update goal
- `DELETE /goals/{goal_id}` - Delete goal

### Transactions
- `GET /transactions` - Get user's transactions
- `GET /transactions/{transaction_id}` - Get specific transaction
- `POST /plaid/transaction` - Add transaction from Plaid data

### Insights
- `GET /insights` - Get user's insights
- `POST /insights` - Create insight
- `PUT /insights/{insight_id}/read` - Mark insight as read

### Bank Accounts
- `POST /plaid/create_link_token` - Create Plaid Link token
- `POST /plaid/exchange_token` - Exchange public token for access token
- `GET /accounts` - Get linked bank accounts

## Setup and Installation

**Using uv (recommended)**:
```bash
uv sync
uv run uvicorn main:app --reload
```

**Using pip**:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

```env
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
SECRET_KEY=your-jwt-secret-key
```

## Access Points

- **API Server**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

Run the test script:
```bash
python test_api.py
```

## Database Models

### User
- Email, name, password hash
- Created timestamp and active status

### Transaction
- User ID, name, price, categories
- Merchant name, transaction date
- Plaid transaction ID and account ID

### Goal
- User ID, title, description
- Target amount, current amount, target date
- Status (active, completed, paused)

### Insight
- User ID, title, message
- Insight type, confidence score
- Read status and creation date

### BankAccount
- User ID, Plaid account information
- Account name, type, institution
- Active status and creation date

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention via SQLModel
- User isolation (users can only access their own data)
