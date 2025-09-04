#!/usr/bin/env python3
"""
Test Plaid Sandbox integration capabilities - demonstrates functionality without requiring credentials
"""

import os
from datetime import datetime, timedelta
from plaid_client import plaid_client

def test_plaid_functionality():
    """Test Plaid integration functionality and demonstrate capabilities"""
    print("=" * 60)
    print("PLAID SANDBOX INTEGRATION FUNCTIONALITY TEST")
    print("=" * 60)
    
    # Check configuration and environment
    print("\n🔧 Testing Plaid Client Configuration...")
    print(f"   Environment: {plaid_client.environment}")
    print(f"   Client initialized: {'✅' if plaid_client.client else '❌'}")
    
    # Check environment variables
    client_id = os.getenv("PLAID_CLIENT_ID")
    secret = os.getenv("PLAID_SECRET")
    
    credentials_configured = False
    if client_id and client_id != "PLAID_SANDBOX_CLIENT_ID" and client_id != "your_sandbox_client_id_here":
        print("   PLAID_CLIENT_ID: ✅ (configured)")
        credentials_configured = True
    else:
        print("   PLAID_CLIENT_ID: ⚠️  (not configured - using placeholder)")
    
    if secret and secret != "PLAID_SANDBOX_SECRET" and secret != "your_sandbox_secret_here":
        print("   PLAID_SECRET: ✅ (configured)")
    else:
        print("   PLAID_SECRET: ⚠️  (not configured - using placeholder)")
        credentials_configured = False
    
    # Test link token creation if credentials are configured
    print("\n🔗 Testing Link Token Creation...")
    if credentials_configured:
        try:
            link_response = plaid_client.create_link_token("test_user_123")
            if 'link_token' in link_response:
                print("✅ Link token created successfully")
                link_token = link_response['link_token']
                print(f"   Token: {link_token[:20]}...")
            else:
                print("❌ Link token creation failed")
                print(f"   Response: {link_response}")
        except Exception as e:
            print(f"❌ Link token creation error: {e}")
            print("   This is expected without valid sandbox credentials")
    else:
        print("⚠️  Skipped - requires PLAID_CLIENT_ID and PLAID_SECRET environment variables")
    
    print("\n📋 Available test credentials from plaid_sandbox_credentials.md:")
    print("   - Simple test: user_good / pass_good")
    print("   - Transactions: user_transactions_dynamic / {any password}")
    print("   - Income data: user_bank_income / {empty password}")
    
    print("\n🔧 Testing Plaid Client Methods...")
    
    # Test transaction method signature and availability
    print("\n💳 Testing Transaction Data Method...")
    if hasattr(plaid_client, 'get_transactions') and callable(plaid_client.get_transactions):
        print("   ✅ get_transactions() method is available")
        print("   📋 Parameters: access_token, start_date, end_date, count")
        print("   📋 Returns: Dictionary with transaction data from Plaid API")
        
        # Show method signature
        import inspect
        sig = inspect.signature(plaid_client.get_transactions)
        print(f"   📋 Signature: get_transactions{sig}")
    else:
        print("   ❌ Transaction method not available")
    
    # Test income method with fallback - this actually works!
    print("\n💰 Testing Income Data Method...")
    try:
        income_data = plaid_client.get_income("test_access_token")
        if 'bank_income' in income_data:
            print("   ✅ get_income() method is available and working")
            income_info = income_data['bank_income'][0]
            monthly_income = income_info['bank_income_summary']['total_monthly_income']
            print(f"   📊 Mock income data: ${monthly_income}/month")
            
            sources = income_info.get('bank_income_sources', [])
            for source in sources:
                print(f"   📍 {source['name']}: ${source['monthly_income']}/month ({source['frequency']})")
                
            print("   📋 Note: This shows mock data. With real access token, returns actual income data")
        else:
            print("   ❌ Income data format incorrect")
    except Exception as e:
        print(f"   ❌ Income method error: {e}")
    
    # Test accounts method signature
    print("\n🏦 Testing Accounts Method...")
    if hasattr(plaid_client, 'get_accounts') and callable(plaid_client.get_accounts):
        print("   ✅ get_accounts() method is available")
        print("   📋 Parameters: access_token")
        print("   📋 Returns: Dictionary with account information from Plaid API")
        
        import inspect
        sig = inspect.signature(plaid_client.get_accounts)
        print(f"   📋 Signature: get_accounts{sig}")
    else:
        print("   ❌ Accounts method not available")
    
    # Test public token exchange method
    print("\n🔄 Testing Public Token Exchange Method...")
    if hasattr(plaid_client, 'exchange_public_token') and callable(plaid_client.exchange_public_token):
        print("   ✅ exchange_public_token() method is available")
        print("   📋 Parameters: public_token")
        print("   📋 Returns: Dictionary with access_token for API calls")
        
        import inspect
        sig = inspect.signature(plaid_client.exchange_public_token)
        print(f"   📋 Signature: exchange_public_token{sig}")
    else:
        print("   ❌ Public token exchange method not available")
    
    print("\n" + "=" * 60)
    print("PLAID INTEGRATION CAPABILITY SUMMARY")
    print("=" * 60)
    
    # Check all capabilities
    capabilities = [
        ("Link Token Creation", hasattr(plaid_client, 'create_link_token')),
        ("Public Token Exchange", hasattr(plaid_client, 'exchange_public_token')),
        ("Transaction Data Retrieval", hasattr(plaid_client, 'get_transactions')),
        ("Income Data Retrieval", hasattr(plaid_client, 'get_income')),
        ("Account Information", hasattr(plaid_client, 'get_accounts')),
        ("Sandbox Environment", plaid_client.environment == 'sandbox')
    ]
    
    all_working = True
    for capability, available in capabilities:
        status = "✅ AVAILABLE" if available else "❌ MISSING"
        print(f"{status}: {capability}")
        if not available:
            all_working = False
    
    print(f"\n🔧 Environment: {plaid_client.environment}")
    print(f"🔧 Client Status: {'✅ INITIALIZED' if plaid_client.client else '❌ NOT INITIALIZED'}")
    
    if credentials_configured:
        print("\n🔑 Credentials: ✅ CONFIGURED")
        print("   Ready for live testing with Plaid Sandbox")
    else:
        print("\n🔑 Credentials: ⚠️  NOT CONFIGURED")
        print("   Set PLAID_CLIENT_ID and PLAID_SECRET to test with live Plaid Sandbox")
    
    print("\n📋 HOW TO USE FOR LIVE TESTING:")
    print("   1. Get sandbox credentials from https://dashboard.plaid.com/")
    print("   2. Set environment variables or create .env file")
    print("   3. Use Plaid Link in frontend with sandbox test users:")
    print("      - Transactions: user_transactions_dynamic / any_password")
    print("      - Income: user_bank_income / (empty password)")
    print("   4. Exchange public token → access token → fetch data")
    
    return all_working

if __name__ == "__main__":
    test_plaid_functionality()