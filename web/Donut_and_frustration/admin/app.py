from flask import Flask, render_template, request, jsonify, render_template_string, make_response
import os
import uuid

app = Flask(__name__)
app.secret_key = os.urandom(24)

# A dummy class so it registers in the subclasses list for our SSTI context
class DonutState(object):
    def __init__(self):
        pass

# Global state mapping session_id -> donuts_data list
sessions_data = {}

def get_default_donuts():
    return [
        {"name": "Glazed", "price": 5},
        {"name": "Chocolate", "price": 6},
        {"name": "Strawberry", "price": 5},
        {"name": "Vanilla", "price": 4},
        {"name": "flag", "price": float('inf'), "flag": "Ye gareeb"}
    ]

def get_or_create_session(req):
    session_id = req.cookies.get('donut_session')
    if not session_id or session_id not in sessions_data:
        session_id = str(uuid.uuid4())
        sessions_data[session_id] = get_default_donuts()
    return session_id

@app.route('/')
def index():
    session_id = get_or_create_session(request)
    resp = make_response(render_template('index.html'))
    resp.set_cookie('donut_session', session_id)
    return resp

@app.route('/api/donuts')
def api_donuts():
    session_id = get_or_create_session(request)
    resp_donuts = []
    
    user_donuts = sessions_data[session_id]
    
    for d in user_donuts:
        price = d['price']
        
        # Format infinity string for JSON
        if price == float('inf'):
            price_repr = "inf"
        else:
            price_repr = price

        if d['name'] == 'flag':
            # Check if prototype pollution / SSTI set the price to 0
            if str(price) == '0' or price == 0:
                resp_donuts.append({
                    "name": d['name'],
                    "price": 0,
                    "flag": "HTB{D0nut_D33z_Nu7z}"
                })
            else:
                resp_donuts.append({
                    "name": d['name'],
                    "price": price_repr,
                    "flag": d.get('flag', "Ye gareeb")
                })
        else:
            resp_donuts.append({
                "name": d['name'],
                "price": price_repr
            })
            
    resp = make_response(jsonify(resp_donuts))
    resp.set_cookie('donut_session', session_id)
    return resp

@app.route('/robots.txt')
def robots():
    return "User-agent: *\nDisallow: /under-construction\n"

@app.route('/under-construction')
def under_construction():
    session_id = get_or_create_session(request)
    resp = make_response(render_template('under_construction.html', result="Nothing to see here yet, site still in development."))
    resp.set_cookie('donut_session', session_id)
    return resp

@app.route('/under-construction/<path:payload>')
def under_construction_payload(payload):
    session_id = get_or_create_session(request)
    try:
        # Decode the payload in case it's URL encoded
        import urllib.parse
        decoded_payload = urllib.parse.unquote(payload)
        result = render_template_string(decoded_payload)
        resp = make_response(render_template('under_construction.html', result=result))
        resp.set_cookie('donut_session', session_id)
        return resp
    except Exception as e:
        resp = make_response(render_template('under_construction.html', result=f"Error evaluating template: {str(e)}"))
        resp.set_cookie('donut_session', session_id)
        return resp

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
