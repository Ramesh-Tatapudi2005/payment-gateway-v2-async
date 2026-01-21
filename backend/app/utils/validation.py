import re
from datetime import datetime

import re

def validate_vpa(vpa: str) -> bool:
    """
    Validates the format of a UPI Virtual Payment Address (VPA).
    Format: username@bankname
    """
    if not vpa or "@" not in vpa:
        return False
    
    # Regex: Alphanumeric (including . -) before @, and alphabetic after @
    # Standard length: 2-256 chars for username, 2-64 for handle
    vpa_regex = r"^[a-zA-Z0-9.-]{2,256}@[a-zA-Z]{2,64}$"
    return bool(re.match(vpa_regex, vpa))

def validate_luhn(card_number: str) -> bool:
    """Implements the mathematical Mod 10 Luhn check."""
    # Remove any non-digit characters
    card_number = "".join(filter(str.isdigit, card_number))
    
    if not card_number or not (13 <= len(card_number) <= 19):
        return False

    # Convert to list of integers
    digits = [int(d) for d in card_number]
    
    # Luhn logic: reverse and double every second digit
    # We start from the right (check digit) and move left
    check_digits = digits[::-1]
    for i in range(1, len(check_digits), 2):
        check_digits[i] *= 2
        if check_digits[i] > 9:
            check_digits[i] -= 9
            
    return sum(check_digits) % 10 == 0



def detect_card_network(card_number: str) -> str:
    """Detects card brand based on leading digits (IIN/BIN)."""
    # Clean the input
    n = "".join(filter(str.isdigit, card_number))
    if not n:
        return "unknown"
        
    # Visa: Starts with 4
    if n.startswith('4'):
        return "visa"
    
    # Mastercard: 51–55 OR 2221–2720
    prefix2 = int(n[:2]) if len(n) >= 2 else 0
    prefix4 = int(n[:4]) if len(n) >= 4 else 0
    
    if (51 <= prefix2 <= 55) or (2221 <= prefix4 <= 2720):
        return "mastercard"
        
    # Amex: 34 or 37
    if prefix2 in [34, 37]:
        return "amex"
        
    # RuPay: 60, 65, or 81–89
    if prefix2 in [60, 65] or (81 <= prefix2 <= 89):
        return "rupay"
        
    return "unknown"

def validate_expiry(month, year):
    """Checks if the card expiry date is valid and in the future."""
    try:
        month = int(month)
        year = int(year)
        
        # Handle 4-digit year conversion (2028 -> 28)
        if year > 1000:
            year = year % 100
            
        now = datetime.now()
        current_year = now.year % 100 
        current_month = now.month
        
        if not (1 <= month <= 12):
            return False
            
        # If year is in the past
        if year < current_year:
            return False
        # If year is current but month is past
        if year == current_year and month < current_month:
            return False
            
        return True
    except (ValueError, TypeError):
        return False