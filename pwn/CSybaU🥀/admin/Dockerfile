FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    socat \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m ctf

WORKDIR /home/ctf

COPY CSybaU🥀 ./chall
COPY flag.txt .

RUN chmod +x chall
RUN chown root:root flag.txt && chmod 644 flag.txt

USER ctf

EXPOSE 6969

CMD ["socat","TCP-LISTEN:6969,reuseaddr,fork","EXEC:./chall"]
