# TO view website - 
fnb-yeg.github.io/index.html

# fnb-yeg.github.io

### To set up development environment on Windows (first time):
- Prereq: Have Python3 installed
- `python -m venv fnb-env` (use Python 3.8.2)
- `fnb-env\Scripts\activate.bat`
- `pip install flask`
- `set FLASK_APP=index.py`
- `set FLASK_ENV=development`
- `flask run`
- open http://127.0.0.1:5000 in browser

### To set up development env. on Windows (subsequent):
- `fnb-env\Scripts\activate.bat`
- `set FLASK_APP=index.py`
- `set FLASK_ENV=development`
- `flask run`
- open http://127.0.0.1:5000 in browswer
