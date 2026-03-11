# Love_Lies_Logs — Writeup


---

## Challenge Overview

Participants are given a single file:

```
challenge.jpg
```

The challenge description hints that the image may contain hidden data despite appearing like a normal viral meme image.

The objective is to analyze the file and recover the hidden flag.

---

## Step 1 — Initial File Inspection

Start by checking the file type.

```
file challenge.jpg
```

Output:

```
challenge.jpg: JPEG image data
```

The file appears to be a normal JPEG image.

Next, run `binwalk` to check for embedded data.

```
binwalk challenge.jpg
```

Output :

```
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
346297        0x548B9         Zip archive data, at least v1.0 to extract, compressed size: 49, uncompressed size: 49, name: flag.txt
346412        0x5492C         Zip archive data, at least v2.0 to extract, compressed size: 97676, uncompressed size: 566932, name: logs.txt
444310        0x6C796         End of Zip archive, footer length: 22


```

This indicates that a **ZIP archive is appended to the image**.

---

## Step 2 — Extract Embedded Files

Use binwalk extraction:

```
binwalk -e challenge.jpg
```

This creates an extraction directory containing:

```
flag.txt
logs.txt
```

---

## Step 3 — Investigate Extracted Files

Checking the fake flag:

```
flag.txt
```

Output:

`SFRCe2QxZF95MHVfcjM0bGx5X2QzY29kM183aDE1X2JsdWR9`
```
HTB{d1d_y0u_r34lly_d3cod3_7h15_blud}
```

This is clearly a **decoy**.

Next inspect `logs.txt`.

```
cat logs.txt
```

The file contains many lines of normal looking system logs related to image processing. But those are fake logs created to hide the png data inside it

To inspect hidden characters, use:

```
cat -A logs.txt
```

Although the logs look normal, this file is actually used as a **cover file for whitespace steganography**.

---

## Step 4 — Extract Hidden Data from Logs

The hidden data was embedded using `stegsnow`, which hides information using trailing spaces and tabs.

Extract the hidden message:

```
stegsnow logs.txt > recovered.hex
```

The extracted content looks like hexadecimal data.

```
8950e4740d0a1a0a0000000d4948445200000320000003200800000000fe
```

---

## Step 5 — Reconstruct the Hidden File

Convert the hex back into binary:

```
xxd -r -p recovered.hex > recovered.bin
```

Inspect the beginning of the file:

```
xxd recovered.bin | head
```

Output:

```
00000000: 8950 e474 0d0a 1a0a 0000 000d 4948 4452 
```

The file resembles a PNG image, but the header is slightly corrupted.

---

## Step 6 — Fix the PNG Header

The correct PNG signature is:

```
89 50 4E 47 0D 0A 1A 0A
```

However the recovered file contains:

```
89 50 E4 74 0D 0A 1A 0A
```

The bytes `E4 74` must be corrected to `4E 47`.

Open the file in a hex editor:

```
hexedit recovered.bin
```

Modify:

```
89 E4 74 58
```

to:

```
89 50 4E 47
```

Save the file as:

```
flag.png
```

---

## Step 7 — Recover the Flag

Open the repaired image:

```
eog flag.png
```

The image appears mostly white, but the flag is written in a small text in the corner.

---

## Final Flag

```
HTB{k1ng_ch4rl35_th3_4lph4_d0g}
```

---
