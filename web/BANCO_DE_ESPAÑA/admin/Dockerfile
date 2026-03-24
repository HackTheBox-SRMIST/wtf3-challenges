FROM python:3.12-slim

RUN apt update -y && apt install -y gcc && rm -rf /var/lin/apt/lists/*

COPY requirements.txt .

RUN pip install -r requirements.txt

WORKDIR /app

COPY . .

RUN chmod +x scripts/start.sh

EXPOSE 8000

CMD ["/bin/sh", "scripts/start.sh"]
