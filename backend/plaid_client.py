import os
from typing import Dict, List, Any
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from datetime import datetime, timedelta

class PlaidClient:
    def __init__(self):
        # These should be environment variables in production
        self.client_id = os.getenv("PLAID_CLIENT_ID", "your_client_id")
        self.secret = os.getenv("PLAID_SECRET", "your_secret_key")
        self.environment = os.getenv("PLAID_ENV", "sandbox")  # sandbox, development, or production
        
        # Configure Plaid client
        if self.environment == "sandbox":
            host = plaid_api.PlaidEnvironment.sandbox
        elif self.environment == "development":
            host = plaid_api.PlaidEnvironment.development
        else:
            host = plaid_api.PlaidEnvironment.production
            
        configuration = Configuration(
            host=host,
            api_key={
                'clientId': self.client_id,
                'secret': self.secret
            }
        )
        api_client = ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)
    
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
        start_date: datetime = None, 
        end_date: datetime = None,
        count: int = 100
    ) -> Dict[str, Any]:
        """Get transactions from Plaid"""
        if start_date is None:
            start_date = datetime.now() - timedelta(days=30)
        if end_date is None:
            end_date = datetime.now()
            
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date.date(),
            end_date=end_date.date(),
            count=count
        )
        
        response = self.client.transactions_get(request)
        return response.to_dict()

# Singleton instance
plaid_client = PlaidClient()