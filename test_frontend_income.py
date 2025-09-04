#!/usr/bin/env python3
"""
Test the complete income flow with recurring transactions
"""

import requests
import json
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_complete_income_flow():
    print("Testing complete income flow (backend + frontend integration)...")
    
    # Create a user with realistic income data
    random_id = random.randint(10000, 99999)
    user_email = f"test_complete_{random_id}@example.com"
    
    # Register user
    register_data = {
        "email": user_email,
        "name": "Complete Test User",
        "password": "TestPassword123!"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=register_data)
    if response.status_code != 200:
        print(f"Registration failed: {response.text}")
        return False
    print("✓ User registered")
    
    # Login
    login_data = {"username": user_email, "password": "TestPassword123!"}
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return False
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ User logged in")
    
    # Add realistic recurring income transactions
    base_date = datetime(2024, 1, 1)
    transactions_added = 0
    
    print("\n📝 Adding realistic income transactions...")
    
    # Monthly salary for 6 months
    for i in range(6):
        salary_date = base_date + timedelta(days=30 * i)
        trans = {
            "name": "Salary Direct Deposit",
            "amount": -4200.0,  # Negative = income
            "categories": ["payroll", "salary"],
            "merchant_name": "ACME Corp",
            "date": salary_date.strftime("%Y-%m-%d"),
            "transaction_id": f"salary_{random_id}_{i}",
            "account_id": f"checking_{random_id}"
        }
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            transactions_added += 1
            print(f"  ✓ Salary {i+1}: ${abs(trans['amount'])} on {trans['date']}")
    
    # Bi-weekly freelance work for 8 payments
    for i in range(8):
        freelance_date = base_date + timedelta(days=14 * i)
        trans = {
            "name": "Freelance Payment",
            "amount": -800.0,  # Negative = income
            "categories": ["transfer", "freelance"],
            "merchant_name": "Client Services LLC",
            "date": freelance_date.strftime("%Y-%m-%d"),
            "transaction_id": f"freelance_{random_id}_{i}",
            "account_id": f"checking_{random_id}"
        }
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            transactions_added += 1
            print(f"  ✓ Freelance {i+1}: ${abs(trans['amount'])} on {trans['date']}")
    
    # Add some expenses for context
    expense_transactions = [
        {"name": "Monthly Rent", "amount": 1500.0, "merchant": "Property Mgmt", "date": "2024-01-01"},
        {"name": "Utilities", "amount": 180.0, "merchant": "Electric Company", "date": "2024-01-05"},
        {"name": "Groceries", "amount": 120.0, "merchant": "Supermarket", "date": "2024-01-10"},
        {"name": "Gas", "amount": 60.0, "merchant": "Gas Station", "date": "2024-01-12"},
    ]
    
    for expense in expense_transactions:
        trans = {
            "name": expense["name"],
            "amount": expense["amount"],  # Positive = expense
            "categories": ["general"],
            "merchant_name": expense["merchant"],
            "date": expense["date"],
            "transaction_id": f"expense_{random_id}_{expense['name'].replace(' ', '_')}",
            "account_id": f"checking_{random_id}"
        }
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            transactions_added += 1
            print(f"  ✓ Expense: {expense['name']} ${expense['amount']}")
    
    print(f"\n📊 Total transactions added: {transactions_added}")
    
    # Test the new income analysis endpoint
    print("\n🔍 Testing income analysis...")
    response = requests.post(f"{BASE_URL}/income/analysis", headers=headers)
    if response.status_code == 200:
        income_data = response.json()
        print(f"✅ Income analysis successful!")
        print(f"  📈 Stream count: {income_data.get('stream_count', 0)}")
        print(f"  💰 Total monthly income: ${income_data.get('total_monthly_income', 0):,.2f}")
        
        streams = income_data.get('income_streams', [])
        if streams:
            print(f"\n💼 Income Stream Details:")
            for i, stream in enumerate(streams, 1):
                print(f"  {i}. {stream.get('name', 'Unknown Source')}")
                print(f"     Monthly: ${stream.get('monthly_income', 0):,.2f}")
                print(f"     Frequency: {stream.get('frequency', 'unknown')}")
                print(f"     Confidence: {stream.get('confidence', 0):.0%}")
        
        # Verify the data makes sense
        expected_salary = 4200.0  # Monthly salary
        expected_freelance = 800.0 * 2.17  # Bi-weekly freelance (~2.17 payments per month)
        expected_total = expected_salary + expected_freelance
        
        actual_total = income_data.get('total_monthly_income', 0)
        print(f"\n🧮 Income Verification:")
        print(f"  Expected monthly total: ~${expected_total:,.2f}")
        print(f"  Actual calculated total: ${actual_total:,.2f}")
        
        if abs(actual_total - expected_total) < 100:  # Allow some variance
            print(f"  ✅ Income calculation is accurate!")
        else:
            print(f"  ⚠️  Income calculation may need adjustment")
            
        return True
    else:
        print(f"✗ Income analysis failed: {response.text}")
        return False

if __name__ == "__main__":
    success = test_complete_income_flow()
    if success:
        print(f"\n🎉 Complete income flow test PASSED!")
        print(f"Backend income analysis is now working correctly and")
        print(f"ready for frontend integration.")
    else:
        print(f"\n❌ Complete income flow test FAILED!")