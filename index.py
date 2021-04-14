from flask import Flask, render_template

app = Flask(__name__)

# Note that best practice for Flask might be to have each 
# app.route function in its own (self-named) python file
# if/when these methods get more complex, we can do that. 

@app.route('/')
def index():
    return render_template('mission_statement.html')

@app.route('/mission_statement')
def mission_statement():
    return render_template('mission_statement.html')

@app.route('/affiliated_organizations')
def affiliated_organizations():
	return render_template('affiliated_organizations.html')

@app.route('/contact_us')
def contact_us():
	return render_template('contact_us.html')

@app.route('/how_to_join')
def how_to_join():
	return render_template('how_to_join.html')

@app.route('/recent_and_upcoming_activity')
def recent_and_upcoming_activity():
	return render_template('recent_and_upcoming_activity.html')

@app.route('/history')
def history():
	return render_template('history.html')