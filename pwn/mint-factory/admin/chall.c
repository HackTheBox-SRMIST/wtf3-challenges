#include<stdio.h>

void mint(){
  FILE *f = fopen("flag.txt", "r");
  char flag[64];
  fgets(flag, sizeof(flag), f);
  printf("[MINT] Flag: %s\n", flag);
  fclose(f);
}

void login(){
  char buf[64];
  gets(buf);
}

int main() {
  setvbuf(stdout, NULL, _IONBF, 0);
  printf("[MINT] Enter id: ");
  login();
  return 0;
}
