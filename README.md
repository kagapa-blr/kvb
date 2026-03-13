## Git repository commands

```bash
git rm -r -f --cached . 
git add .
git commit -m "Clear cache"

```

# Flask Database Migration Guide

This guide provides the steps to set up and manage database migrations using Flask-Migrate in a Flask application.

## Prerequisites

Ensure you have the following installed:

- Python
- Flask
- Flask-SQLAlchemy

## Installation

First, install the Flask-Migrate package:

```bash
pip install Flask-Migrate
flask db init
flask db migrate -m "Add example_column to User model"
flask db upgrade
Rollback migration
flask db downgrade
```

alembic migration
```bash
alembic init migrations
alembic revision --autogenerate -m "initial schema updated"
alembic upgrade head
```