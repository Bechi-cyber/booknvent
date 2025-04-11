# app.py
from flask import Flask
from app.views import views
import os

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.urandom(24)

    # Ensure the static directory exists
    os.makedirs('static', exist_ok=True)

    # Register blueprints
    app.register_blueprint(views, url_prefix='/')

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
