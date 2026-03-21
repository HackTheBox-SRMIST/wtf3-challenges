FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

RUN printf '%s\n' \
  "deb http://mirrors.ocf.berkeley.edu/kali kali-rolling main contrib non-free" \
  "# deb-src http://mirrors.ocf.berkeley.edu/kali kali-rolling main contrib non-free" \
  "deb http://mirrors.dotsrc.org/kali kali-rolling main contrib non-free" \
  "# deb-src http://mirrors.dotsrc.org/kali kali-rolling main contrib non-free" \
  "deb http://mirror.serverion.com/kali kali-rolling main contrib non-free" \
  "# deb-src http://mirror.serverion.com/kali kali-rolling main contrib non-free" \
  > /etc/apt/sources.list

RUN apt update && apt install -y \
    gcc \
    socat \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m ctf

WORKDIR /home/ctf

COPY vuln.c .
COPY flag.txt .

RUN gcc vuln.c -o vuln \
    -fno-stack-protector \
    -no-pie \
    -z lazy

RUN chmod +x vuln
RUN chown root:root flag.txt && chmod 400 flag.txt

USER ctf

EXPOSE 1337

CMD ["socat","TCP-LISTEN:1337,reuseaddr,fork","EXEC:./vuln"]
