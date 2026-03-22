from flask import Flask, request

app = Flask(__name__)

html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share+Tech+Mono&display=swap');
        body {{
            margin: 0;
            padding: 0;
            background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
            color: #d1d8e0;
            font-family: 'Share Tech Mono', monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
            overflow: hidden;
        }}
        .container {{
            background: rgba(0, 0, 0, 0.6);
            padding: 3rem 4rem;
            border-radius: 10px;
            border: 1px solid {border_color};
            box-shadow: 0 0 30px {shadow_color}, inset 0 0 20px rgba(0,0,0,0.8);
            animation: pulse-border 2s infinite alternate;
            backdrop-filter: blur(5px);
            max-width: 600px;
        }}
        h1 {{
            font-family: 'Orbitron', sans-serif;
            margin-bottom: 1rem;
            color: {color};
            text-shadow: 0 0 10px {shadow_color}, 0 0 20px {shadow_color};
            letter-spacing: 1px;
        }}
        p {{
            font-size: 1.2rem;
            line-height: 1.5;
        }}
        .flag {{
            margin-top: 2rem;
            font-size: 2.2rem;
            font-weight: bold;
            color: #00f0ff;
            text-shadow: 0 0 15px rgba(0, 240, 255, 0.8), 0 0 30px rgba(0, 240, 255, 0.4);
            letter-spacing: 2px;
        }}
        @keyframes pulse-border {{
            from {{ box-shadow: 0 0 15px {shadow_color}, inset 0 0 10px rgba(0,0,0,0.8); }}
            to {{ box-shadow: 0 0 35px {shadow_color}, inset 0 0 25px rgba(0,0,0,0.8); }}
        }}
    </style>
</head>
<body>
    <div class="container">
        {content}
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    user_agent = request.headers.get('User-Agent', '')
    
    if user_agent == 'Raquel':
        content = '''
        <h1>Authentication Successful</h1>
        <p>Welcome back, Agent Raquel. Here is your classified objective data:</p>
        <div class="flag">HTB{C1imb_th3_D4m_Tr33}</div>
        '''
        return html_template.format(
            title="Access Granted",
            color="#00f0ff",
            border_color="rgba(0, 240, 255, 0.4)",
            shadow_color="rgba(0, 240, 255, 0.3)",
            content=content
        )
    else:
        content = '''
        <h1>Access Denied</h1>
        <p>Intruder detected. Only Agent Raquel can get the flag.<br>Shoo away!</p>
        <p style="font-size: 0.9em; opacity: 0.4; margin-top: 30px; font-family: monospace;">[System logged unauthorized User-Agent attempt]</p>
        '''
        return html_template.format(
            title="Access Denied",
            color="#ff0055",
            border_color="rgba(255, 0, 85, 0.4)",
            shadow_color="rgba(255, 0, 85, 0.3)",
            content=content
        ), 403

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
