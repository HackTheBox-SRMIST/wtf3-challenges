## Analysis

The application just has a webpage displaying list of donuts.:
1. Check `/robots.txt` which reveals `/under-construction`.

2. `/under-construction/<payload>` which takes the URL path and renders it using `render_template_string()`. This is a classic Server-Side Template Injection (SSTI) vulnerability in Jinja2.

3. `/api/donuts` which returns a list of donuts and their prices.

Looking at `app.py`, we can see that our session's donuts are stored in a global dictionary called `sessions_data`. 
If the price of the "flag" donut (which is initially `inf`) becomes `0`, the `/api/donuts` endpoint will return the real flag .

This was made obvious in the AI Dev note as a hint (check HTML comment).

```python
        if d['name'] == 'flag':
            # Check if prototype pollution / SSTI set the price to 0
            if str(price) == '0' or price == 0:
                resp_donuts.append({
                    "name": d['name'],
                    "price": 0,
                    "flag": "HTB{D0nut_D33z_Nu7z}"
                })
```

## The Exploit

We can use the SSTI vulnerability to access the global `sessions_data` object and modify the price of the flag donut for our current session.

The donuts list has the flag at index 4 (the 5th item). 
We can access the Flask globals through built-in Jinja objects like `url_for` or `get_flashed_messages`.

Our session ID is stored in the `donut_session` cookie, which we can access via `request.cookies['donut_session']`.

We can loop through the MRO subclasses using a Jinja `for` loop to find `DonutState` dynamically, then update the array:

```jinja
{% for c in "".__class__.__mro__[1].__subclasses__() %}
{% if c.__name__ == "DonutState" %}
{{ c.__init__.__globals__["sessions_data"][request.cookies["donut_session"]][4].update({"price":0}) }}
{% endif %}
{% endfor %}
```

### Steps to Reproduce:
1. Get your session cookie (`donut_session`) by visiting the main page `/`.
2. Visit the `/under-construction/` endpoint with the URL-encoded SSTI payload.
3. The server will execute the template and update your session data in memory.
4. Visit `/api/donuts`. You will now see that the price of the flag donut is 0, and it reveals the flag.

"""Flag: HTB{D0nut_D33z_Nu7z}"""
