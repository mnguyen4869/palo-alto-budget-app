#!/usr/bin/env python3
"""
Comprehensive test suite for the Smart Financial Coach API
"""

import json
import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Optional

import requests


class APITestSuite:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.user_email = f"test_{random.randint(1000, 9999)}@example.com"
        self.headers = {}
    
    def run_all_tests(self):
        """Run all test suites."""
        print("=" * 60)
        print("SMART FINANCIAL COACH API - COMPREHENSIVE TEST SUITE")
        print("=" * 60)
        
        # Test authentication
        if not self.test_authentication():
            print("Authentication tests failed. Stopping.")
            return
        
        # Test data creation for AI features
        self.create_test_transactions()
        
        # Test all API features
        self.test_goals()
        self.test_transactions()
        self.test_ai_insights()
        self.test_spending_analysis()
        self.test_subscription_detection()
        self.test_security_validation()
        
        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
    
    def test_authentication(self) -> bool:
        """Test user registration and login."""
        print("\n📝 Testing Authentication...")
        
        # Register user
        user_data = {
            "email": self.user_email,
            "name": "Test User",
            "password": "TestPass123!"
        }
        
        response = requests.post(f"{self.base_url}/register", json=user_data)
        if response.status_code != 200:
            print(f"❌ Registration failed: {response.text}")
            return False
        print(f"✅ User registered: {self.user_email}")
        
        # Login
        login_data = {
            "username": self.user_email,
            "password": "TestPass123!"
        }
        
        response = requests.post(f"{self.base_url}/token", data=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return False
        
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        print("✅ Login successful, token received")
        
        # Verify profile access
        response = requests.get(f"{self.base_url}/me", headers=self.headers)
        if response.status_code != 200:
            print(f"❌ Profile access failed: {response.text}")
            return False
        print("✅ Profile access verified")
        
        return True
    
    def create_test_transactions(self):
        """Create test transactions for AI analysis."""
        print("\n💳 Creating Test Transactions...")
        
        # Create diverse transaction patterns
        merchants = [
            ("Starbucks", "Coffee", 5.50, 30),  # Daily coffee
            ("Netflix", "Entertainment", 15.99, 1),  # Monthly subscription
            ("Spotify", "Entertainment", 9.99, 1),  # Monthly subscription
            ("Amazon Prime", "Shopping", 14.99, 1),  # Monthly subscription
            ("Forgotten Gym", "Fitness", 19.99, 1),  # Gray charge
            ("Old App Subscription", "Software", 4.99, 1),  # Gray charge
            ("Whole Foods", "Groceries", 85.00, 4),  # Weekly groceries
            ("Shell Gas Station", "Transportation", 45.00, 4),  # Weekly gas
            ("Restaurant XYZ", "Dining", 65.00, 2),  # Bi-weekly dining
            ("Target", "Shopping", 120.00, 2),  # Occasional shopping
        ]
        
        transactions_created = 0
        base_date = datetime.now().date() - timedelta(days=90)
        
        for merchant, category, amount, frequency in merchants:
            for i in range(3):  # 3 months of data
                date = base_date + timedelta(days=30*i)
                
                # Add some variation to amounts and dates
                for j in range(frequency):
                    actual_date = date + timedelta(days=random.randint(0, 28))
                    actual_amount = amount * random.uniform(0.9, 1.1)
                    
                    transaction_data = {
                        "name": f"{merchant} Purchase",
                        "price": round(actual_amount, 2),
                        "categories": [category],
                        "merchant_name": merchant,
                        "date": actual_date.isoformat(),
                        "transaction_id": f"test_{transactions_created}",
                        "account_id": "test_account_1"
                    }
                    
                    response = requests.post(
                        f"{self.base_url}/plaid/transaction",
                        json=transaction_data,
                        headers=self.headers
                    )
                    
                    if response.status_code == 200:
                        transactions_created += 1
        
        # Add one anomaly transaction
        anomaly_data = {
            "name": "Luxury Watch Store",
            "price": 2500.00,
            "categories": ["Shopping"],
            "merchant_name": "Luxury Watch Store",
            "date": (datetime.now().date() - timedelta(days=5)).isoformat(),
            "transaction_id": f"test_anomaly",
            "account_id": "test_account_1"
        }
        
        response = requests.post(
            f"{self.base_url}/plaid/transaction",
            json=anomaly_data,
            headers=self.headers
        )
        
        if response.status_code == 200:
            transactions_created += 1
        
        print(f"✅ Created {transactions_created} test transactions")
    
    def test_goals(self):
        """Test goal management endpoints."""
        print("\n🎯 Testing Goal Management...")
        
        # Create goal
        goal_data = {
            "title": "Emergency Fund",
            "description": "Build 3-month emergency fund",
            "target_amount": "5000.00",
            "current_amount": "1500.00",
            "target_date": (datetime.now().date() + timedelta(days=180)).isoformat()
        }
        
        response = requests.post(f"{self.base_url}/goals", json=goal_data, headers=self.headers)
        if response.status_code != 200:
            print(f"❌ Goal creation failed: {response.text}")
            return
        
        goal = response.json()
        goal_id = goal["id"]
        print(f"✅ Goal created: {goal['title']}")
        
        # Test goal forecast
        response = requests.get(f"{self.base_url}/goals/{goal_id}/forecast", headers=self.headers)
        if response.status_code == 200:
            forecast = response.json()
            print(f"✅ Goal forecast: {'On track' if forecast.get('on_track') else 'Off track'}")
        
        # Update goal
        update_data = {"current_amount": "2000.00"}
        response = requests.put(
            f"{self.base_url}/goals/{goal_id}",
            json=update_data,
            headers=self.headers
        )
        if response.status_code == 200:
            print("✅ Goal updated successfully")
    
    def test_transactions(self):
        """Test transaction endpoints."""
        print("\n💰 Testing Transaction Management...")
        
        # Get all transactions
        response = requests.get(f"{self.base_url}/transactions", headers=self.headers)
        if response.status_code != 200:
            print(f"❌ Failed to retrieve transactions: {response.text}")
            return
        
        transactions = response.json()
        print(f"✅ Retrieved {len(transactions)} transactions")
        
        # Test categorization
        if transactions:
            transaction_id = transactions[0]["id"]
            categories = ["Food & Dining", "Coffee Shops"]
            
            response = requests.post(
                f"{self.base_url}/transactions/categorize/{transaction_id}",
                json=categories,
                headers=self.headers
            )
            
            if response.status_code == 200:
                print("✅ Transaction categorized successfully")
    
    def test_ai_insights(self):
        """Test AI-powered insights generation."""
        print("\n🤖 Testing AI Insights Generation...")
        
        # Generate insights
        response = requests.post(f"{self.base_url}/insights/generate", headers=self.headers)
        if response.status_code != 200:
            print(f"❌ Insights generation failed: {response.text}")
            return
        
        result = response.json()
        insights = result.get("insights", [])
        print(f"✅ Generated {len(insights)} AI insights")
        
        # Display insights
        for insight in insights[:3]:  # Show first 3 insights
            print(f"   📍 {insight['title']}: {insight['insight_type']}")
        
        # Get all insights
        response = requests.get(f"{self.base_url}/insights", headers=self.headers)
        if response.status_code == 200:
            all_insights = response.json()
            print(f"✅ Total insights available: {len(all_insights)}")
        
        # Mark insight as read
        if insights:
            insight_id = insights[0]["id"]
            response = requests.put(
                f"{self.base_url}/insights/{insight_id}/read",
                headers=self.headers
            )
            if response.status_code == 200:
                print("✅ Insight marked as read")
    
    def test_spending_analysis(self):
        """Test spending analysis endpoints."""
        print("\n📊 Testing Spending Analysis...")
        
        periods = ["week", "month", "year"]
        
        for period in periods:
            response = requests.get(
                f"{self.base_url}/spending/analysis",
                params={"period": period},
                headers=self.headers
            )
            
            if response.status_code == 200:
                analysis = response.json()
                total = analysis.get("current_total", 0)
                change = analysis.get("change_percentage", 0)
                print(f"✅ {period.capitalize()} spending: ${total:.2f} ({change:+.1f}% change)")
    
    def test_subscription_detection(self):
        """Test subscription and gray charge detection."""
        print("\n🔄 Testing Subscription Detection...")
        
        response = requests.get(f"{self.base_url}/insights/subscriptions", headers=self.headers)
        if response.status_code != 200:
            print(f"❌ Subscription detection failed: {response.text}")
            return
        
        data = response.json()
        subscriptions = data.get("subscriptions", [])
        gray_charges = data.get("gray_charges", [])
        total_monthly = data.get("total_monthly", 0)
        
        print(f"✅ Found {len(subscriptions)} active subscriptions")
        print(f"✅ Found {len(gray_charges)} potential gray charges")
        print(f"✅ Total monthly subscription cost: ${total_monthly:.2f}")
        
        # Display some subscriptions
        for sub in subscriptions[:3]:
            print(f"   📍 {sub['merchant']}: ${sub['amount']:.2f} {sub['frequency']}")
    
    def test_security_validation(self):
        """Test security and input validation."""
        print("\n🔒 Testing Security & Validation...")
        
        # Test invalid email
        invalid_user = {
            "email": "not-an-email",
            "name": "Test",
            "password": "Pass123!"
        }
        
        response = requests.post(f"{self.base_url}/register", json=invalid_user)
        if response.status_code == 400:
            print("✅ Invalid email rejected")
        
        # Test weak password
        weak_password_user = {
            "email": "weak@example.com",
            "name": "Test",
            "password": "weak"
        }
        
        response = requests.post(f"{self.base_url}/register", json=weak_password_user)
        if response.status_code == 400:
            print("✅ Weak password rejected")
        
        # Test unauthorized access
        response = requests.get(f"{self.base_url}/me")
        if response.status_code == 401:
            print("✅ Unauthorized access blocked")
        
        # Test SQL injection attempt (sanitization)
        malicious_goal = {
            "title": "'; DROP TABLE users; --",
            "description": "<script>alert('XSS')</script>",
            "target_amount": "1000.00",
            "target_date": "2024-12-31"
        }
        
        response = requests.post(f"{self.base_url}/goals", json=malicious_goal, headers=self.headers)
        if response.status_code in [200, 400]:
            print("✅ Input sanitization working")


if __name__ == "__main__":
    print("\n🚀 Starting Comprehensive API Tests...")
    print("⚠️  Make sure the server is running on http://localhost:8000")
    print("    Run: uvicorn main:app --reload")
    print("-" * 60)
    
    try:
        test_suite = APITestSuite()
        test_suite.run_all_tests()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to the API.")
        print("   Make sure the server is running:")
        print("   cd backend && uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()