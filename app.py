from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/simulation')
def simulation():
    return render_template('simulation.html')

@app.route('/sandbox')
def sandbox():
    return render_template('sandbox.html')

if __name__ == '__main__':
    app.run(debug=True)
