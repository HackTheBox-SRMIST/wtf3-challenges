OUTPUT_FORMAT("elf64-x86-64")
ENTRY(_start)

PHDRS
{
    headers PT_LOAD;
    vacation PT_LOAD;
}

SECTIONS
{
    . = 0x42000;

    .vacation 0x43000 : {
        *(.vacation);
    } :vacation
}
