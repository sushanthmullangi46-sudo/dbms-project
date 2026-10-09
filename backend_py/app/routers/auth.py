from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import UserAccount, Role, Citizen
from app.schemas.dtos import UserRegister, UserLogin, TokenResponse, UserProfile
from app.auth.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(UserAccount).filter(UserAccount.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    role = db.query(Role).filter(Role.role_name == user_in.role_name.upper()).first()
    if not role:
        # Default fallback to CITIZEN if not found
        role = db.query(Role).filter(Role.role_name == "CITIZEN").first()

    user = UserAccount(
        role_id=role.role_id,
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        account_status="ACTIVE"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if role.role_name == "CITIZEN":
        citizen = Citizen(
            user_id=user.user_id,
            address=user_in.address,
            emergency_contact=user_in.emergency_contact,
            special_needs=user_in.special_needs
        )
        db.add(citizen)
        db.commit()

    token = create_access_token({"user_id": user.user_id, "role": role.role_name})
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        role=role.role_name
    )

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.account_status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended or deactivated")

    token = create_access_token({"user_id": user.user_id, "role": user.role.role_name})
    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.role_name
    )

@router.get("/me", response_model=UserProfile)
def get_profile(current_user: UserAccount = Depends(get_current_user)):
    return UserProfile(
        user_id=current_user.user_id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role.role_name,
        phone=current_user.phone,
        created_at=current_user.created_at
    )
