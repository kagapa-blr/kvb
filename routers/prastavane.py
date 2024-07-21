from flask import Blueprint, render_template

# Create a Blueprint for the 'prastavane' routes
prastavane = Blueprint('prastavane', __name__, template_folder='templates')

# Define a route for the prastavane page
@prastavane.route('/prastavane')
def prastavane_page():
    return render_template('prastavane.html')
