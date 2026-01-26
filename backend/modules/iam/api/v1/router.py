from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from pydantic import BaseModel

from core.database import get_db, settings
from modules.iam.domain.models import User, UserRole
from modules.iam.application.security import create_access_token, verify_password, get_password_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.EMPLOYEE
    permissions: list[str] = []

class UserRead(BaseModel):
    id: int
    username: str
    role: str
    custom_permissions: str | None

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "access_token": create_access_token(user.username),
        "token_type": "bearer",
    }

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in [role.value for role in self.allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return user

@router.post("/users", response_model=UserRead, dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if exists
    existing = await db.execute(select(User).where(User.username == data.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        role=data.role.value,
        custom_permissions=",".join(data.permissions) if data.permissions else ""
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/users", response_model=list[UserRead], dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
