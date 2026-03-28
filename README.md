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


========================================
PARVYA API ENDPOINTS
Prefix: /api/v1
========================================

[ PARVA ]

GET     /api/v1/parva
GET     /api/v1/parva/<parva_number>

POST    /api/v1/parva
PUT     /api/v1/parva/<parva_number>

DELETE  /api/v1/parva/<parva_number>


[ SANDHI ]

GET     /api/v1/sandhi/by_parva/<parva_number>

POST    /api/v1/sandhi

PUT     /api/v1/sandhi/<parva_number>/<sandhi_number>

DELETE  /api/v1/sandhi/<parva_number>/<sandhi_number>


[ PADYA ]

GET     /api/v1/padya/search

GET     /api/v1/padya/<parva_number>/<sandhi_number>/<padya_number>

POST    /api/v1/padya

PUT     /api/v1/padya/<parva_number>/<sandhi_number>/<padya_number>

DELETE  /api/v1/padya/<parva_number>/<sandhi_number>/<padya_number>


[ PAGINATION ]

?offset=0&limit=20