import os
import logging

from dotenv import load_dotenv
from model.models import db, User

load_dotenv()

logger = logging.getLogger(__name__)


def create_or_update_default_user():
    """
    Create default admin user if not exists.
    If exists, update the details including password.

    Safe to run multiple times (idempotent).
    """

    username = os.getenv("DEFAULT_ADMIN_USERNAME")
    password = os.getenv("DEFAULT_ADMIN_PASSWORD")
    email = os.getenv("DEFAULT_ADMIN_EMAIL")
    phone = os.getenv("DEFAULT_ADMIN_PHONE")

    if not username or not password:
        logger.warning(
            "Default admin credentials not provided in .env"
        )
        return None

    try:
        user = User.query.filter_by(
            username=username
        ).first()

        if user:
            # Update existing user
            user.email = email
            user.phone_number = phone

            if password:
                user.set_password(password)

            logger.info("Default user updated.")

        else:
            # Create new user
            user = User(
                username=username,
                email=email,
                phone_number=phone,
            )

            user.set_password(password)

            db.session.add(user)

            logger.info("Default user created.")

        db.session.commit()

        return user

    except Exception as e:
        db.session.rollback()

        logger.error(
            "Failed to create/update default user: %s",
            e
        )

        raise
