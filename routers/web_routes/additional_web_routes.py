import logging

from flask import Blueprint, render_template

logger = logging.getLogger(__name__)

additonal_web_routes = Blueprint("additonal_web_routes", __name__)


@additonal_web_routes.route('/akaradi-suchi', methods=["GET"])
def akaradi_suchi():
    return render_template('additional/akaradi-suchi.html')
