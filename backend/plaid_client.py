"""
Plaid Sandbox Integration - FOR TESTING ONLY
===========================================

This module provides Plaid API integration for SANDBOX environment only.
NO PRODUCTION OR REAL BANK DATA is accessed.

Test credentials from plaid_sandbox_credentials.md:
- Simple test: user_good / pass_good
- Transactions: user_transactions_dynamic / {any password}
- Income data: user_bank_income / {empty password}

To use this integration:
1. Get sandbox credentials from https://dashboard.plaid.com/
2. Set PLAID_CLIENT_ID and PLAID_SECRET environment variables
3. Use the test credentials above in Plaid Link during development
"""

import os
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from plaid.api.plaid_api import PlaidApi
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.link_token_create_request_auth import LinkTokenCreateRequestAuth
from plaid.model.sandbox_public_token_create_request import SandboxPublicTokenCreateRequest
from plaid.model.credit_bank_income_get_request import CreditBankIncomeGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from datetime import datetime, timedelta

class PlaidClient:
    def __init__(self):
        # SANDBOX ONLY - Safety check to prevent production usage
        environment = os.getenv("PLAID_ENV", "sandbox")
        if environment != "sandbox":
            raise ValueError("This client is configured for SANDBOX ONLY. Production access is not allowed.")
        
        # Sandbox-only credentials - get your own from https://dashboard.plaid.com/
        self.client_id = os.getenv("PLAID_CLIENT_ID", "PLAID_SANDBOX_CLIENT_ID")
        self.secret = os.getenv("PLAID_SECRET", "PLAID_SANDBOX_SECRET")
        self.environment = "sandbox"  # ALWAYS sandbox - no production access
        
        # Configure Plaid client - SANDBOX ONLY
        from plaid import Environment
        host = Environment.Sandbox  # Always use sandbox environment
            
        configuration = Configuration(
            host=host,
            api_key={
                'clientId': self.client_id,
                'secret': self.secret
            }
        )
        api_client = ApiClient(configuration)
        self.client = PlaidApi(api_client)
    
    def create_link_token(self, user_id: str) -> Dict[str, Any]:
        """Create a link token for Plaid Link initialization"""
        request = LinkTokenCreateRequest(
            products=[Products('transactions')],
            client_name="Smart Financial Coach",
            country_codes=[CountryCode('US')],
            language='en',
            user=LinkTokenCreateRequestUser(client_user_id=user_id)
        )
        
        response = self.client.link_token_create(request)
        return response.to_dict()
    
    def create_sandbox_public_token(self, institution_id: str = 'ins_109508') -> Dict[str, Any]:
        """Create a sandbox public token directly (bypasses OAuth)"""
        request = SandboxPublicTokenCreateRequest(
            institution_id=institution_id,
            initial_products=[Products('transactions')]
        )
        
        response = self.client.sandbox_public_token_create(request)
        return response.to_dict()
    
    def exchange_public_token(self, public_token: str) -> Dict[str, Any]:
        """Exchange public token for access token"""
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self.client.item_public_token_exchange(request)
        return response.to_dict()
    
    def get_accounts(self, access_token: str) -> Dict[str, Any]:
        """Get account information"""
        request = AccountsGetRequest(access_token=access_token)
        response = self.client.accounts_get(request)
        return response.to_dict()
    
    def get_transactions(
        self, 
        access_token: str, 
        start_date: datetime = datetime.now() - timedelta(days=365), 
        end_date: datetime = datetime.now()
    ) -> Dict[str, Any]:
        """Get transactions from Plaid"""
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date.date(),
            end_date=end_date.date()
        )
        
        response = self.client.transactions_get(request)
        return response.to_dict()
    
    def get_income(self, access_token: str) -> Dict[str, Any]:
        """Get income information from Plaid using Bank Income product"""
        request = CreditBankIncomeGetRequest(access_token=access_token)
        response = self.client.credit_bank_income_get(request)
        return response.to_dict()

# Singleton instance
plaid_client = PlaidClient()
