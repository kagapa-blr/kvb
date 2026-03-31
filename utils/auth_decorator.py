"""
Authentication decorator for protecting routes.
Provides a decorator to require login for specific endpoints.
"""

from functools import wraps
from flask import session, redirect, url_for, current_app


def login_required(f):
    """
    Decorator to require login for a route.
    
    If user is not authenticated (no user_id in session),
    redirects to login page.
    
    Usage:
        @app.route('/protected')
        @login_required
        def protected_route():
            return render_template('protected.html')
    
    Or with blueprints:
        @blueprint.route('/protected')
        @login_required
        def protected_route():
            return render_template('protected.html')
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """
    Decorator to require admin user for a route.
    
    Currently uses the same check as login_required.
    Can be extended in future to check for specific admin role.
    
    Usage:
        @app.route('/admin-only')
        @admin_required
        def admin_route():
            return render_template('admin.html')
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        # TODO: Add role-based access control when needed
        return f(*args, **kwargs)
    return decorated_function
