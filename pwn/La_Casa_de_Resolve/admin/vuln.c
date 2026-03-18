#include <unistd.h>

void __attribute__((naked)) setup() {
  __asm__(".intel_syntax noprefix\n"
          "pop rdi\nret\n"
          "pop rsi\nret\n"
          "pop rdx\nret\n"
          ".att_syntax prefix\n");
}

void main() {
  char buf[32];
  read(0, buf, 200);
}
