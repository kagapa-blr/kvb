import logging

from flask import Blueprint, render_template

logger = logging.getLogger(__name__)

admin_ui_routes = Blueprint("admin_routes", __name__)


@admin_ui_routes.route('/admin/parva')
def kavya():
    return render_template('admin/parva_management.html')

@admin_ui_routes.route('/admin/dashboard')
def dashboard():
    return render_template('admin/dashboard.html')
