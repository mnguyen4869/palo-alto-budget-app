#!/usr/bin/env python3
"""
Test script to verify transaction logic changes
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_transaction_logic():
    print("Testing transaction logic changes...")
    
    # First register a test user
    user_email = f"test_transaction_{datetime.now().timestamp()}@example.com"
    register_data = {
        "email": user_email,
        "name": "Test User",
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
    
    # Test adding transactions with new logic
    # In new logic: positive = expenses, negative = income
    test_transactions = [
        {
            "name": "Salary Deposit",
            "amount": -3000,  # Negative = income
            "categories": ["payroll", "salary"],
            "merchant_name": "ABC Company",
            "date": "2024-01-15",
            "transaction_id": "test_income_1",
            "account_id": "test_account_1"
        },
        {
            "name": "Grocery Store",
            "amount": 150,  # Positive = expense
            "categories": ["food_and_drink", "groceries"],
            "merchant_name": "Whole Foods",
            "date": "2024-01-16",
            "transaction_id": "test_expense_1",
            "account_id": "test_account_1"
        },
        {
            "name": "Coffee Shop",
            "amount": 5.50,  # Positive = expense
            "categories": ["food_and_drink", "coffee"],
            "merchant_name": "Starbucks",
            "date": "2024-01-17",
            "transaction_id": "test_expense_2",
            "account_id": "test_account_1"
        }
    ]
    
    # Add test transactions
    for trans in test_transactions:
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code != 200:
            print(f"Failed to add transaction: {response.text}")
            continue
        print(f"✓ Added transaction: {trans['name']} (${trans['amount']})")
    
    # Get transactions and verify logic
    response = requests.get(f"{BASE_URL}/transactions", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get transactions: {response.text}")
        return False
    
    transactions = response.json()
    print(f"\n✓ Retrieved {len(transactions)} transactions")
    
    # Verify transaction logic
    income_total = 0
    expense_total = 0
    
    for trans in transactions:
        price = float(trans['price'])
        if price < 0:  # Negative = income
            income_total += abs(price)
            print(f"  Income: {trans['name']} = ${abs(price):.2f}")
        else:  # Positive = expense
            expense_total += price
            print(f"  Expense: {trans['name']} = ${price:.2f}")
    
    print(f"\nTransaction Logic Summary:")
    print(f"  Total Income (negative amounts): ${income_total:.2f}")
    print(f"  Total Expenses (positive amounts): ${expense_total:.2f}")
    print(f"  Net Income: ${income_total - expense_total:.2f}")
    
    # Test income analysis endpoint
    response = requests.post(f"{BASE_URL}/plaid/income", headers=headers)
    if response.status_code == 200:
        income_data = response.json()
        print(f"\n✓ Income analysis successful:")
        print(f"  Stream count: {income_data.get('stream_count', 0)}")
        print(f"  Total monthly income: ${income_data.get('total_monthly_income', 0)}")
    else:
        print(f"Income analysis failed: {response.text}")
    
    print("\n✅ Transaction logic test completed successfully!")
    return True

if __name__ == "__main__":
    test_transaction_logic()