# Documentation for Smart Financial Coach

## Tech Stack

### Frontend
- **React.js** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework

### Backend
- **Python** - Primary backend language
- **FastAPI** - Modern, fast web framework

### Database
- **SQLite** - Lightweight, file-based database

### Machine Learning & Data Processing
- **Pandas** - Data manipulation and analysis
- **Scikit-learn** - Machine learning algorithms
- **NumPy** - Numerical computing

### Third-Party Integrations
- **Plaid** - Bank account connections and transaction data

## Design Choices

### Architecture

### Architecture Justification

**Monolithic FastAPI Backend**
Chosen to unify the API and the AI/ML logic info a cohesive unit, instead of
having a TypeScript backend with a Python microservice for AI/ML integration.
This way we simplify the endpoints, as both API and ML logic will be available
on the same service. To expose the backend we use FastAPI which is used in the
industry and provides automatic API documentation as well, and it provides
performance on par with Node. Additional for security, FastAPI supports data
validation by default. 

**React Frontend with Vite**
We used React as it has wide support and is also an industry standard. Using
alongside Vite allows for rapid iterations which is key for a hackathon like
this. It also plays nicely with Plaid's Like integration, which was core to this
project.

### Database Choice: SQLite
- **Zero configuration** - Just a file in the project directory
- **Perfect for MVP** - Handles prototype data volume easily
- **Portability** - Entire database is self-contained
- **Python integration** - Seamless with SQLModel/SQLAlchemy
- **Development speed** - No database server setup required

### Third Party Services: Plaid

**Why Plaid:**
- **Industry standard** for secure bank connections
- **Security** - Handles credential management through tokenization
- **Clean data** - Provides pre-categorized transaction data
- **Sandbox environment** - Full-featured testing without real accounts
- **Compliance** - Handles regulatory requirements

**Current Implementation:**
- Sandbox mode for development/testing
- Link token generation for secure connections
- Transaction syncing with categorization
- Account balance retrieval
- Subscription detection from transaction patterns

## AI/ML Features and Tooling

### AI Tooling

### Financial Insights Engine
- **Spending Pattern Analysis** - Identifies trends and habits
- **Anomaly Detection** - Uses IsolationForest to flag unusual transactions
- **Subscription Detection** - Identifies recurring payments
- **Income Stream Analysis** - Tracks and categorizes income sources
- **Budget Recommendations** - Suggests spending limits by category

### Goal Forecasting Engine
- **Trend Analysis** - Projects future savings based on history
- **Goal Feasibility** - Assesses achievability of financial goals
- **Milestone Tracking** - Breaks down goals into achievable steps

## Security Implementation

- **JWT Authentication** - Stateless token-based auth
- **Password Hashing** - bcrypt with salt
- **Input Validation** - Comprehensive request validation

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /token` - Login and token generation
- `GET /users/me` - Get current user

### Financial Data
- `GET /transactions` - User transactions with filtering
- `GET /bank-accounts` - Connected bank accounts
- `POST /create_link_token` - Plaid Link initialization
- `POST /exchange_public_token` - Complete Plaid connection

### Goals & Insights
- `GET/POST /goals` - Financial goals management
- `GET /insights` - AI-generated insights
- `GET /subscriptions` - Detected subscriptions
- `GET /income-streams` - Income analysis

## Future Enhancements

### Migration to PostgreSQL
- Better concurrent user support
- Advanced querying capabilities
- Production-ready scalability
- Support for complex financial data relationships

### Enhanced Plaid Integration
- Move from sandbox to production environment
- Real-time transaction webhooks
- Investment account support
- Credit score monitoring
- Bill payment features

### Improved AI/ML Models
- Deep learning for better pattern recognition
- Personalized financial advice using transformer models
- Predictive spending alerts
- Advanced portfolio optimization
- Natural language financial assistant
- Collaborative filtering for peer comparisons

### Additional Features
- Multi-currency support
- Family/shared account management
- Tax optimization suggestions
- Automated savings rules
- Financial education content
- Mobile application
- Export to accounting software

