#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void setup() {
  setvbuf(stdout, NULL, _IONBF, 0);
  setvbuf(stdin, NULL, _IONBF, 0);
  setvbuf(stderr, NULL, _IONBF, 0);
}

void banner() {
    printf("\n");
    printf("  ███╗   ██╗ ██████╗ ██╗   ██╗███████╗██╗      \n");
    printf("  ████╗  ██║██╔═══██╗██║   ██║██╔════╝██║      \n");
    printf("  ██╔██╗ ██║██║   ██║██║   ██║█████╗  ██║      \n");
    printf("  ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══╝  ██║      \n");
    printf("  ██║ ╚████║╚██████╔╝ ╚████╔╝ ███████╗███████╗ \n");
    printf("  ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚══════╝╚══════╝ \n");
    printf("            ██████╗  █████╗ ███╗   ██╗██╗  ██╗ \n");
    printf("            ██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝ \n");
    printf("            ██████╔╝███████║██╔██╗ ██║█████╔╝  \n");
    printf("            ██╔══██╗██╔══██║██║╚██╗██║██╔═██╗  \n");
    printf("            ██████╔╝██║  ██║██║ ╚████║██║  ██╗ \n");
    printf("            ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝\n");
    printf("\n");
    printf("        ┌─────────────────────────────┐\n");
    printf("        │  Your trust, our priority   │\n");
    printf("        │     Est. 2025 | 24/7 Help   │\n");
    printf("        └─────────────────────────────┘\n\n");
}

void win() {
  FILE *f = fopen("flag.txt", "r");
  char flag[64];

  if (f == NULL) {
    printf("MANAGER: flag.txt not found!\n");
    return;
  }

  fgets(flag, sizeof(flag), f);
  fclose(f);

  printf("MANAGER: H-How did you get in here?! Fine... here: %s\n", flag);
}

void check_acc() {
  static int is_there = 0;
  int check_number;
  printf("Enter account number:");
  scanf("%d", &check_number);

  if (is_there == 1) {
    printf("MANAGER: An account exists with this ID:%d\n", check_number);
    printf("MANAGER: Sir welimit only one account per customer but can change "
           "the IDs\nThankyou\n");
    return;
  }
  if (is_there == 0) {
    is_there = 1;
    printf(
        "\nMANAGER: Sir your account dosent exists. Let me create it for you");
    printf("\nMANAGER: Done!, Wonderfull Sir your account is created. Here is "
           "the ID:%d",
           check_number);
  }
}

void Manager() {
  char buf[32];
  int pass;

  printf("Enter pin: ");
  scanf("%d", &pass);
  getchar();

  if (pass < 0) {
    printf("MANAGER: Welcome... I wasn't expecting you.\n");
    printf("MANAGER: Since you're here, tell me something: ");
    read(0, buf, 256);
  } else {
    printf("The manager is busy....\n");
    return;
  }
}
void make_transaction() {
  int money;
  int balance = 0;
  printf("Enter the amount to transfer:");
  scanf("%d", &money);
  balance += money;
  printf("Money successfully transferred!"
         "\nCurrent balance: %d",
         balance);
}

void Bank() {
  int choice;
  while (1) {
    printf("\n1.Check your account"
           "\n2.Talk to the manager"
           "\n3.Make wire transactions"
           "\n4.Open shell account"
           "\nEnter Choice:");
    scanf("%d", &choice);
    switch (choice) {
    case 1:
      check_acc();
      break;
    case 2:
      Manager();
      break;
    case 3:
      make_transaction();
      break;
    case 4:
      check_acc();
      break;
    default:
      printf("Sir, you are holding the line. Please leave.\n");
      return;
    }
  }
}

int main() {
  setup();
  banner();
  Bank();
  printf("Goodbye!\n");
  return 0;
}

