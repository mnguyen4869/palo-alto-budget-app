#!/usr/bin/env python3

"""
Integration test to verify complete category parsing workflow
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import extract_plaid_category_data, app
from data.data_models import Transaction, User
from schemas import TransactionResponse
from sqlmodel import Session, create_engine, select
from decimal import Decimal
from datetime import datetime, date

def test_transaction_creation_with_categories():
    """Test creating a transaction with full category data"""
    print("Testing transaction creation with category data...")
    
    # Sample transaction data with category information
    sample_plaid_transaction = {
        "transaction_id": "test_transaction_12345",
        "name": "McDonald's",
        "amount": 12.50,
        "merchant_name": "McDonald's",
        "date": "2024-01-15",
        "account_id": "test_account_123",
        "personal_finance_category": {
            "primary": "FOOD_AND_DRINK",
            "detailed": "FOOD_AND_DRINK_FAST_FOOD", 
            "confidence_level": "HIGH",
            "icon_url": "https://plaid.com/categories/icon/food-and-drink"
        }
    }
    
    # Extract category data
    category_data = extract_plaid_category_data(
        sample_plaid_transaction.get('personal_finance_category', {})
    )
    
    print("Category extraction results:")
    print(f"  Primary: {category_data['primary']}")
    print(f"  Detailed: {category_data['detailed']}")
    print(f"  Confidence: {category_data['confidence_level']}")
    print(f"  Icon URL: {category_data['icon_url']}")
    
    # Create transaction object
    transaction = Transaction(
        user_id=1,  # Assuming user ID 1 exists
        name=sample_plaid_transaction.get('name', 'Unknown'),
        price=Decimal(str(sample_plaid_transaction.get('amount'))),
        category_primary=category_data.get('primary'),
        category_detailed=category_data.get('detailed'),
        category_confidence_level=category_data.get('confidence_level'),
        category_icon_url=category_data.get('icon_url'),
        merchant_name=sample_plaid_transaction.get('merchant_name'),
        date_of_transaction=datetime.strptime(sample_plaid_transaction.get('date'), '%Y-%m-%d').date(),
        plaid_transaction_id=sample_plaid_transaction.get('transaction_id'),
        account_id=sample_plaid_transaction.get('account_id')
    )
    
    print("\nTransaction object created:")
    print(f"  Name: {transaction.name}")
    print(f"  Price: {transaction.price}")
    print(f"  Primary category: {transaction.category_primary}")
    print(f"  Detailed category: {transaction.category_detailed}")
    print(f"  Confidence level: {transaction.category_confidence_level}")
    print(f"  Icon URL: {transaction.category_icon_url}")
    
    # Verify all category fields are populated correctly
    assert transaction.category_primary == "FOOD_AND_DRINK"
    assert transaction.category_detailed == "FOOD_AND_DRINK_FAST_FOOD"
    assert transaction.category_confidence_level == "HIGH"
    assert transaction.category_icon_url == "https://plaid.com/categories/icon/food-and-drink"
    
    print("✅ Transaction creation test passed!")

def test_transaction_response_schema():
    """Test that the TransactionResponse schema includes all new category fields"""
    print("\nTesting TransactionResponse schema...")
    
    # Create sample transaction data
    transaction_data = {
        "id": 1,
        "user_id": 1,
        "name": "Test Transaction",
        "price": Decimal("25.99"),
        "category_primary": "ENTERTAINMENT",
        "category_detailed": "ENTERTAINMENT_MOVIES_AND_TV",
        "category_confidence_level": "VERY_HIGH", 
        "category_icon_url": "https://plaid.com/categories/icon/entertainment",
        "merchant_name": "Netflix",
        "date_of_transaction": date(2024, 1, 15),
        "plaid_transaction_id": "test_123",
        "account_id": "account_123",
        "created_at": datetime.now()
    }
    
    # Create TransactionResponse object
    response = TransactionResponse(**transaction_data)
    
    print("TransactionResponse created:")
    print(f"  Primary category: {response.category_primary}")
    print(f"  Detailed category: {response.category_detailed}")
    print(f"  Confidence level: {response.category_confidence_level}")
    print(f"  Icon URL: {response.category_icon_url}")
    
    # Verify all new fields are present
    assert hasattr(response, 'category_primary')
    assert hasattr(response, 'category_detailed')
    assert hasattr(response, 'category_confidence_level')
    assert hasattr(response, 'category_icon_url')
    
    assert response.category_primary == "ENTERTAINMENT"
    assert response.category_detailed == "ENTERTAINMENT_MOVIES_AND_TV"
    assert response.category_confidence_level == "VERY_HIGH"
    assert response.category_icon_url == "https://plaid.com/categories/icon/entertainment"
    
    print("✅ TransactionResponse schema test passed!")

def test_edge_cases():
    """Test edge cases for category parsing"""
    print("\nTesting edge cases...")
    
    # Test with missing detailed category
    category_1 = {
        "primary": "BANK_FEES",
        "confidence_level": "VERY_HIGH",
        "icon_url": "https://plaid.com/categories/icon/bank-fees"
    }
    
    result_1 = extract_plaid_category_data(category_1)
    print(f"Missing detailed category: {result_1}")
    assert result_1['detailed'] is None
    
    # Test with missing primary category
    category_2 = {
        "detailed": "TRANSFER_IN_DEPOSIT",
        "confidence_level": "LOW"
    }
    
    result_2 = extract_plaid_category_data(category_2)
    print(f"Missing primary category: {result_2}")
    assert result_2['primary'] is None
    
    # Test with completely empty category
    result_3 = extract_plaid_category_data({})
    print(f"Empty category: {result_3}")
    assert all(v is None for v in result_3.values())
    
    print("✅ Edge cases test passed!")

if __name__ == "__main__":
    test_transaction_creation_with_categories()
    test_transaction_response_schema()
    test_edge_cases()
    print("\n🎉 All integration tests completed successfully!")