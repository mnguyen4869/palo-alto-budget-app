# Personal Finance Dashboard - Frontend

A React-based financial dashboard application that provides users with comprehensive financial management tools including account linking, transaction tracking, spending visualization, and goal management.

## Architecture Overview

This frontend application is built with:
- **React 19** with TypeScript for type-safe development
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Plaid Link** for bank account integration

## Key Features

- User authentication and registration
- Bank account linking via Plaid
- Real-time transaction tracking
- Interactive spending charts and analytics
- Financial goal setting and tracking
- Responsive design for mobile and desktop

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main app layout wrapper
│   ├── ProtectedRoute.tsx # Authentication guard
│   ├── PlaidLink.tsx    # Plaid bank linking component
│   ├── BankAccounts.tsx # Bank account display
│   ├── DashboardStats.tsx # Financial statistics
│   ├── SpendingChart.tsx # Spending visualization
│   └── CategoryChart.tsx # Category breakdown chart
├── pages/               # Route-based page components
│   ├── Home.tsx         # Landing page
│   ├── Login.tsx        # User login
│   ├── Register.tsx     # User registration
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Transactions.tsx # Transaction management
│   ├── Goals.tsx        # Financial goals
│   └── Settings.tsx     # User settings
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
├── hooks/               # Custom React hooks
│   └── useApi.ts        # API interaction utilities
└── App.tsx              # Main application component
```

## Core Components

### Authentication System
- **AuthContext**: Manages user authentication state, login/logout functionality, and token storage
- **ProtectedRoute**: Guards authenticated routes from unauthorized access
- **Login/Register**: User authentication forms with backend integration

### Dashboard Components
- **Dashboard**: Main financial overview with stats, charts, and account summaries
- **DashboardStats**: Key financial metrics and KPIs
- **SpendingChart**: Visual representation of spending patterns over time
- **CategoryChart**: Breakdown of expenses by category

### Banking Integration
- **PlaidLink**: Secure bank account linking using Plaid's Link SDK
- **BankAccounts**: Display and manage connected bank accounts
- **Transactions**: View and categorize financial transactions

### Navigation & Layout
- **Layout**: Consistent navigation and page structure
- **Routing**: Protected and public routes with React Router

## API Integration

The frontend communicates with a FastAPI backend running on `http://localhost:8000` with endpoints for:
- Authentication (`/token`, `/register`, `/me`)
- Account management (`/accounts`, `/plaid`)
- Transaction data (`/transactions`)
- Financial goals (`/goals`)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running on localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
VITE_PLAID_CLIENT_NAME=Your App Name
VITE_PLAID_ENV=sandbox
VITE_API_URL=http://localhost:8000
```

### Development

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

### Code Quality

Run ESLint to check code quality:
```bash
npm run lint
```

Preview the production build:
```bash
npm run preview
```

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Charts**: Recharts 3
- **Bank Integration**: Plaid Link 4
- **Code Quality**: ESLint with TypeScript rules

## Development Notes

- All routes except home, login, and register require authentication
- Authentication tokens are stored in localStorage
- The app uses React Context for global state management
- Components follow TypeScript interfaces for type safety
- Tailwind CSS classes are used for consistent styling
