#include <stdio.h>
#include <unistd.h>

extern void (*__init_array_start[])(void);
extern void (*__init_array_end[])(void);
void vuln() {
  char buf[64];
  write(1, ">", 1);
  read(0, buf, 256);
}
// Had to write custom __libc_csu_init CSyabU🥀...
void __libc_csu_init(int edi, void *rsi, void *rdx) {
  __asm__ volatile(

      ".intel_syntax noprefix \n\t"

      "push r15 \n\t"
      "push r14 \n\t"
      "mov r15, rdx \n\t"
      "push r13 \n\t"
      "push r12 \n\t"
      "lea r12, __init_array_start[rip] \n\t"
      "push rbp \n\t"
      "lea rbp, __init_array_end[rip] \n\t"
      "push rbx \n\t"
      "mov r13d, edi \n\t"
      "mov r14, rsi \n\t"
      "sub rbp, r12 \n\t"
      "sub rsp, 8 \n\t"
      "sar rbp, 3 \n\t"

      "test rbp, rbp \n\t"
      "je 2f \n\t"
      "xor ebx, ebx \n\t"
      ".balign 16 \n\t"
      "1: \n\t"

      "mov rdx, r15 \n\t"
      "mov rsi, r14 \n\t"
      "mov edi, r13d \n\t"
      "call qword ptr [r12 + rbx*8] \n\t"

      "add rbx, 1 \n\t"
      "cmp rbp, rbx \n\t"
      "jne 1b \n\t"

      "2: \n\t"
      "add rsp, 8 \n\t"

      "pop rbx \n\t"
      "pop rbp \n\t"
      "pop r12 \n\t"
      "pop r13 \n\t"
      "pop r14 \n\t"
      "pop r15 \n\t"
      "ret \n\t"

      ".att_syntax prefix \n\t");
}

void __attribute__((constructor)) init_call() {}
int main() {
  vuln();
  return 0;
}
