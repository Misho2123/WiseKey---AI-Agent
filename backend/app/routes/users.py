from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_access_token
from app.routes.auth import _USERS

router = APIRouter(prefix="/users", tags=["users"])

bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    payload = decode_access_token(creds.credentials)
    email = (payload.get("sub") or "").lower()

    user = _USERS.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "email": user["email"],
        "role": user["role"],
        "full_name": user.get("full_name"),
    }

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return current_user
