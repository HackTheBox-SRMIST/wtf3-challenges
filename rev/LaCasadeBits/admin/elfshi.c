/*
 * CTF Challenge: "Trilateral" - Part 1/3 (Linux ELF)
 *
 * A custom 8-instruction stack-based VM that validates shard 1 of the flag.
 * The VM bytecode is the actual key checker — players must:
 *   1. Reverse the VM architecture
 *   2. Disassemble + understand the embedded bytecode
 *   3. Work backwards to find the accepted input
 *
 * Cross-binary dependency:
 *   MAGIC_PE_HASH is derived from SHA256(PE .text section)[0:4], baked in here.
 *   At solve time, players must have already analysed the PE binary.
 *
 * Build:
 *   gcc -O0 -s -o vm_chall vm_chall.c
 *   (strip symbols for extra pain: strip --strip-all vm_chall)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

/* -----------------------------------------------------------------------
 * Cross-binary constant — first 4 bytes of SHA256 of PE's .text section.
 * Players need to find this value from the PE binary first.
 * Change this to match your actual built PE binary.
 * ----------------------------------------------------------------------- */
#define MAGIC_PE_HASH  0xDEADC0DE

/* -----------------------------------------------------------------------
 * VM Architecture: stack-based, 8 instructions, 256-byte memory
 * Registers: IP (instruction pointer), SP (stack pointer), FLAG (zero flag)
 * Stack: 64 entries deep (uint32_t)
 * Memory: 256 bytes (shared data/code space — self-referential tricks possible)
 * ----------------------------------------------------------------------- */

#define MEM_SIZE    256
#define STACK_SIZE   64
#define MAX_STEPS  4096   /* Prevent infinite loops */

/* Opcodes */
#define OP_PUSH  0x01   /* PUSH <imm8>        — push immediate byte onto stack */
#define OP_LOAD  0x02   /* LOAD <addr8>       — push mem[addr] onto stack */
#define OP_STORE 0x03   /* STORE <addr8>      — pop stack, store into mem[addr] */
#define OP_ADD   0x04   /* ADD                — pop a,b; push (a+b) & 0xFF */
#define OP_XOR   0x05   /* XOR                — pop a,b; push a^b */
#define OP_CMP   0x06   /* CMP                — pop a,b; FLAG = (a==b) */
#define OP_JNE   0x07   /* JNE <addr8>        — if !FLAG, jump to addr */
#define OP_HALT  0x08   /* HALT <result8>     — terminate; result=0 fail,1 pass */

typedef struct {
    uint8_t  mem[MEM_SIZE];
    uint32_t stack[STACK_SIZE];
    uint8_t  ip;
    int8_t   sp;          /* -1 = empty */
    uint8_t  flag;
    int      halted;
    uint8_t  halt_result;
} VM;

/* -----------------------------------------------------------------------
 * Bytecode program — validates that the 8-byte input (stored at mem[0x10..0x17])
 * equals the expected key when each byte is XOR'd with (index + 0x5A) and
 * then the sum of all transformed bytes must equal MAGIC_PE_HASH & 0xFF.
 *
 * Expected input (the shard): "H4rD_V|V"  (players must derive this)
 *
 * Transformation per byte i:  transformed[i] = input[i] ^ (i + 0x5A)
 * Expected transformed values stored at mem[0x20..0x27]
 * Final checksum check against MAGIC_PE_HASH & 0xFF stored at mem[0x28]
 *
 * Bytecode layout starts at mem[0x40]
 * ----------------------------------------------------------------------- */

/* Helper: push expected transformed values + checksum into memory */
static void load_expected(VM *vm) {
    const char *key = "c4r_k3ys";   /* <-- shard 1 */
    uint8_t checksum = 0;
    for (int i = 0; i < 8; i++) {
        uint8_t t = ((uint8_t)key[i]) ^ (uint8_t)(i + 0x5A);
        vm->mem[0x20 + i] = t;
        checksum += t;
    }
    /* Checksum also entangled with cross-binary constant */
    vm->mem[0x28] = (uint8_t)(checksum ^ (MAGIC_PE_HASH & 0xFF));
}

/*
 * Bytecode:
 *
 * ; --- Check each of 8 bytes ---
 * ; For each index i (0..7):
 * ;   LOAD  input[0x10+i]
 * ;   PUSH  (i + 0x5A)
 * ;   XOR
 * ;   LOAD  expected[0x20+i]
 * ;   CMP
 * ;   JNE   FAIL
 *
 * ; --- Checksum pass ---
 * ;   Accumulate all transformed bytes, XOR with MAGIC_PE_HASH&0xFF
 * ;   CMP against mem[0x28]
 * ;   JNE FAIL
 *
 * ; --- Pass ---
 * ;   HALT 1
 * FAIL:
 * ;   HALT 0
 */
static void load_bytecode(VM *vm) {
    uint8_t *b = &vm->mem[0x40];
    int p = 0;

#define EMIT1(op)        b[p++] = (op)
#define EMIT2(op, a)     b[p++] = (op); b[p++] = (uint8_t)(a)

    /* Per-byte XOR checks */
    for (int i = 0; i < 8; i++) {
        EMIT2(OP_LOAD, 0x10 + i);           /* push input byte */
        EMIT2(OP_PUSH, i + 0x5A);           /* push XOR mask */
        EMIT1(OP_XOR);                       /* transform */
        EMIT2(OP_LOAD, 0x20 + i);           /* push expected */
        EMIT1(OP_CMP);                       /* compare */
        /* JNE to FAIL — we'll patch the address after we know it */
        EMIT2(OP_JNE, 0xFF);                /* 0xFF = placeholder */
    }

    /* Checksum accumulation */
    /* Push 0 as initial accumulator into mem[0x30] */
    EMIT2(OP_PUSH, 0x00);
    EMIT2(OP_STORE, 0x30);

    for (int i = 0; i < 8; i++) {
        EMIT2(OP_LOAD, 0x10 + i);
        EMIT2(OP_PUSH, i + 0x5A);
        EMIT1(OP_XOR);
        EMIT2(OP_LOAD, 0x30);
        EMIT1(OP_ADD);
        EMIT2(OP_STORE, 0x30);
    }

    /* XOR accumulator with MAGIC_PE_HASH & 0xFF */
    EMIT2(OP_LOAD, 0x30);
    EMIT2(OP_PUSH, (uint8_t)(MAGIC_PE_HASH & 0xFF));
    EMIT1(OP_XOR);
    EMIT2(OP_STORE, 0x30);

    /* CMP against mem[0x28] */
    EMIT2(OP_LOAD, 0x30);
    EMIT2(OP_LOAD, 0x28);
    EMIT1(OP_CMP);
    EMIT2(OP_JNE, 0xFF);   /* placeholder */

    /* PASS */
    EMIT2(OP_HALT, 0x01);

    /* FAIL — patch all 0xFF JNE targets to here */
    uint8_t fail_addr = (uint8_t)(0x40 + p);
    EMIT2(OP_HALT, 0x00);

    /* Patch JNE placeholders */
    for (int i = 0; i < p; i++) {
        if (b[i] == OP_JNE && b[i+1] == 0xFF) {
            b[i+1] = fail_addr;
        }
    }

#undef EMIT1
#undef EMIT2
}

/* -----------------------------------------------------------------------
 * VM Execution
 * ----------------------------------------------------------------------- */
static void vm_run(VM *vm) {
    int steps = 0;
    vm->ip = 0x40;   /* Bytecode starts at 0x40 */
    vm->sp = -1;
    vm->flag = 0;
    vm->halted = 0;

    while (!vm->halted && steps++ < MAX_STEPS) {
        uint8_t op = vm->mem[vm->ip++];

        switch (op) {
            case OP_PUSH: {
                uint8_t imm = vm->mem[vm->ip++];
                if (vm->sp >= STACK_SIZE - 1) { vm->halted = 1; break; }
                vm->stack[++vm->sp] = imm;
                break;
            }
            case OP_LOAD: {
                uint8_t addr = vm->mem[vm->ip++];
                if (vm->sp >= STACK_SIZE - 1) { vm->halted = 1; break; }
                vm->stack[++vm->sp] = vm->mem[addr];
                break;
            }
            case OP_STORE: {
                uint8_t addr = vm->mem[vm->ip++];
                if (vm->sp < 0) { vm->halted = 1; break; }
                vm->mem[addr] = (uint8_t)(vm->stack[vm->sp--] & 0xFF);
                break;
            }
            case OP_ADD: {
                if (vm->sp < 1) { vm->halted = 1; break; }
                uint32_t b = vm->stack[vm->sp--];
                uint32_t a = vm->stack[vm->sp--];
                vm->stack[++vm->sp] = (a + b) & 0xFF;
                break;
            }
            case OP_XOR: {
                if (vm->sp < 1) { vm->halted = 1; break; }
                uint32_t b = vm->stack[vm->sp--];
                uint32_t a = vm->stack[vm->sp--];
                vm->stack[++vm->sp] = a ^ b;
                break;
            }
            case OP_CMP: {
                if (vm->sp < 1) { vm->halted = 1; break; }
                uint32_t b = vm->stack[vm->sp--];
                uint32_t a = vm->stack[vm->sp--];
                vm->flag = (a == b) ? 1 : 0;
                break;
            }
            case OP_JNE: {
                uint8_t addr = vm->mem[vm->ip++];
                if (!vm->flag) vm->ip = addr;
                break;
            }
            case OP_HALT: {
                vm->halt_result = vm->mem[vm->ip++];
                vm->halted = 1;
                break;
            }
            default:
                /* Unknown opcode — silent crash, no hints */
                vm->halted = 1;
                vm->halt_result = 0;
                break;
        }
    }
}

/* -----------------------------------------------------------------------
 * Anti-tampering: obfuscate the VM struct size check at startup.
 * If someone patches memory sizes, this trips them up.
 * (Simple but effective noise for beginners/intermediates)
 * ----------------------------------------------------------------------- */
static void integrity_check(void) {
    volatile uint32_t x = sizeof(VM);
    volatile uint32_t y = x ^ 0xCAFEBABE;
    if ((y ^ 0xCAFEBABE) != x) {
        /* Silently corrupt flag area */
        exit(0);
    }
}

/* -----------------------------------------------------------------------
 * Main
 * ----------------------------------------------------------------------- */
int main(void) {
    integrity_check();

    VM *vm = calloc(1, sizeof(VM));
    if (!vm) return 1;

    /* Load expected values and bytecode into VM memory */
    load_expected(vm);
    load_bytecode(vm);

    /* Read 8-byte input from user */
    printf("Enter shard key: ");
    fflush(stdout);

    char input[64] = {0};
    if (!fgets(input, sizeof(input), stdin)) {
        free(vm);
        return 1;
    }

    /* Strip newline */
    size_t len = strlen(input);
    if (len > 0 && input[len-1] == '\n') input[--len] = '\0';

    if (len != 8) {
        puts("Wrong.");
        free(vm);
        return 1;
    }

    /* Load input into VM memory at 0x10..0x17 */
    for (int i = 0; i < 8; i++) {
        vm->mem[0x10 + i] = (uint8_t)input[i];
    }

    /* Run VM */
    vm_run(vm);

    if (vm->halt_result == 1) {
        printf("Correct! Shard 1: HTB{%s\n", input);
    } else {
        puts("Wrong.");
    }

    free(vm);
    return 0;
}