import base64
import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def _get_key() -> bytes:
    key_b64 = settings.PAYROLL_AES_KEY
    if not key_b64:
        raise ValueError("PAYROLL_AES_KEY is not set in environment or config.")
    try:
        key = base64.b64decode(key_b64)
    except Exception as e:
        raise ValueError("PAYROLL_AES_KEY must be a valid base64-encoded string.") from e
        
    if len(key) not in (16, 24, 32):
        raise ValueError("PAYROLL_AES_KEY must decode to exactly 16, 24, or 32 bytes for AESGCM.")
    return key


def encrypt_value(value: Optional[float]) -> Optional[str]:
    """
    Encrypts a float value into a secure base64 string using AES-256-GCM.
    Format: base64(nonce + ciphertext)
    Returns None if value is None.
    """
    if value is None:
        return None
        
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Recommended nonce length for GCM
    
    # Convert float to string bytes
    data = str(value).encode('utf-8')
    
    ciphertext = aesgcm.encrypt(nonce, data, None)
    
    # Prepend nonce to ciphertext
    encrypted_bytes = nonce + ciphertext
    return base64.b64encode(encrypted_bytes).decode('utf-8')


def decrypt_value(encrypted_b64: Optional[str]) -> Optional[float]:
    """
    Decrypts a base64 string back into a float using AES-256-GCM.
    Returns None if the string is empty or None.
    """
    if not encrypted_b64:
        return None
        
    key = _get_key()
    aesgcm = AESGCM(key)
    
    try:
        encrypted_bytes = base64.b64decode(encrypted_b64)
        if len(encrypted_bytes) < 12:
            raise ValueError("Invalid encrypted payload length")
            
        nonce = encrypted_bytes[:12]
        ciphertext = encrypted_bytes[12:]
        
        decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
        return float(decrypted_data.decode('utf-8'))
    except Exception as e:
        raise ValueError("Failed to decrypt value. Encryption key might be incorrect or data is corrupted.") from e
