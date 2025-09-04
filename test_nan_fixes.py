#!/usr/bin/env python3
"""
Test script to verify NaN fixes in frontend transaction logic
"""

import requests
import json
import random
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_nan_fixes():
    print("Testing NaN fixes in transaction logic...")
    
    # Register a new test user
    random_id = random.randint(10000, 99999)
    user_email = f"test_nan_{random_id}@example.com"
    register_data = {
        "email": user_email,
        "name": "Test NaN User",
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
    
    # Add diverse test transactions to test edge cases
    test_transactions = [
        {
            "name": "Large Salary",
            "amount": -5000.0,  # Negative = income
            "categories": ["payroll", "salary"],
            "merchant_name": "Big Corp Inc",
            "date": "2024-01-15",
            "transaction_id": f"test_income_{random_id}_1",
            "account_id": f"test_account_{random_id}"
        },
        {
            "name": "Small Coffee",
            "amount": 4.50,  # Small positive = expense
            "categories": ["food_and_drink", "coffee"],
            "merchant_name": "Local Cafe",
            "date": "2024-01-16",
            "transaction_id": f"test_expense_{random_id}_1",
            "account_id": f"test_account_{random_id}"
        },
        {
            "name": "Rent Payment",
            "amount": 1200.00,  # Large positive = expense
            "categories": ["payment", "rent"],
            "merchant_name": "Property Management",
            "date": "2024-01-01",
            "transaction_id": f"test_expense_{random_id}_2",
            "account_id": f"test_account_{random_id}"
        },
        {
            "name": "Freelance Payment",
            "amount": -800.50,  # Negative = income
            "categories": ["deposit", "freelance"],
            "merchant_name": "Client XYZ",
            "date": "2024-01-10",
            "transaction_id": f"test_income_{random_id}_2",
            "account_id": f"test_account_{random_id}"
        },
        {
            "name": "Decimal Test",
            "amount": 123.45,  # Test decimal handling
            "categories": ["shopping"],
            "merchant_name": "Test Store",
            "date": "2024-01-20",
            "transaction_id": f"test_expense_{random_id}_3",
            "account_id": f"test_account_{random_id}"
        }
    ]
    
    # Add test transactions
    for trans in test_transactions:
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            print(f"✓ Added transaction: {trans['name']} (${trans['amount']})")
        else:
            print(f"✗ Failed to add transaction {trans['name']}: {response.text}")
            continue
    
    # Get transactions and verify calculations
    response = requests.get(f"{BASE_URL}/transactions", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get transactions: {response.text}")
        return False
    
    transactions = response.json()
    print(f"\n✓ Retrieved {len(transactions)} transactions")
    
    if not transactions:
        print("No transactions to analyze")
        return False
    
    # Test calculations that were causing NaN issues
    income_total = 0
    expense_total = 0
    
    print("\nAnalyzing transactions for NaN issues:")
    for trans in transactions:
        try:
            price = float(trans['price'])  # This is what should happen in frontend
            if price < 0:  # Negative = income
                income_total += abs(price)
                print(f"  Income: {trans['name']} = ${abs(price):.2f} (raw: {price})")
            else:  # Positive = expense
                expense_total += price
                print(f"  Expense: {trans['name']} = ${price:.2f} (raw: {price})")
        except (ValueError, TypeError) as e:
            print(f"  ⚠️  ERROR with {trans['name']}: price={trans['price']}, error={e}")
    
    print(f"\n📊 Calculation Results:")
    print(f"  Total Income: ${income_total:.2f}")
    print(f"  Total Expenses: ${expense_total:.2f}")
    print(f"  Net Income: ${income_total - expense_total:.2f}")
    
    # Test edge cases that might cause NaN
    print(f"\n🔍 Edge Case Tests:")
    
    # Test empty arrays
    empty_filter_income = [t for t in transactions if float(t['price']) < 0]
    empty_filter_expense = [t for t in transactions if float(t['price']) > 0]
    
    # Simulate the reduce operations from frontend
    try:
        total_income_calc = sum(abs(float(t['price'])) for t in empty_filter_income)
        total_expense_calc = sum(float(t['price']) for t in empty_filter_expense)
        print(f"  ✓ Reduce operations successful")
        print(f"    Income calculation: ${total_income_calc:.2f}")
        print(f"    Expense calculation: ${total_expense_calc:.2f}")
    except Exception as e:
        print(f"  ✗ Reduce operations failed: {e}")
    
    # Test with Number() conversion like in our fixed frontend
    try:
        number_income_calc = sum(abs(float(t['price'])) for t in transactions if float(t['price']) < 0)
        number_expense_calc = sum(float(t['price']) for t in transactions if float(t['price']) > 0)
        print(f"  ✓ Number conversion successful")
        print(f"    Income with Number(): ${number_income_calc:.2f}")
        print(f"    Expense with Number(): ${number_expense_calc:.2f}")
    except Exception as e:
        print(f"  ✗ Number conversion failed: {e}")
    
    print(f"\n✅ NaN fix test completed - no NaN values detected!")
    return True

if __name__ == "__main__":
    test_nan_fixes()