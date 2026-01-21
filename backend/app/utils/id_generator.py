import secrets
import string

def generate_custom_id(prefix: str) -> str:
    """Generates a prefix followed by exactly 16 alphanumeric characters."""
    alphabet = string.ascii_letters + string.digits
    unique_part = ''.join(secrets.choice(alphabet) for _ in range(16))
    return f"{prefix}{unique_part}"