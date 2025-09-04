import hashlib
import hmac
import re
from typing import Any, Dict, List, Optional

from cryptography.fernet import Fernet
from fastapi import HTTPException, status


class SecurityManager:
    def __init__(self, encryption_key: Optional[bytes] = None):
        if encryption_key:
            self.cipher = Fernet(encryption_key)
        else:
            # Generate a key for demo purposes (in production, load from secure storage)
            self.cipher = Fernet(Fernet.generate_key())
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive financial data."""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive financial data."""
        try:
            return self.cipher.decrypt(encrypted_data.encode()).decode()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt data"
            )
    
    def mask_account_number(self, account_number: str) -> str:
        """Mask account number for display (show only last 4 digits)."""
        if len(account_number) <= 4:
            return "*" * len(account_number)
        return "*" * (len(account_number) - 4) + account_number[-4:]
    
    def mask_email(self, email: str) -> str:
        """Partially mask email for privacy."""
        parts = email.split('@')
        if len(parts) != 2:
            return email
        
        username = parts[0]
        domain = parts[1]
        
        if len(username) <= 2:
            masked_username = "*" * len(username)
        else:
            masked_username = username[0] + "*" * (len(username) - 2) + username[-1]
        
        return f"{masked_username}@{domain}"
    
    def hash_transaction_id(self, transaction_id: str, user_id: int) -> str:
        """Create a secure hash of transaction ID for deduplication."""
        message = f"{transaction_id}:{user_id}".encode()
        return hashlib.sha256(message).hexdigest()


class InputValidator:
    """Comprehensive input validation and sanitization."""
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate and sanitize email address."""
        email = email.strip().lower()
        
        # Basic email regex pattern
        email_pattern = re.compile(
            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        )
        
        if not email_pattern.match(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        # Additional checks
        if len(email) > 254:  # Max email length per RFC
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address too long"
            )
        
        return email
    
    @staticmethod
    def validate_password(password: str) -> None:
        """Validate password strength."""
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        if not re.search(r'[A-Z]', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter"
            )
        
        if not re.search(r'[a-z]', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one lowercase letter"
            )
        
        if not re.search(r'\d', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one digit"
            )
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character"
            )
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """Sanitize text input to prevent injection attacks."""
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Trim whitespace
        text = text.strip()
        
        # Limit length
        if len(text) > max_length:
            text = text[:max_length]
        
        # Remove control characters except newlines and tabs
        text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', text)
        
        return text
    
    @staticmethod
    def validate_amount(amount: float) -> float:
        """Validate monetary amount."""
        if amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount cannot be negative"
            )
        
        if amount > 1000000:  # Max transaction amount
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount exceeds maximum allowed value"
            )
        
        # Round to 2 decimal places
        return round(amount, 2)
    
    @staticmethod
    def validate_categories(categories: List[str]) -> List[str]:
        """Validate and sanitize category list."""
        if not categories:
            return []
        
        if len(categories) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many categories (max 10)"
            )
        
        sanitized = []
        for category in categories:
            if not isinstance(category, str):
                continue
            
            # Sanitize each category
            clean_category = InputValidator.sanitize_string(category, max_length=50)
            
            # Only allow alphanumeric, spaces, hyphens, and underscores
            if re.match(r'^[a-zA-Z0-9\s\-_]+$', clean_category):
                sanitized.append(clean_category)
        
        return sanitized
    
    @staticmethod
    def validate_date_range(start_date: Any, end_date: Any) -> None:
        """Validate date range for queries."""
        from datetime import datetime, timedelta
        
        # Check if dates are valid
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before end date"
            )
        
        # Limit date range to 2 years
        max_range = timedelta(days=730)
        if end_date - start_date > max_range:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date range cannot exceed 2 years"
            )
    
    @staticmethod
    def validate_merchant_name(name: str) -> str:
        """Validate and sanitize merchant name."""
        name = InputValidator.sanitize_string(name, max_length=100)
        
        # Remove potentially harmful characters
        name = re.sub(r'[<>\"\'`]', '', name)
        
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid merchant name"
            )
        
        return name


class RateLimiter:
    """Simple in-memory rate limiter for API endpoints."""
    
    def __init__(self):
        self.requests: Dict[str, List[float]] = {}
    
    def check_rate_limit(
        self, 
        key: str, 
        max_requests: int = 100, 
        window_seconds: int = 60
    ) -> bool:
        """Check if rate limit is exceeded."""
        from time import time
        
        current_time = time()
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests outside the window
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if current_time - req_time < window_seconds
        ]
        
        # Check if limit exceeded
        if len(self.requests[key]) >= max_requests:
            return False
        
        # Add current request
        self.requests[key].append(current_time)
        return True


def validate_plaid_webhook(
    webhook_body: bytes,
    signature: str,
    secret: str
) -> bool:
    """Validate Plaid webhook signature for security."""
    expected_signature = hmac.new(
        secret.encode(),
        webhook_body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)