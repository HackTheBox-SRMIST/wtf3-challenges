section .vacation progbits alloc exec write align=16

global _start

_start:
	mov rdi, 0x0
	mov rsi, rsp
	sub rsi, 0x8
	mov rdx, 0x106
	syscall
	ret
	pop rax
	ret

section .data

hello:
	db '/bin/sh', 0
