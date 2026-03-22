FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache curl wget
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk add --no-cache py3-pip

WORKDIR /app

COPY . /app

# CTF Stuff :)
COPY flag.txt /flag.txt
RUN rm flag.txt

# Install the needed libraries (obviously using risky options)
RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

EXPOSE 5000

CMD ["python", "app.py"]
