FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y socat && rm -rf /var/lib/apt/lists/*

RUN useradd -m ctf

WORKDIR /home/ctf

COPY chall .
COPY flag.txt .

RUN chmod +x chall \
    && chown ctf:ctf flag.txt \
    && chmod 400 flag.txt
USER ctf

EXPOSE 1337

CMD ["socat","TCP-LISTEN:1337,reuseaddr,fork","EXEC:./chall"]
