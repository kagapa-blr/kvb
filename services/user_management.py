import os
from dotenv import load_dotenv
from model.models import db, User

load_dotenv()


def create_or_update_default_user():
    """
    Create default admin user if not exists.
    If exists, update the details including password.
    """

    username = os.getenv("DEFAULT_ADMIN_USERNAME")
    password = os.getenv("DEFAULT_ADMIN_PASSWORD")
    email = os.getenv("DEFAULT_ADMIN_EMAIL")
    phone = os.getenv("DEFAULT_ADMIN_PHONE")

    if not username or not password:
        print("Default admin credentials not provided in .env")
        return

    user = User.query.filter_by(username=username).first()

    if user:
        # Update existing user
        user.email = email
        user.phone_number = phone
        user.set_password(password)

        print("Default user updated.")

    else:
        # Create new user
        user = User(
            username=username,
            email=email,
            phone_number=phone
        )

        user.set_password(password)

        db.session.add(user)

        print("Default user created.")

    db.session.commit()