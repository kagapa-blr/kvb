import logging

from flask import Blueprint, render_template, session, redirect, url_for
from utils.auth_decorator import login_required

logger = logging.getLogger(__name__)

admin_ui_routes = Blueprint("admin_routes", __name__)


@admin_ui_routes.route('/admin/dashboard')
@login_required
def dashboard():
    """
    Admin Dashboard Route
    
    PROTECTED: Requires authentication (session['user_id'])
    
    FUNCTIONALITY:
    - Display admin dashboard with statistics
    - Manage users (create, edit, delete)
    - Manage parvas, sandhis, padyas
    - Upload and manage additional content
    
    ACCESS: Only authenticated users can access this endpoint
    """
    return render_template('admin/dashboard.html')
@admin_ui_routes.route('/admin/gadesuchigalu')
@login_required
def gadesuchigalu():

    return render_template('admin/gadesuchigalu.html')
