from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.security import hash_password, verify_password
from app.modules.auth.models import User
from app.modules.auth.schemas import UserCreate

DUMMY_PASSWORD_HASH = hash_password("dummy-password-for-timing")

class EmailAlreadyRegistered(Exception):
    pass

def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        email=str(data.email),
        password_hash=hash_password(data.password),
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()

        if getattr(exc.orig, "sqlstate", None) == "23505":
            raise EmailAlreadyRegistered() from exc

        raise
    db.refresh(user)
    return user

def authenticate_user(
        db: Session,
        email: str,
        password: str,
) -> User | None:
    user = db.scalar(
        select(User).where(User.email == email),
    )

    stored_hash = (
        user.password_hash if user is not None else DUMMY_PASSWORD_HASH
    )
    password_matches = verify_password(password, stored_hash)

    if user is None or not password_matches:
        return None

    return user