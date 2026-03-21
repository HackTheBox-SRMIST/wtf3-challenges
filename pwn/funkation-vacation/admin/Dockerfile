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

COPY funkation-vacation .
COPY funkation-vacation.asm .
COPY funkation-vacation.o .
COPY linker.ld .
COPY Makefile .
COPY flag.txt .

RUN chmod +x funkation-vacation
RUN chown root:root flag.txt && chmod 400 flag.txt
RUN chmod 644 flag.txt

USER ctf

EXPOSE 1337

CMD ["socat","TCP-LISTEN:1337,reuseaddr,fork","EXEC:./funkation-vacation"]
