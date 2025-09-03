#!/usr/bin/env python3
"""
Simple test script to verify the backend API endpoints work
"""

import requests
import json
from decimal import Decimal

BASE_URL = "http://localhost:8000"

def test_registration_and_login():
    print("Testing user registration and login...")
    
    # Test user registration
    user_data = {
        "email": "test@example.com",
        "name": "Test User",
        "password": "TestPassword123"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=user_data)
    print(f"Registration: {response.status_code}")
    if response.status_code == 200:
        print(f"User created: {response.json()}")
    
    # Test login
    login_data = {
        "username": "test@example.com",
        "password": "TestPassword123"
    }
    
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    print(f"Login: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"Token received: {token_data['token_type']}")
        return token_data['access_token']
    
    return None

def test_protected_endpoints(token):
    if not token:
        print("No token available, skipping protected endpoint tests")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /me endpoint
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    print(f"Profile: {response.status_code}")
    if response.status_code == 200:
        print(f"User profile: {response.json()}")
    
    # Test creating a goal
    goal_data = {
        "title": "Emergency Fund",
        "description": "Save for emergencies",
        "target_amount": "1000.00",
        "target_date": "2024-12-31"
    }
    
    response = requests.post(f"{BASE_URL}/goals", json=goal_data, headers=headers)
    print(f"Create goal: {response.status_code}")
    if response.status_code == 200:
        goal = response.json()
        print(f"Goal created: {goal['title']}")
        
        # Test getting goals
        response = requests.get(f"{BASE_URL}/goals", headers=headers)
        print(f"Get goals: {response.status_code}")
        if response.status_code == 200:
            goals = response.json()
            print(f"Found {len(goals)} goals")

def test_public_endpoints():
    print("Testing public endpoints...")
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Root endpoint: {response.status_code}")
    if response.status_code == 200:
        print(f"API info: {response.json()}")

if __name__ == "__main__":
    print("Starting API tests...")
    print("Make sure the server is running on http://localhost:8000")
    print("Run: uvicorn main:app --reload")
    print("-" * 50)
    
    try:
        test_public_endpoints()
        token = test_registration_and_login()
        test_protected_endpoints(token)
        print("-" * 50)
        print("Tests completed!")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the API. Make sure the server is running.")
    except Exception as e:
        print(f"ERROR: {e}")