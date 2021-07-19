import os
from pathlib import Path
from flask import Flask, render_template, send_from_directory

from .utils.env import read_config

app = Flask(__name__, template_folder='../frontend')
CONFIG_FILE = Path(__file__).absolute().parent.parent / "config/config.toml"

config = read_config(CONFIG_FILE)
app.config.update(config)

@app.route('/')
def index():
    """ Délivrer la page html unique du site

    Parameters
    ----------

    Returns
    -------
    html
        index.html
    """
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    """ Délivrer le favicon.ico

    Parameters
    ----------

    Returns
    -------
    img
        icon favicon.ico
    """
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'images/favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == "__main__":
    app.run()
