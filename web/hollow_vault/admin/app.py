import os
from flask import Flask, request

app = Flask(__name__)

html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hollow Vault</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        body {{
            background-color: linear-gradient(135deg, #050510 0%, #1a1a2e 100%);
            color: #d1d8e0;
            font-family: 'Share Tech Mono', monospace;
            text-align: center;
            padding-top: 8%;
            margin: 0;
            height: 100vh;
        }}
        .container {{
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.02);
            background: rgba(17, 17, 17, 0.8);
            border-radius: 8px;
            backdrop-filter: blur(5px);
        }}
        h1 {{ color: #f39c12; text-shadow: 0 0 10px rgba(243, 156, 18, 0.5); font-size: 2.5em; margin-bottom: 20px;}}
        p {{ font-size: 1.2em; color: #8fa0b5; }}
        a {{ color: #00f0ff; text-decoration: none; padding: 5px; border-bottom: 1px dashed #00f0ff; transition: all 0.3s ease; }}
        a:hover {{ color: #fff; border-bottom: 1px solid #fff; text-shadow: 0 0 8px #00f0ff; }}
        pre {{ background: #0a0a0a; padding: 20px; border: 1px solid #333; max-width: 600px; margin: 20px auto; overflow-x: auto; text-align: left; color: #0f0; box-shadow: inset 0 0 10px #000; border-radius: 4px; }}
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
    content = '''
    <h1>The Hollow Vault</h1>
    <p>Highly secure file storage system. Completely impenetrable.</p>
    <p>Read the <a href="/read?file=about.txt">About Document</a> for more info.</p>
    '''
    return html_template.format(content=content)

@app.route('/read')
def read_file():
    filename = request.args.get('file')
    if not filename:
        return html_template.format(content="<h2>Error</h2><p>No file specified. Use ?file=filename</p>"), 400
    
    # INTENTIONAL DIRECTORY TRAVERSAL VULNERABILITY
    # Appending user input directly to the directory path without sanitization
    filepath = os.path.join('/app/public', filename)
    
    try:
        with open(filepath, 'r') as f:
            file_content = f.read()
        return html_template.format(content=f"<h2>Viewing: {filename}</h2><pre>{file_content}</pre>")
    except Exception as e:
        return html_template.format(content="<h2>Error</h2><p>File not found or access denied.</p>"), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
