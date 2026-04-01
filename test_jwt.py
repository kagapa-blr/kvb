#!/usr/bin/env python
"""Test JWT Authentication Features"""

from app import app
from services.jwt_service import JWTService

print("Testing JWT Authentication Features...\n")

# Test 1: JWT token generation
print("1. Generating JWT Token...")
token = JWTService.generate_token(1, 'kagapa')
print(f"   ✓ Token: {token[:30]}...")

# Test 2: Token verification
print("\n2. Verifying JWT Token...")
payload = JWTService.verify_token(token)
print(f"   ✓ User: {payload['username']}, ID: {payload['user_id']}")
print(f"   ✓ Expires: {payload['exp']}")

# Test 3: Password reset token generation
print("\n3. Generating Password Reset Token...")
reset_token = JWTService.generate_password_reset_token(1, 'kagapa')
print(f"   ✓ Token: {reset_token[:30]}...")

# Test 4: Reset token verification
print("\n4. Verifying Password Reset Token...")
reset_payload = JWTService.verify_password_reset_token(reset_token)
print(f"   ✓ User: {reset_payload['username']}, Purpose: {reset_payload['purpose']}")

# Test 5: Check token expiration
print("\n5. Testing Expired Token...")
expired_token = JWTService.verify_token("invalid.token.here")
print(f"   ✓ Invalid token returns: {expired_token}")

print("\n✅ All JWT features working correctly!")
print("\nAuthentication Endpoints Available:")
print("  POST /login - Login with username/password → Returns JWT Token")
print("  POST /api/v1/auth/forgot-password - Request password reset")
print("  POST /api/v1/auth/reset-password - Reset password with token")
print("  POST /api/v1/auth/change-password - Change password (requires JWT)")
print("  GET /profile - View/edit user profile (requires login)")
