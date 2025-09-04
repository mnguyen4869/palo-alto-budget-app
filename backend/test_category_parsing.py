#!/usr/bin/env python3

"""
Test script to verify Plaid transaction category parsing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import extract_plaid_category_data

def test_extract_plaid_category_data():
    """Test the extract_plaid_category_data function"""
    print("Testing Plaid category data extraction...")
    
    # Test case 1: Full category data
    test_category_1 = {
        'primary': 'FOOD_AND_DRINK',
        'detailed': 'FOOD_AND_DRINK_RESTAURANTS',
        'confidence_level': 'VERY_HIGH',
        'icon_url': 'https://plaid.com/categories/icon/food-and-drink'
    }
    
    result_1 = extract_plaid_category_data(test_category_1)
    print("Test 1 - Full category data:")
    print(f"  Input: {test_category_1}")
    print(f"  Output: {result_1}")
    print()
    
    assert result_1['primary'] == 'FOOD_AND_DRINK'
    assert result_1['detailed'] == 'FOOD_AND_DRINK_RESTAURANTS'
    assert result_1['confidence_level'] == 'VERY_HIGH'
    assert result_1['icon_url'] == 'https://plaid.com/categories/icon/food-and-drink'
    
    # Test case 2: Minimal category data
    test_category_2 = {
        'primary': 'TRANSPORTATION',
        'detailed': None,
        'confidence_level': 'MEDIUM',
        'icon_url': None
    }
    
    result_2 = extract_plaid_category_data(test_category_2)
    print("Test 2 - Minimal category data:")
    print(f"  Input: {test_category_2}")
    print(f"  Output: {result_2}")
    print()
    
    assert result_2['primary'] == 'TRANSPORTATION'
    assert result_2['detailed'] is None
    assert result_2['confidence_level'] == 'MEDIUM'
    assert result_2['icon_url'] is None
    
    # Test case 3: Empty category data
    test_category_3 = {}
    
    result_3 = extract_plaid_category_data(test_category_3)
    print("Test 3 - Empty category data:")
    print(f"  Input: {test_category_3}")
    print(f"  Output: {result_3}")
    print()
    
    assert result_3['primary'] is None
    assert result_3['detailed'] is None
    assert result_3['confidence_level'] is None
    assert result_3['icon_url'] is None
    
    # Test case 4: None input
    result_4 = extract_plaid_category_data(None)
    print("Test 4 - None input:")
    print(f"  Input: None")
    print(f"  Output: {result_4}")
    print()
    
    assert result_4['primary'] is None
    assert result_4['detailed'] is None
    assert result_4['confidence_level'] is None
    assert result_4['icon_url'] is None
    
    print("✅ All tests passed!")

def test_sample_plaid_response():
    """Test with a realistic Plaid transaction response structure"""
    print("\nTesting with sample Plaid transaction response...")
    
    sample_transaction = {
        "transaction_id": "test_123",
        "name": "Starbucks",
        "amount": 5.95,
        "merchant_name": "Starbucks",
        "date": "2023-11-15",
        "account_id": "test_account",
        "personal_finance_category": {
            "primary": "FOOD_AND_DRINK",
            "detailed": "FOOD_AND_DRINK_COFFEE",
            "confidence_level": "VERY_HIGH",
            "icon_url": "https://plaid.com/categories/icon/food-and-drink"
        }
    }
    
    category_data = extract_plaid_category_data(sample_transaction.get('personal_finance_category', {}))
    
    print("Sample Plaid transaction category:")
    print(f"  Transaction: {sample_transaction['name']} - ${sample_transaction['amount']}")
    print(f"  Category data: {category_data}")
    
    expected_data = {
        "primary": "FOOD_AND_DRINK",
        "detailed": "FOOD_AND_DRINK_COFFEE", 
        "confidence_level": "VERY_HIGH",
        "icon_url": "https://plaid.com/categories/icon/food-and-drink"
    }
    
    print(f"  Expected: {expected_data}")
    assert category_data == expected_data
    print("✅ Sample transaction test passed!")

if __name__ == "__main__":
    test_extract_plaid_category_data()
    test_sample_plaid_response()
    print("\n🎉 All category parsing tests completed successfully!")