from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.modules.auth.models import User

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
        credentials: Annotated[
            HTTPAuthorizationCredentials | None,
            Depends(bearer_scheme),
            ],
            db: Annotated[Session, Depends(get_db)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])

        if not 0 < user_id <= 2147483647:
            raise ValueError("Invalid user ID")
    except (InvalidTokenError, ValueError, TypeError) as exc:
        raise unauthorized from exc

    user = db.get(User, user_id)

    if user is None:
        raise unauthorized

    return user