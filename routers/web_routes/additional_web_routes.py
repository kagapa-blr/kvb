from flask import Blueprint, render_template
from utils.logger import get_logger

logger = get_logger()

additonal_web_routes = Blueprint("additonal_web_routes", __name__)


@additonal_web_routes.route('/akaradi-suchi', methods=["GET"])
def akaradi_suchi():
    return render_template('additional/akaradi-suchi.html')

@additonal_web_routes.route('/gade-suchi', methods=["GET"])
def gade_suchi():
    return render_template('additional/gadegala-suchi.html')


@additonal_web_routes.route('/tippani', methods=["GET"])
def tippani():
    return render_template('additional/tippani.html')