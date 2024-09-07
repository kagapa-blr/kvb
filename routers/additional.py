from flask import Blueprint, render_template

additonal_bp = Blueprint('additional', __name__)


@additonal_bp.get('/akaradi-suchi')
def akaradi_suchi():
    return render_template('additional/akaradi-suchi.html')
