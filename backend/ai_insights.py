import hashlib
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sqlmodel import Session, select

from data.data_models import Insight, Transaction, User


def format_category_name(category: str) -> str:
    """Format category name by removing underscores and proper casing."""
    if not category:
        return ""
    return category.replace('_', ' ').lower().title()


class FinancialInsightsEngine:
    def __init__(self, session: Session):
        self.session = session
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()

    def generate_user_insights(self, user_id: int) -> List[Insight]:
        """Generate comprehensive insights for a user based on their transaction history."""
        transactions = self._get_user_transactions(user_id)
        
        if not transactions:
            return []
        
        insights = []
        
        # Analyze spending patterns
        spending_insights = self._analyze_spending_patterns(transactions, user_id)
        insights.extend(spending_insights)
        
        # Detect anomalies
        anomaly_insights = self._detect_anomalies(transactions, user_id)
        insights.extend(anomaly_insights)
        
        # Find subscriptions and recurring charges
        subscription_insights = self._detect_subscriptions(transactions, user_id)
        insights.extend(subscription_insights)
        
        # Analyze category spending
        category_insights = self._analyze_category_spending(transactions, user_id)
        insights.extend(category_insights)
        
        # Save valid insights to database
        saved_insights = []
        for insight in insights:
            if insight and isinstance(insight, Insight):
                self.session.add(insight)
                saved_insights.append(insight)
        
        if saved_insights:
            self.session.commit()
        
        return saved_insights

    def _get_user_transactions(self, user_id: int) -> List[Transaction]:
        """Retrieve all transactions for a user."""
        transactions = self.session.exec(
            select(Transaction).where(Transaction.user_id == user_id)
        ).all()
        return list(transactions)

    def _detect_anomalies(self, transactions: List[Transaction], user_id: int) -> List[Insight]:
        """Detect anomalous transactions using Isolation Forest."""
        if len(transactions) < 10:
            return []
        
        insights = []
        
        # Prepare data for anomaly detection
        df = self._transactions_to_dataframe(transactions)
        
        # Feature engineering for anomaly detection
        features = []
        for _, row in df.iterrows():
            features.append([
                float(row['price']),
                row['day_of_week'],
                row['hour'],
                self._get_merchant_frequency(row['merchant_name'], df),
                self._get_category_frequency([row['category_primary']] if row['category_primary'] else None, df)
            ])
        
        if not features:
            return []
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Detect anomalies
        predictions = self.anomaly_detector.fit_predict(features_scaled)
        
        # Create insights for anomalies
        for idx, pred in enumerate(predictions):
            if pred == -1:  # Anomaly detected
                transaction = transactions[idx]
                
                # Determine anomaly reason
                avg_amount = df['price'].mean()
                transaction_amount = abs(float(transaction.price))
                avg_amount_abs = abs(float(avg_amount))
                
                if transaction_amount > avg_amount_abs * 2:
                    multiplier = transaction_amount / avg_amount_abs if avg_amount_abs > 0 else 1
                    message = (
                        f"Unusually high transaction detected: ${transaction_amount:.2f} "
                        f"at {transaction.merchant_name} on {transaction.date_of_transaction}. "
                        f"This is {abs(multiplier):.1f}x your average spending."
                    )
                    insight_type = "anomaly_high_amount"
                else:
                    message = (
                        f"Unusual transaction pattern detected: ${transaction_amount:.2f} "
                        f"at {transaction.merchant_name}. This merchant or timing is uncommon for your spending habits."
                    )
                    insight_type = "anomaly_pattern"
                
                insight = Insight(
                    user_id=user_id,
                    title="Unusual Transaction Alert",
                    message=message,
                    insight_type=insight_type,
                    confidence_score=0.85
                )
                insights.append(insight)
        
        return insights[:3]  # Limit to top 3 anomalies

    def _detect_subscriptions(self, transactions: List[Transaction], user_id: int) -> List[Insight]:
        """Detect recurring subscriptions and gray charges."""
        insights = []
        
        if len(transactions) < 30:
            return []
        
        # Group transactions by merchant and amount
        recurring_patterns = defaultdict(list)
        
        for trans in transactions:
            # Only consider positive transactions (expenses) for subscription detection
            # Negative transactions are income and should not be considered subscriptions
            if float(trans.price) > 0:
                # Create a key for similar transactions
                key = (
                    trans.merchant_name.lower().strip(),
                    float(trans.price)
                )
                recurring_patterns[key].append(trans.date_of_transaction)
        
        subscriptions = []
        gray_charges = []
        
        for (merchant, amount), dates in recurring_patterns.items():
            if len(dates) >= 2:
                # Sort dates and check for regular intervals
                sorted_dates = sorted(dates)
                intervals = []
                
                for i in range(1, len(sorted_dates)):
                    interval = (sorted_dates[i] - sorted_dates[i-1]).days
                    intervals.append(interval)
                
                if intervals:
                    avg_interval = np.mean(intervals)
                    std_interval = np.std(intervals)
                    
                    # Check if it's a regular subscription (monthly, weekly, annual)
                    is_monthly = 25 <= avg_interval <= 35 and std_interval < 5
                    is_weekly = 6 <= avg_interval <= 8 and std_interval < 2
                    is_annual = 350 <= avg_interval <= 380 and std_interval < 15
                    
                    if is_monthly or is_weekly or is_annual:
                        frequency = "monthly" if is_monthly else ("weekly" if is_weekly else "annual")
                        
                        # Check if it's potentially a gray charge (small, forgotten subscription)
                        if amount < 20 and len(dates) >= 3:
                            gray_charges.append({
                                'merchant': merchant,
                                'amount': amount,
                                'frequency': frequency,
                                'occurrences': len(dates),
                                'total_spent': amount * len(dates)
                            })
                        else:
                            subscriptions.append({
                                'merchant': merchant,
                                'amount': amount,
                                'frequency': frequency,
                                'occurrences': len(dates),
                                'total_spent': amount * len(dates)
                            })
        
        # Create insights for subscriptions
        if subscriptions:
            total_monthly = sum(
                s['amount'] if s['frequency'] == 'monthly' else 
                (s['amount'] / 4 if s['frequency'] == 'weekly' else s['amount'] / 12)
                for s in subscriptions
            )
            
            subscription_list = '\n'.join([
                f"• {s['merchant']}: ${s['amount']:.2f} {s['frequency']}"
                for s in subscriptions[:5]
            ])
            
            insight = Insight(
                user_id=user_id,
                title=f"Active Subscriptions Detected",
                message=(
                    f"You have {len(subscriptions)} active subscriptions totaling approximately "
                    f"${total_monthly:.2f} per month:\n{subscription_list}\n\n"
                    f"Consider reviewing these to ensure you're using all services."
                ),
                insight_type="subscription_summary",
                confidence_score=0.9
            )
            insights.append(insight)
        
        # Create insights for gray charges
        if gray_charges:
            gray_charge_list = '\n'.join([
                f"• {g['merchant']}: ${g['amount']:.2f} {g['frequency']} (${g['total_spent']:.2f} total)"
                for g in gray_charges[:3]
            ])
            
            total_gray = sum(g['total_spent'] for g in gray_charges)
            
            insight = Insight(
                user_id=user_id,
                title="Potential Forgotten Subscriptions",
                message=(
                    f"Found {len(gray_charges)} small recurring charges that might be forgotten subscriptions. "
                    f"You've spent ${total_gray:.2f} total on these:\n{gray_charge_list}\n\n"
                    f"Review these charges and cancel any unused services."
                ),
                insight_type="gray_charges",
                confidence_score=0.85
            )
            insights.append(insight)
        
        return insights

    def _analyze_spending_patterns(self, transactions: List[Transaction], user_id: int) -> List[Insight]:
        """Analyze spending patterns and trends."""
        insights = []
        
        if not transactions:
            return []
        
        df = self._transactions_to_dataframe(transactions)
        
        # Calculate spending by time period (only positive transactions which are expenses)
        expense_df = df[df['price'] > 0].copy()  # Filter for expenses only
        if expense_df.empty:
            return []
        
        expense_df['month'] = pd.to_datetime(expense_df['date_of_transaction']).dt.to_period('M')
        monthly_spending = expense_df.groupby('month')['price'].sum()
        
        if len(monthly_spending) >= 2:
            # Calculate trend
            recent_month = monthly_spending.iloc[-1]
            previous_month = monthly_spending.iloc[-2]
            
            if len(monthly_spending) >= 3:
                avg_last_3_months = monthly_spending.iloc[-3:].mean()
            else:
                avg_last_3_months = monthly_spending.mean()
            
            # Spending increase alert
            if recent_month > previous_month * 1.3:
                increase_pct = ((recent_month - previous_month) / previous_month) * 100
                insight = Insight(
                    user_id=user_id,
                    title="Spending Increase Alert",
                    message=(
                        f"Your spending increased by {increase_pct:.1f}% this month "
                        f"(${recent_month:.2f} vs ${previous_month:.2f} last month). "
                        f"Review your recent transactions to stay on budget."
                    ),
                    insight_type="spending_increase",
                    confidence_score=0.95
                )
                insights.append(insight)
            
            # Positive trend - spending decrease
            elif recent_month < previous_month * 0.8:
                decrease_pct = ((previous_month - recent_month) / previous_month) * 100
                insight = Insight(
                    user_id=user_id,
                    title="Great Job Saving!",
                    message=(
                        f"Your spending decreased by {decrease_pct:.1f}% this month! "
                        f"You spent ${previous_month - recent_month:.2f} less than last month. "
                        f"Keep up the great work!"
                    ),
                    insight_type="spending_decrease",
                    confidence_score=0.95
                )
                insights.append(insight)
        
        # Weekend vs weekday spending (using expense_df)
        expense_df.loc[:, 'is_weekend'] = pd.to_datetime(expense_df['date_of_transaction']).dt.dayofweek.isin([5, 6])
        weekend_spending = expense_df[expense_df['is_weekend']]['price'].sum()
        weekday_spending = expense_df[~expense_df['is_weekend']]['price'].sum()
        
        weekend_days = expense_df['is_weekend'].sum()
        weekday_days = (~expense_df['is_weekend']).sum()
        
        if weekend_days > 0 and weekday_days > 0:
            avg_weekend = weekend_spending / weekend_days
            avg_weekday = weekday_spending / weekday_days
            
            if avg_weekend > avg_weekday * 1.5:
                insight = Insight(
                    user_id=user_id,
                    title="Weekend Spending Pattern",
                    message=(
                        f"You spend {(avg_weekend/avg_weekday):.1f}x more on weekends "
                        f"(${avg_weekend:.2f}/day) compared to weekdays (${avg_weekday:.2f}/day). "
                        f"Consider planning weekend activities to manage spending."
                    ),
                    insight_type="weekend_spending",
                    confidence_score=0.8
                )
                insights.append(insight)
        
        return insights

    def _analyze_category_spending(self, transactions: List[Transaction], user_id: int) -> List[Insight]:
        """Analyze spending by category and provide insights."""
        insights = []
        
        # Aggregate spending by category
        category_spending = defaultdict(float)
        category_counts = defaultdict(int)
        
        for trans in transactions:
            # Use the primary category for spending analysis
            category = trans.category_primary or trans.category_detailed
            if category:
                category_spending[category] += float(abs(trans.price))  # Use absolute value for spending
                category_counts[category] += 1
        
        if not category_spending:
            return []
        
        # Sort categories by spending
        sorted_categories = sorted(
            category_spending.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        total_spending = sum(category_spending.values())
        
        # Top spending categories insight
        if len(sorted_categories) >= 3:
            top_3 = sorted_categories[:3]
            top_3_total = sum(amount for _, amount in top_3)
            top_3_pct = (top_3_total / total_spending) * 100
            
            category_list = []
            for i, (cat, amount) in enumerate(top_3, 1):
                percentage = (amount/total_spending)*100
                category_list.append(f"{i}. {format_category_name(cat)}: ${amount:.2f} ({percentage:.1f}%)")
            
            category_breakdown = '\n'.join(category_list)
            
            insight = Insight(
                user_id=user_id,
                title="Top Spending Categories",
                message=(
                    f"Your top 3 spending categories account for {top_3_pct:.1f}% of your total spending:\n\n"
                    f"{category_breakdown}\n\n"
                    f"Focus on these areas for the biggest savings impact."
                ),
                insight_type="category_analysis",
                confidence_score=0.9
            )
            insights.append(insight)
        
        # Specific category insights
        for category, amount in sorted_categories[:5]:
            avg_transaction = amount / category_counts[category]
            
            # Coffee/dining insights
            if any(keyword in category.lower() for keyword in ['coffee', 'cafe', 'starbucks']):
                annual_projection = amount * 12  # Assuming monthly data
                insight = Insight(
                    user_id=user_id,
                    title="Coffee Spending Analysis",
                    message=(
                        f"You're spending ${amount:.2f}/month on coffee (${annual_projection:.2f}/year). "
                        f"Brewing at home could save you over ${annual_projection * 0.7:.2f} annually!"
                    ),
                    insight_type="coffee_spending",
                    confidence_score=0.85
                )
                insights.append(insight)
                break
            
            # Food delivery insights
            elif any(keyword in category.lower() for keyword in ['delivery', 'doordash', 'uber eats', 'grubhub']):
                delivery_savings = amount * 0.3  # Assume 30% savings by picking up
                insight = Insight(
                    user_id=user_id,
                    title="Food Delivery Savings Opportunity",
                    message=(
                        f"You spent ${amount:.2f} on food delivery this month. "
                        f"Picking up orders yourself could save approximately ${delivery_savings:.2f} in fees and tips."
                    ),
                    insight_type="delivery_spending",
                    confidence_score=0.8
                )
                insights.append(insight)
                break
        
        return insights[:3]  # Limit number of category insights

    def _transactions_to_dataframe(self, transactions: List[Transaction]) -> pd.DataFrame:
        """Convert transactions to pandas DataFrame for analysis."""
        data = []
        for trans in transactions:
            # Use the category fields from the Transaction model
            categories = []
            if trans.category_primary:
                categories.append(trans.category_primary)
            if trans.category_detailed and trans.category_detailed != trans.category_primary:
                categories.append(trans.category_detailed)
            
            data.append({
                'id': trans.id,
                'price': float(trans.price),
                'merchant_name': trans.merchant_name or 'Unknown',
                'categories': categories if categories else None,
                'category_primary': trans.category_primary,
                'category_detailed': trans.category_detailed,
                'date_of_transaction': trans.date_of_transaction,
                'day_of_week': trans.date_of_transaction.weekday(),
                'hour': 12  # Default hour since we don't have time data
            })
        return pd.DataFrame(data)

    def _get_merchant_frequency(self, merchant: str, df: pd.DataFrame) -> float:
        """Get frequency score for a merchant."""
        merchant_counts = df['merchant_name'].value_counts()
        if merchant in merchant_counts:
            return float(merchant_counts[merchant] / len(df))
        return 0.0

    def _get_category_frequency(self, categories: Optional[List[str]], df: pd.DataFrame) -> float:
        """Get frequency score for categories."""
        if not categories:
            return 0.0
        
        all_categories = []
        for _, row in df.iterrows():
            if row['category_primary']:
                all_categories.append(row['category_primary'])
            if row['category_detailed'] and row['category_detailed'] != row['category_primary']:
                all_categories.append(row['category_detailed'])
        
        if not all_categories:
            return 0.0
        
        category_counts = Counter(all_categories)
        total_freq = sum(category_counts.get(cat, 0) for cat in categories)
        return total_freq / len(all_categories)


class GoalForecastingEngine:
    def __init__(self, session: Session):
        self.session = session

    def forecast_goal_completion(self, goal_id: int, user_id: int) -> Dict:
        """Forecast if a user will meet their financial goal based on current patterns."""
        from data.data_models import Goal
        
        # Get goal details
        goal = self.session.exec(
            select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
        ).first()
        
        if not goal:
            return {"error": "Goal not found"}
        
        # Get user's transaction history
        transactions = self.session.exec(
            select(Transaction).where(Transaction.user_id == user_id)
        ).all()
        
        if not transactions:
            return {
                "on_track": False,
                "message": "Not enough transaction data to make a forecast",
                "confidence": 0.0
            }
        
        # Calculate savings rate
        df = pd.DataFrame([{
            'price': float(t.price),
            'date': t.date_of_transaction
        } for t in transactions])
        
        df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
        monthly_spending = df.groupby('month')['price'].sum()
        
        # Simple forecasting based on current progress and time remaining
        if goal.target_date:
            days_remaining = (goal.target_date - datetime.now().date()).days
            months_remaining = max(1, days_remaining / 30)
            
            amount_needed = float(goal.target_amount) - float(goal.current_amount)
            required_monthly_savings = amount_needed / months_remaining
            
            # Estimate user's capacity to save based on spending patterns
            if len(monthly_spending) >= 2:
                avg_monthly_spending = monthly_spending.mean()
                spending_volatility = monthly_spending.std()
                
                # Simple heuristic: assume user can save 20% of their spending by cutting back
                estimated_savings_capacity = avg_monthly_spending * 0.2
                
                on_track = estimated_savings_capacity >= required_monthly_savings
                confidence = min(0.95, max(0.3, 1 - (spending_volatility / avg_monthly_spending)))
                
                if on_track:
                    message = (
                        f"Great news! At your current rate, you're on track to reach your goal. "
                        f"You need to save ${required_monthly_savings:.2f}/month."
                    )
                else:
                    shortfall = required_monthly_savings - estimated_savings_capacity
                    message = (
                        f"You need to save ${required_monthly_savings:.2f}/month to reach your goal, "
                        f"but based on your spending patterns, you might fall short by ${shortfall:.2f}/month. "
                        f"Consider reducing spending in your top categories."
                    )
                
                return {
                    "on_track": on_track,
                    "message": message,
                    "required_monthly_savings": required_monthly_savings,
                    "estimated_capacity": estimated_savings_capacity,
                    "confidence": confidence
                }
        
        return {
            "on_track": False,
            "message": "Goal has no target date set",
            "confidence": 0.0
        }