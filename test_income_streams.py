#!/usr/bin/env python3
"""
Test script to verify income stream analysis
"""

import requests
import json
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_income_streams():
    print("Testing income stream analysis...")
    
    # Register a new test user
    random_id = random.randint(10000, 99999)
    user_email = f"test_income_streams_{random_id}@example.com"
    register_data = {
        "email": user_email,
        "name": "Test Income User",
        "password": "TestPassword123!"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=register_data)
    if response.status_code != 200:
        print(f"Registration failed: {response.text}")
        return False
    
    print("✓ User registered successfully")
    
    # Login to get token
    login_data = {
        "username": user_email,
        "password": "TestPassword123!"
    }
    
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return False
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")
    
    # Add multiple recurring income transactions (same employer, multiple payments)
    base_date = datetime(2024, 1, 1)
    test_transactions = []
    
    # Add 6 monthly salary payments from the same employer
    for i in range(6):
        salary_date = base_date + timedelta(days=30 * i)
        test_transactions.append({
            "name": "Salary Direct Deposit",
            "amount": -4500.0,  # Consistent salary amount (negative = income)
            "categories": ["payroll", "salary", "deposit"],
            "merchant_name": "ABC Corporation",
            "date": salary_date.strftime("%Y-%m-%d"),
            "transaction_id": f"salary_{random_id}_{i}",
            "account_id": f"checking_{random_id}"
        })
    
    # Add 4 bi-weekly freelance payments
    for i in range(4):
        freelance_date = base_date + timedelta(days=14 * i)
        test_transactions.append({
            "name": "Freelance Payment",
            "amount": -1200.0,  # Consistent freelance amount (negative = income)
            "categories": ["transfer", "freelance"],
            "merchant_name": "XYZ Client LLC",
            "date": freelance_date.strftime("%Y-%m-%d"),
            "transaction_id": f"freelance_{random_id}_{i}",
            "account_id": f"checking_{random_id}"
        })
    
    # Add some expenses too
    test_transactions.extend([
        {
            "name": "Rent Payment",
            "amount": 1200.0,  # Positive = expense
            "categories": ["payment", "rent"],
            "merchant_name": "Property Management Co",
            "date": "2024-01-01",
            "transaction_id": f"rent_{random_id}",
            "account_id": f"checking_{random_id}"
        },
        {
            "name": "Grocery Shopping",
            "amount": 150.0,  # Positive = expense
            "categories": ["food_and_drink", "groceries"],
            "merchant_name": "Whole Foods",
            "date": "2024-01-15",
            "transaction_id": f"groceries_{random_id}",
            "account_id": f"checking_{random_id}"
        }
    ])
    
    # Add all test transactions
    print(f"\nAdding {len(test_transactions)} test transactions...")
    for trans in test_transactions:
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            print(f"✓ Added: {trans['name']} (${trans['amount']}) - {trans['date']}")
        else:
            print(f"✗ Failed: {trans['name']} - {response.text}")
    
    # Test income analysis
    print(f"\n🔍 Testing income stream analysis...")
    response = requests.post(f"{BASE_URL}/plaid/income", headers=headers)
    if response.status_code == 200:
        income_data = response.json()
        print(f"✅ Income analysis successful!")
        print(f"  Stream count: {income_data.get('stream_count', 0)}")
        print(f"  Total monthly income: ${income_data.get('total_monthly_income', 0):.2f}")
        print(f"  Message: {income_data.get('message', 'N/A')}")
        
        streams = income_data.get('income_streams', [])
        if streams:
            print(f"\n📊 Detected Income Streams:")
            for i, stream in enumerate(streams, 1):
                print(f"  {i}. {stream.get('name', 'Unknown')}")
                print(f"     Source: {stream.get('account_name', 'Unknown Account')}")
                print(f"     Monthly Income: ${stream.get('monthly_income', 0):.2f}")
                print(f"     Frequency: {stream.get('frequency', 'unknown')}")
                print(f"     Confidence: {stream.get('confidence', 0):.1%}")
                print(f"     Days of Data: {stream.get('days_available', 0)}")
                print()
        else:
            print("  No income streams detected")
            
    else:
        print(f"✗ Income analysis failed: {response.text}")
        return False
    
    # Also test getting regular transactions
    print(f"\n📋 Checking transaction retrieval...")
    response = requests.get(f"{BASE_URL}/transactions", headers=headers)
    if response.status_code == 200:
        transactions = response.json()
        income_count = sum(1 for t in transactions if float(t['price']) < 0)
        expense_count = sum(1 for t in transactions if float(t['price']) > 0)
        print(f"✓ Retrieved {len(transactions)} total transactions")
        print(f"  Income transactions: {income_count}")
        print(f"  Expense transactions: {expense_count}")
    else:
        print(f"✗ Transaction retrieval failed: {response.text}")
    
    return True

if __name__ == "__main__":
    test_income_streams()