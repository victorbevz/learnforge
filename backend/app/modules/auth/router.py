from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.modules.auth.service import (
    EmailAlreadyRegistered,
    authenticate_user,
    create_user,
)


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return create_user(db, data)
    except EmailAlreadyRegistered as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from exc


@router.post("/login", response_model=TokenResponse)
def login(
    data: UserLogin,
    db: Annotated[Session, Depends(get_db)],
):
    user = authenticate_user(
        db,
        email=str(data.email),
        password=data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
    )


@router.get("/me", response_model=UserRead)
def me(
    user: Annotated[User, Depends(get_current_user)],
):
    return user