#!/usr/bin/env python3
"""
Test the new income analysis endpoint
"""

import requests
import json
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_new_income_endpoint():
    print("Testing new income analysis endpoint...")
    
    # Use the existing user from previous test
    random_id = random.randint(10000, 99999)
    user_email = f"test_new_income_{random_id}@example.com"
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
    
    # Add recurring income transactions
    base_date = datetime(2024, 1, 1)
    
    # Add 4 monthly salary payments
    for i in range(4):
        salary_date = base_date + timedelta(days=30 * i)
        trans = {
            "name": "Monthly Salary",
            "amount": -5000.0,  # Negative = income
            "categories": ["payroll", "salary"],
            "merchant_name": "Tech Company Inc",
            "date": salary_date.strftime("%Y-%m-%d"),
            "transaction_id": f"salary_new_{random_id}_{i}",
            "account_id": f"checking_new_{random_id}"
        }
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            print(f"✓ Added salary payment: ${trans['amount']} on {trans['date']}")
        else:
            print(f"✗ Failed to add salary: {response.text}")
    
    # Add 3 freelance payments
    for i in range(3):
        freelance_date = base_date + timedelta(days=45 * i)
        trans = {
            "name": "Freelance Project Payment",
            "amount": -1500.0,  # Negative = income
            "categories": ["transfer", "freelance"],
            "merchant_name": "Freelance Client LLC",
            "date": freelance_date.strftime("%Y-%m-%d"),
            "transaction_id": f"freelance_new_{random_id}_{i}",
            "account_id": f"checking_new_{random_id}"
        }
        response = requests.post(f"{BASE_URL}/plaid/transaction", json=trans, headers=headers)
        if response.status_code == 200:
            print(f"✓ Added freelance payment: ${trans['amount']} on {trans['date']}")
        else:
            print(f"✗ Failed to add freelance: {response.text}")
    
    print(f"\n🔍 Testing NEW income analysis endpoint...")
    
    # Test the new income analysis endpoint
    response = requests.post(f"{BASE_URL}/income/analysis", headers=headers)
    if response.status_code == 200:
        income_data = response.json()
        print(f"✅ NEW Income analysis successful!")
        print(f"  Stream count: {income_data.get('stream_count', 0)}")
        print(f"  Total monthly income: ${income_data.get('total_monthly_income', 0):.2f}")
        print(f"  Message: {income_data.get('message', 'N/A')}")
        
        streams = income_data.get('income_streams', [])
        if streams:
            print(f"\n📊 Detected Income Streams:")
            for i, stream in enumerate(streams, 1):
                print(f"  {i}. {stream.get('name', 'Unknown')}")
                print(f"     Account: {stream.get('account_name', 'Unknown')}")
                print(f"     Monthly Income: ${stream.get('monthly_income', 0):.2f}")
                print(f"     Frequency: {stream.get('frequency', 'unknown')}")
                print(f"     Confidence: {stream.get('confidence', 0):.1%}")
                print(f"     Days of Data: {stream.get('days_available', 0)}")
                print()
        else:
            print("  ⚠️  No income streams detected")
            
        return True
            
    else:
        print(f"✗ NEW Income analysis failed: {response.text}")
        return False

if __name__ == "__main__":
    test_new_income_endpoint()