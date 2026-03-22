FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Setup 
RUN mkdir /app/public
RUN echo "Hollow Vault v1.0\nDesigned for maximum security, zero-trust architecture, and absolute data retention.\n\nFile systems are secured against all direct attacks." > /app/public/about.txt

# Create 
RUN echo "HTB{Why_3v3n_try_AtP?}" > /flag.txt

COPY . .

EXPOSE 5000

# Create a non-root user
RUN useradd -m ctfuser && chown -R ctfuser:ctfuser /app

RUN chmod 444 /flag.txt

USER ctfuser
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
