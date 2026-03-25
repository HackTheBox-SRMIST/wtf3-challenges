#include <stdio.h>
#include <stdint.h>
#include <string.h>

static uint32_t fnv1a32(const uint8_t *data, size_t n)
{
    uint32_t h = 0x811C9DC5u;
    for(size_t i=0;i<n;i++)
    {
        h ^= data[i];
        h *= 0x01000193u;
    }
    return h;
}

static uint32_t xorshift32(uint32_t x)
{
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return x;
}

/* solver must patch this */
volatile uint8_t g = 0;

static void decrypt_and_print(void)
{
    static const uint8_t k[16] =
    {
        0x13,0x37,0xC0,0xDE,0x42,0x99,0xAA,0x10,
        0x01,0x02,0x03,0x04,0x55,0x66,0x77,0x88
    };

    static const uint8_t ct[20] =
    {
        0xD2,0xC8,0x41,0x0F,0xFD,0xD4,0xAF,0x88,
        0x03,0xC1,0xA0,0x50,0xDC,0xAC,0xB5,0x1E,
        0x42,0x06,0x3A,0x55
    };

    uint32_t seed = fnv1a32(k,sizeof(k));
    uint32_t x = seed;

    uint8_t out[64];

    for(size_t i=0;i<sizeof(ct);i++)
    {
        x = xorshift32(x);
        out[i] = ct[i] ^ (uint8_t)(x & 0xff);
    }

    out[sizeof(ct)] = 0;

    puts("The flag is:");
    puts((char*)out);
}

int main()
{
    char buf[128];

    puts("== Secure Vault ==");
    printf("Enter password: ");

    if(!fgets(buf,sizeof(buf),stdin))
        return 0;

    buf[strcspn(buf,"\n")] = 0;

    uint32_t input_hash = fnv1a32((uint8_t*)buf,strlen(buf));

    /* hash of cytri_patch */
    uint32_t correct_hash = 0x3a8c1c92;

    if(input_hash == correct_hash && g == 1)
    {
        puts("Access granted.");
        decrypt_and_print();
    }
    else
    {
        puts("Wrong password.");
    }

    return 0;
}
