from flask import Flask

app_carto = Flask(__name__)

@app_carto.route('/')
def index():
    return "hello world ! Am I a boss ? YES !!"

if __name__ == "__main__":
    app_carto.run()
